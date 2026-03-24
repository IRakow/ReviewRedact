import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { generateContractPDF } from "@/lib/contract"
import type { Client, Review } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, selected_review_ids, contract_rate_google } = body

    if (!client_id || typeof client_id !== "string") {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 })
    }

    if (!Array.isArray(selected_review_ids) || selected_review_ids.length === 0) {
      return NextResponse.json({ error: "selected_review_ids must be a non-empty array" }, { status: 400 })
    }

    if (typeof contract_rate_google !== "number" || contract_rate_google <= 0) {
      return NextResponse.json({ error: "contract_rate_google must be a positive number" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Verify ownership
    if (session.role !== "admin" && client.reseller_id !== session.reseller_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch selected reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .in("id", selected_review_ids)
      .eq("client_id", client_id)

    if (reviewsError) {
      return NextResponse.json(
        { error: `Failed to fetch reviews: ${reviewsError.message}` },
        { status: 500 }
      )
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ error: "No matching reviews found for this client" }, { status: 404 })
    }

    // Fetch the reseller to get base rate
    const { data: reseller } = await supabase
      .from("resellers")
      .select("base_rate_google")
      .eq("id", client.reseller_id)
      .single()

    const btsBaseGoogle = reseller?.base_rate_google ?? null

    // Generate PDF
    const pdfBytes = await generateContractPDF({
      client: client as Client,
      selectedReviews: reviews as Review[],
      contractRate: contract_rate_google,
    })

    // Insert contract record
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        client_id,
        reseller_id: client.reseller_id,
        selected_review_ids,
        google_review_count: reviews.length,
        contract_rate_google,
        bts_base_google: btsBaseGoogle,
        status: "draft",
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (contractError) {
      return NextResponse.json(
        { error: `Failed to save contract: ${contractError.message}` },
        { status: 500 }
      )
    }

    // Return PDF as downloadable response
    const filename = `DRMC-${client.business_name.replace(/[^a-zA-Z0-9]/g, "_")}-${contract.id.slice(0, 8)}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBytes.length.toString(),
        "X-Contract-Id": contract.id,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
