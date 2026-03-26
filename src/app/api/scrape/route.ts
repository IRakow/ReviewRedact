import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { scrapeGoogleReviews } from "@/lib/scraper"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { client_id } = body

    if (!client_id || typeof client_id !== "string") {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Verify ownership
    const hasAccess =
      session.user_type === "owner" ||
      client.reseller_id === session.user_id ||
      client.salesperson_id === session.user_id
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Scrape reviews
    const result = await scrapeGoogleReviews(client.google_url)

    // Delete existing reviews for a fresh scrape
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("client_id", client_id)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to clear old reviews: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Bulk insert new reviews
    const reviewRows = result.reviews.map((r) => ({
      client_id,
      platform: "google" as const,
      reviewer_name: r.reviewer_name,
      star_rating: r.star_rating,
      review_text: r.review_text,
      review_date: r.review_date,
      status: "active" as const,
    }))

    const { error: insertError } = await supabase.from("reviews").insert(reviewRows)

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to insert reviews: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Compute average rating and create snapshot
    const totalStars = result.reviews.reduce((sum, r) => sum + r.star_rating, 0)
    const totalReviews = result.reviews.length
    const averageRating = totalReviews > 0 ? Math.round((totalStars / totalReviews) * 100) / 100 : 0

    const { error: snapshotError } = await supabase.from("snapshots").insert({
      client_id,
      average_rating: averageRating,
      total_reviews: totalReviews,
      total_stars: totalStars,
      platform: "google",
    })

    if (snapshotError) {
      return NextResponse.json(
        { error: `Failed to create snapshot: ${snapshotError.message}` },
        { status: 500 }
      )
    }

    // Update client status to active
    const { error: updateError } = await supabase
      .from("clients")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", client_id)

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update client status: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reviewCount: totalReviews,
      averageRating,
      ...(result.error ? { warning: result.error } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
