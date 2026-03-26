"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { verifyClientAccess } from "@/lib/auth"

export async function updateReviewStatus(reviewId: string, status: string) {
  const session = await getSession()
  if (!session) redirect("/")

  const validStatuses = ["active", "in_progress", "removed", "waiting_for_payment", "paid", "failed"]
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status")
  }

  const supabase = createServerClient()

  // Verify ownership through the review's client
  const { data: review } = await supabase
    .from("reviews")
    .select("client_id")
    .eq("id", reviewId)
    .single()

  if (!review) {
    throw new Error("Review not found")
  }

  await verifyClientAccess(session, review.client_id)

  const updateData: Record<string, string | null> = { status }
  if (status === "removed") {
    updateData.removal_date = new Date().toISOString()
  }

  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", reviewId)

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`)
  }
}

export async function takeSnapshot(clientId: string) {
  const session = await getSession()
  if (!session) redirect("/")

  await verifyClientAccess(session, clientId)

  const supabase = createServerClient()

  // Compute average from active reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("star_rating")
    .eq("client_id", clientId)
    .eq("status", "active")

  const activeReviews = reviews ?? []
  const totalReviews = activeReviews.length
  const totalStars = activeReviews.reduce((sum, r) => sum + r.star_rating, 0)
  const averageRating = totalReviews > 0 ? totalStars / totalReviews : null

  const { error } = await supabase.from("snapshots").insert({
    client_id: clientId,
    average_rating: averageRating,
    total_reviews: totalReviews,
    total_stars: totalStars,
    platform: "google",
  })

  if (error) {
    throw new Error(`Failed to take snapshot: ${error.message}`)
  }
}

export async function triggerScrape(clientId: string) {
  const session = await getSession()
  if (!session) redirect("/")

  await verifyClientAccess(session, clientId)

  const supabase = createServerClient()

  // Fetch client with google_url
  const { data: client } = await supabase
    .from("clients")
    .select("google_url")
    .eq("id", clientId)
    .single()

  if (!client) {
    throw new Error("Client not found")
  }

  // Scrape directly (not via API route)
  const { scrapeGoogleReviews } = await import("@/lib/scraper")
  const result = await scrapeGoogleReviews(client.google_url)

  if (result.reviews.length === 0) {
    throw new Error("No reviews found")
  }

  // Delete existing reviews for fresh scrape
  await supabase.from("reviews").delete().eq("client_id", clientId)

  // Insert new reviews
  const reviewRows = result.reviews.map((r) => ({
    client_id: clientId,
    platform: "google" as const,
    reviewer_name: r.reviewer_name,
    star_rating: r.star_rating,
    review_text: r.review_text,
    review_date: r.review_date,
    status: "active" as const,
  }))

  const { error: insertError } = await supabase.from("reviews").insert(reviewRows)
  if (insertError) {
    throw new Error(`Failed to insert reviews: ${insertError.message}`)
  }

  // Compute and save snapshot
  const totalStars = result.reviews.reduce((sum, r) => sum + r.star_rating, 0)
  const avgRating = totalStars / result.reviews.length

  await supabase.from("snapshots").insert({
    client_id: clientId,
    average_rating: Math.round(avgRating * 100) / 100,
    total_reviews: result.reviews.length,
    total_stars: totalStars,
    platform: "google",
  })

  // Update client status
  await supabase.from("clients").update({ status: "active" }).eq("id", clientId)
}
