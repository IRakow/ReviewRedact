import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { scrapeGoogleReviews } from "@/lib/scraper"
import { calculateSplits, resolveCommissionPlan } from "@/lib/commissions"
import { generateInvoicePDF } from "@/lib/invoice"
import { notify } from "@/lib/notifications"
import { INVOICE_DUE_HOURS } from "@/lib/constants"
import { randomUUID } from "crypto"

/**
 * Automated scraping cron — runs 3x daily.
 * Checks all in_progress reviews, re-scrapes, detects removals,
 * and triggers per-review invoicing.
 */
export async function GET() {
  const supabase = createServerClient()

  // Find all reviews currently in_progress
  const { data: inProgressReviews, error } = await supabase
    .from("reviews")
    .select("id, client_id, reviewer_name, review_text, star_rating")
    .eq("status", "in_progress")

  if (error || !inProgressReviews || inProgressReviews.length === 0) {
    return NextResponse.json({ message: "No in-progress reviews to check", checked: 0 })
  }

  // Group reviews by client
  const byClient: Record<string, typeof inProgressReviews> = {}
  for (const review of inProgressReviews) {
    if (!byClient[review.client_id]) byClient[review.client_id] = []
    byClient[review.client_id].push(review)
  }

  let totalChecked = 0
  let totalRemoved = 0
  let totalInvoiced = 0

  for (const [clientId, reviews] of Object.entries(byClient)) {
    // Fetch client details
    const { data: client } = await supabase
      .from("clients")
      .select("google_url, business_name, owner_name, owner_email, address, reseller_id, salesperson_id")
      .eq("id", clientId)
      .single()

    if (!client?.google_url) continue

    // Re-scrape
    let scrapedReviews: Array<{ reviewer_name: string; review_text: string | null }>
    try {
      const result = await scrapeGoogleReviews(client.google_url)
      scrapedReviews = result.reviews
    } catch {
      console.error(`Scrape failed for client ${clientId}`)
      continue
    }

    totalChecked += reviews.length

    // Check each in_progress review against scraped results
    const scrapedNames = new Set(scrapedReviews.map((r) => r.reviewer_name.toLowerCase()))

    for (const review of reviews) {
      const stillExists = scrapedNames.has(review.reviewer_name.toLowerCase())

      if (!stillExists) {
        // Review is removed! Trigger per-review invoice
        totalRemoved++

        // Mark as removed
        await supabase
          .from("reviews")
          .update({ status: "removed", removal_date: new Date().toISOString() })
          .eq("id", review.id)

        // Find the contract for this review
        const { data: contract } = await supabase
          .from("contracts")
          .select("id, contract_rate_google, reseller_id, salesperson_id")
          .contains("selected_review_ids", [review.id])
          .single()

        if (!contract) continue

        const clientRate = contract.contract_rate_google ?? 0

        // Get reseller + salesperson details for commission calculation
        let resellerData: { id: string; baseRate: number; email: string; name: string } | undefined
        let salespersonData: { id: string; parentType: string; pricingPlan: string | null; baseRate: number; email: string; name: string } | undefined

        let resellerPlan: { type: string; config: Record<string, unknown> } | undefined

        if (contract.reseller_id) {
          const { data: reseller } = await supabase
            .from("resellers")
            .select("id, base_rate_google, email, name, commission_plan_type, commission_plan_config")
            .eq("id", contract.reseller_id)
            .single()
          if (reseller) {
            resellerData = { id: reseller.id, baseRate: reseller.base_rate_google, email: reseller.email, name: reseller.name }
            resellerPlan = { type: reseller.commission_plan_type, config: reseller.commission_plan_config as Record<string, unknown> }
          }
        }

        let spPlan: { type: string; config: Record<string, unknown> } | undefined

        if (contract.salesperson_id) {
          const { data: sp } = await supabase
            .from("salespeople")
            .select("id, parent_type, pricing_plan, base_rate_google, email, name, commission_plan_type, commission_plan_config")
            .eq("id", contract.salesperson_id)
            .single()
          if (sp) {
            salespersonData = {
              id: sp.id,
              parentType: sp.parent_type,
              pricingPlan: sp.pricing_plan,
              baseRate: sp.base_rate_google,
              email: sp.email,
              name: sp.name,
            }
            if (sp.commission_plan_type) {
              spPlan = { type: sp.commission_plan_type, config: sp.commission_plan_config as Record<string, unknown> }
            }
          }
        }

        // Resolve effective commission plan (SP override → reseller global → fixed)
        const commissionPlan = salespersonData?.parentType === "reseller"
          ? resolveCommissionPlan(
              resellerPlan ? { commission_plan_type: resellerPlan.type as "fixed" | "base_split" | "percentage" | "flat_fee", commission_plan_config: resellerPlan.config } : undefined,
              spPlan ? { commission_plan_type: spPlan.type as "fixed" | "base_split" | "percentage" | "flat_fee", commission_plan_config: spPlan.config } : undefined,
            )
          : undefined

        // Calculate splits
        const splits = calculateSplits({
          clientRate,
          platform: "google",
          salesperson: salespersonData ? {
            exists: true,
            parentType: salespersonData.parentType as "reseller" | "owner",
            pricingPlan: salespersonData.pricingPlan as "reseller_set" | "owner_plan_a" | "owner_plan_b" | null,
            baseRateGoogle: salespersonData.baseRate,
          } : undefined,
          commissionPlan,
        })

        // Generate payment token
        const paymentToken = randomUUID()
        const sentAt = new Date()
        const dueAt = new Date(sentAt.getTime() + INVOICE_DUE_HOURS * 60 * 60 * 1000)

        // Create invoice (per-review — each removal = its own invoice)
        const { data: invoice } = await supabase
          .from("invoices")
          .insert({
            contract_id: contract.id,
            client_id: clientId,
            reseller_id: contract.reseller_id,
            salesperson_id: contract.salesperson_id,
            review_ids: [review.id],
            total_amount: clientRate,
            bts_base_amount: splits.bts,
            reseller_amount: splits.reseller,
            salesperson_amount: splits.salesperson,
            status: "sent",
            payment_token: paymentToken,
            sent_at: sentAt.toISOString(),
            due_at: dueAt.toISOString(),
          })
          .select("id")
          .single()

        if (!invoice) continue

        // Update review status to waiting_for_payment
        await supabase
          .from("reviews")
          .update({ status: "waiting_for_payment" })
          .eq("id", review.id)

        totalInvoiced++

        // Generate invoice PDF
        const pdfBytes = await generateInvoicePDF({
          invoiceId: invoice.id,
          clientBusinessName: client.business_name,
          clientOwnerName: client.owner_name ?? "",
          clientEmail: client.owner_email ?? "",
          clientAddress: client.address ?? "",
          reviewerName: review.reviewer_name,
          reviewSnippet: review.review_text ?? "",
          totalAmount: clientRate,
          btsBaseAmount: splits.bts,
          resellerAmount: splits.reseller,
          salespersonAmount: splits.salesperson,
          sentAt: sentAt.toISOString(),
          dueAt: dueAt.toISOString(),
          paymentToken,
        })

        const pdfBase64 = Buffer.from(pdfBytes).toString("base64")
        const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://reviewredact.com"}/pay/${paymentToken}`

        // Send notifications
        // 1. Congrats to reseller + salesperson (NO pricing)
        await notify({
          event: "review_removed",
          metadata: {
            reviewerName: review.reviewer_name,
            reviewSnippet: review.review_text ?? "",
            clientBusinessName: client.business_name,
            resellerEmail: resellerData?.email,
            resellerName: resellerData?.name,
            salespersonEmail: salespersonData?.email,
            salespersonName: salespersonData?.name,
            resellerId: resellerData?.id,
            salespersonId: salespersonData?.id,
          },
        })

        // 2. Invoice to client + copy to owners
        if (client.owner_email) {
          await notify({
            event: "invoice_sent",
            metadata: {
              clientEmail: client.owner_email,
              clientBusinessName: client.business_name,
              clientOwnerName: client.owner_name,
              invoiceAmount: clientRate,
              paymentUrl,
              pdfBase64,
              filename: `Invoice-${invoice.id.slice(0, 8)}.pdf`,
            },
          })
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    checked: totalChecked,
    removed: totalRemoved,
    invoiced: totalInvoiced,
    timestamp: new Date().toISOString(),
  })
}
