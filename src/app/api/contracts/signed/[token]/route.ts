import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()

    // Look up contract by signing_token
    const { data: contract } = await supabase
      .from("contracts")
      .select("*, clients(business_name)")
      .eq("signing_token", token)
      .single()

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    if (contract.status !== "signed" || !contract.signed_pdf_path) {
      return NextResponse.json({ error: "Contract has not been signed yet" }, { status: 400 })
    }

    // signed_pdf_path stores base64 of the PDF
    const pdfBuffer = Buffer.from(contract.signed_pdf_path, "base64")
    const businessName =
      (contract.clients as Record<string, unknown>)?.business_name as string || "Client"
    const filename = `DRMC-${businessName.replace(/[^a-zA-Z0-9]/g, "_")}-SIGNED.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
