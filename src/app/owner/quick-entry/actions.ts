"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createQuickClient(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const businessName = (formData.get("business_name") as string)?.trim()
  if (!businessName) return { error: "Business name is required" }

  const googleUrl = (formData.get("google_url") as string)?.trim()
  if (!googleUrl) return { error: "Google Maps URL is required" }

  const ownerName = (formData.get("owner_name") as string)?.trim() || "TBD"
  const address = (formData.get("address") as string)?.trim() || "TBD"
  const businessPhone = (formData.get("business_phone") as string)?.trim() || null

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("clients")
    .insert({
      reseller_id: session.user_id,
      business_name: businessName,
      owner_name: ownerName,
      address,
      business_phone: businessPhone,
      google_url: googleUrl,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) return { error: `Failed to create client: ${error.message}` }

  // Auto-scrape reviews immediately so the client page has data
  try {
    const { scrapeGoogleReviews } = await import("@/lib/scraper")
    const result = await scrapeGoogleReviews(googleUrl)

    if (result.reviews.length > 0) {
      const reviewRows = result.reviews.map((r) => ({
        client_id: data.id,
        platform: "google" as const,
        reviewer_name: r.reviewer_name,
        star_rating: r.star_rating,
        review_text: r.review_text,
        review_date: r.review_date,
        status: "active" as const,
      }))

      await supabase.from("reviews").insert(reviewRows)

      // Save snapshot
      const avgRating =
        result.reviews.reduce((sum, r) => sum + r.star_rating, 0) /
        result.reviews.length

      await supabase.from("snapshots").insert({
        client_id: data.id,
        total_reviews: result.reviews.length,
        average_rating: Math.round(avgRating * 100) / 100,
      })
    }
  } catch {
    // Scrape failure shouldn't block client creation — they can re-scrape from the detail page
  }

  revalidatePath("/owner/clients")
  redirect(`/owner/clients/${data.id}`)
}

export async function createQuickEntry(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const title = (formData.get("title") as string)?.trim()
  if (!title) return { error: "Title is required" }

  const type = (formData.get("type") as string) || "misc"
  const contactName = (formData.get("contact_name") as string)?.trim() || null
  const contactEmail = (formData.get("contact_email") as string)?.trim() || null
  const contactPhone = (formData.get("contact_phone") as string)?.trim() || null
  const linkUrl = (formData.get("link_url") as string)?.trim() || null
  const amountStr = (formData.get("amount") as string)?.trim()
  const amount = amountStr ? parseFloat(amountStr) : 0
  const notes = (formData.get("notes") as string)?.trim() || null
  const notifyRaw = (formData.get("notify_emails") as string)?.trim() || ""
  const notifyEmails = notifyRaw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"))

  const { error } = await supabase.from("quick_entries").insert({
    title,
    type,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    link_url: linkUrl,
    amount,
    notes,
    notify_emails: notifyEmails,
    status: "open",
    created_by: session.user_id,
  })

  if (error) return { error: error.message }

  // Send notification emails if any
  if (notifyEmails.length > 0) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : ""}${process.env.NODE_ENV === "production" ? "https://reviewredact.com" : "http://localhost:3000"}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notifyEmails,
          subject: `[ReviewRedact] ${type === "free_demo" ? "Free Demo" : type === "comp" ? "Comp" : "Quick Entry"}: ${title}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2 style="color: #c9a96e;">${title}</h2>
              <p><strong>Type:</strong> ${type.replace(/_/g, " ")}</p>
              ${contactName ? `<p><strong>Contact:</strong> ${contactName}</p>` : ""}
              ${contactEmail ? `<p><strong>Email:</strong> ${contactEmail}</p>` : ""}
              ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ""}
              ${amount > 0 ? `<p><strong>Amount:</strong> $${amount.toFixed(2)}</p>` : amount === 0 ? `<p><strong>Amount:</strong> FREE</p>` : ""}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
              <p style="font-size: 12px; color: #999;">Sent from ReviewRedact Quick Entry</p>
            </div>
          `,
        }),
      })
    } catch {
      // Email failure shouldn't block the entry creation
    }
  }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}

export async function updateEntryStatus(id: string, status: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("quick_entries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}

export async function deleteEntry(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const { error } = await supabase.from("quick_entries").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}
