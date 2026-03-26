"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

interface ProspectReview {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
}

interface ScrapeForProspectResult {
  reviews: ProspectReview[]
  totalReviews: number
  averageRating: number
  warning?: string
}

export async function scrapeForProspect(
  googleUrl: string
): Promise<ScrapeForProspectResult> {
  if (!googleUrl || typeof googleUrl !== "string" || !googleUrl.trim()) {
    throw new Error("Google Business URL is required")
  }

  const { scrapeGoogleReviews } = await import("@/lib/scraper")
  const result = await scrapeGoogleReviews(googleUrl.trim())

  // Assign UUIDs to each review for selection tracking
  const reviews: ProspectReview[] = result.reviews.map((r, i) => ({
    id: crypto.randomUUID(),
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

interface SaveProspectData {
  googleUrl: string
  contactName?: string
  companyName?: string
  phone?: string
  notes?: string
  reviewSnapshot: Array<{
    reviewer_name: string
    star_rating: number
    review_text: string | null
    review_date: string | null
  }>
  selectedReviewIds: string[]
  originalRating: number
  projectedRating: number
}

export async function saveProspect(
  data: SaveProspectData
): Promise<{ id: string }> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  const supabase = createServerClient()

  const { data: prospect, error } = await supabase
    .from("prospects")
    .insert({
      created_by_type: session.user_type,
      created_by_id: session.user_id,
      google_url: data.googleUrl,
      contact_name: data.contactName || null,
      company_name: data.companyName || null,
      phone: data.phone || null,
      notes: data.notes || null,
      status: "prospect",
      review_snapshot: data.reviewSnapshot,
      selected_review_ids: data.selectedReviewIds,
      original_rating: data.originalRating,
      projected_rating: data.projectedRating,
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to save prospect: ${error.message}`)
  }

  return { id: prospect.id }
}
