"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProspectReview {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
}

interface ScrapeResult {
  reviews: ProspectReview[]
  totalReviews: number
  averageRating: number
  warning?: string
}

// ─── Scrape ─────────────────────────────────────────────────────────────────

export async function scrapeForDirectSale(
  googleUrl: string,
): Promise<ScrapeResult> {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    throw new Error("Unauthorized")
  }

  if (!googleUrl || typeof googleUrl !== "string" || !googleUrl.trim()) {
    throw new Error("Google Business URL is required")
  }

  const { scrapeGoogleReviews } = await import("@/lib/scraper")
  const result = await scrapeGoogleReviews(googleUrl.trim())

  const reviews: ProspectReview[] = result.reviews.map((r, i) => ({
    id: `temp-${i}`,
    reviewer_name: r.reviewer_name,
    star_rating: r.star_rating,
    review_text: r.review_text || null,
    review_date: r.review_date || null,
  }))

  const totalReviews = reviews.length
  const totalStars = reviews.reduce((sum, r) => sum + r.star_rating, 0)
  const averageRating =
    totalReviews > 0
      ? Math.round((totalStars / totalReviews) * 100) / 100
      : 0

  return {
    reviews,
    totalReviews,
    averageRating,
    ...(result.error ? { warning: result.error } : {}),
  }
}

// ─── Create Direct Sale ─────────────────────────────────────────────────────

interface DirectSaleData {
  businessName: string
  contactName: string
  email: string
  phone?: string
  address?: string
  googleUrl: string
  reviewSnapshot: Array<{
    reviewer_name: string
    star_rating: number
    review_text: string | null
    review_date: string | null
  }>
  selectedReviewIds: string[]
  totalPrice: number
  pricePerReview: number
  notes?: string
}

export async function createDirectSale(data: DirectSaleData): Promise<{
  clientId: string
  contractId: string
  signingToken: string
  reviewCount: number
  error?: string
}> {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { clientId: "", contractId: "", signingToken: "", reviewCount: 0, error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // 1. Create client (owner-direct, no reseller/SP)
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      business_name: data.businessName.trim(),
      owner_name: data.contactName.trim(),
      owner_email: data.email.trim(),
      owner_phone: data.phone?.trim() || null,
      address: data.address?.trim() || "",
      google_url: data.googleUrl.trim(),
      reseller_id: session.user_id, // owner is the "reseller" for direct sales
      salesperson_id: null,
      status: "pending",
      notes: data.notes || null,
    })
    .select("id")
    .single()

  if (clientError || !client) {
    return {
      clientId: "",
      contractId: "",
      signingToken: "",
      reviewCount: 0,
      error: clientError?.message || "Failed to create client",
    }
  }

  // 2. Insert all scraped reviews
  const reviewRows = data.reviewSnapshot.map((r) => ({
    client_id: client.id,
    platform: "google" as const,
    reviewer_name: r.reviewer_name,
    star_rating: r.star_rating,
    review_text: r.review_text || null,
    review_date: r.review_date || null,
    status: "active" as const,
  }))

  if (reviewRows.length > 0) {
    await supabase.from("reviews").insert(reviewRows)
  }

  // 3. Get inserted review IDs and map selected ones by index
  const { data: insertedReviews } = await supabase
    .from("reviews")
    .select("id, reviewer_name")
    .eq("client_id", client.id)
    .order("created_at", { ascending: true })

  // Map selected temp IDs back to real IDs by reviewer name (via index)
  const selectedReviewerNames = data.selectedReviewIds
    .map((id) => {
      const idx = parseInt(id.replace("temp-", ""))
      return data.reviewSnapshot[idx]?.reviewer_name
    })
    .filter(Boolean)

  const selectedRealIds = (insertedReviews || [])
    .filter((r) => selectedReviewerNames.includes(r.reviewer_name))
    .map((r) => r.id)

  // 4. Create contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      client_id: client.id,
      reseller_id: session.user_id,
      salesperson_id: null,
      selected_review_ids: selectedRealIds,
      google_review_count: selectedRealIds.length,
      contract_rate_google: data.totalPrice,
      bts_base_google: data.totalPrice, // owner keeps 100%
      status: "draft",
      generated_at: new Date().toISOString(),
    })
    .select("id, signing_token")
    .single()

  if (contractError) {
    return {
      clientId: client.id,
      contractId: "",
      signingToken: "",
      reviewCount: 0,
      error: contractError.message,
    }
  }

  // 5. Update selected reviews to in_progress with contract_id
  if (selectedRealIds.length > 0) {
    await supabase
      .from("reviews")
      .update({ status: "in_progress", contract_id: contract!.id })
      .in("id", selectedRealIds)
  }

  // 6. Update client status
  await supabase
    .from("clients")
    .update({ status: "in_progress" })
    .eq("id", client.id)

  return {
    clientId: client.id,
    contractId: contract!.id,
    signingToken: contract!.signing_token ?? "",
    reviewCount: selectedRealIds.length,
  }
}

// ─── Generate PDF ───────────────────────────────────────────────────────────

export async function generateDirectSaleContract(contractId: string): Promise<{
  pdf?: string
  filename?: string
  error?: string
}> {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: contract } = await supabase
    .from("contracts")
    .select("*, clients(*)")
    .eq("id", contractId)
    .single()

  if (!contract) return { error: "Contract not found" }

  const client = contract.clients as Record<string, unknown>

  // Get selected reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .in("id", contract.selected_review_ids || [])

  // Generate PDF using the existing contract generator
  const { generateContractPDF } = await import("@/lib/contract")
  const pdfBytes = await generateContractPDF({
    client: client as any,
    selectedReviews: (reviews || []) as any[],
    contractRate: contract.contract_rate_google,
  })

  const base64 = Buffer.from(pdfBytes).toString("base64")
  const businessName = (client.business_name as string) || "Client"
  const filename = `DRMC-${businessName.replace(/[^a-zA-Z0-9]/g, "_")}-${contractId.slice(0, 8)}.pdf`

  return { pdf: base64, filename }
}

// ─── Email Contract ─────────────────────────────────────────────────────────
// NOTE: Email is sent from the client component via fetch to /api/email,
// which has access to the session cookie. No server action needed.
