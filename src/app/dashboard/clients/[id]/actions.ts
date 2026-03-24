"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function updateReviewStatus(reviewId: string, status: string) {
  const session = await getSession()
  if (!session) redirect("/")

  const validStatuses = ["active", "pending_removal", "removed", "failed"]
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status")
  }

  const supabase = createServerClient()

  // Verify ownership through the review's client
  const { data: review } = await supabase
    .from("reviews")
    .select("client_id, clients(reseller_id)")
    .eq("id", reviewId)
    .single()

  if (!review) {
    throw new Error("Review not found")
  }

  const clientData = review.clients as unknown as { reseller_id: string } | null
  if (
    session.role !== "admin" &&
    clientData?.reseller_id !== session.reseller_id
  ) {
    throw new Error("Unauthorized")
  }

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

  const supabase = createServerClient()

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("reseller_id")
    .eq("id", clientId)
    .single()

  if (!client) {
    throw new Error("Client not found")
  }

  if (session.role !== "admin" && client.reseller_id !== session.reseller_id) {
    throw new Error("Unauthorized")
  }

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

  const supabase = createServerClient()

  // Verify ownership
  const { data: client } = await supabase
    .from("clients")
    .select("reseller_id")
    .eq("id", clientId)
    .single()

  if (!client) {
    throw new Error("Client not found")
  }

  if (session.role !== "admin" && client.reseller_id !== session.reseller_id) {
    throw new Error("Unauthorized")
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : ""}${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/scrape`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Scrape failed: ${body}`)
  }
}
