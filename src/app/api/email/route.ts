import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { client_id, pdf_base64, filename } = await request.json()

    if (!client_id || !pdf_base64 || !filename) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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
    const hasAccess =
      session.user_type === "owner" ||
      client.reseller_id === session.user_id ||
      client.salesperson_id === session.user_id
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!client.owner_email) {
      return NextResponse.json({ error: "Client has no email on file" }, { status: 400 })
    }

    // Fetch reseller for CC
    const { data: reseller } = await supabase
      .from("resellers")
      .select("email, name")
      .eq("id", client.reseller_id)
      .single()

    const pdfBuffer = Buffer.from(pdf_base64, "base64")

    // Send email to client, CC the reseller
    const { data, error } = await resend.emails.send({
      from: "Review Redact <contracts@reviewredact.com>",
      to: client.owner_email,
      cc: reseller?.email ? [reseller.email] : undefined,
      subject: `Digital Reputation Management Contract — ${client.business_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Digital Reputation Management Contract</h2>
          <p>Dear ${client.owner_name},</p>
          <p>Please find attached your Digital Reputation Management Contract from Business Threat Solutions, LLC.</p>
          <p>This contract outlines the scope of work for the removal of identified Google Reviews associated with <strong>${client.business_name}</strong>.</p>
          <p>Please review the attached document carefully. If you have any questions, please reply to this email.</p>
          <br/>
          <p>Regards,</p>
          <p><strong>Business Threat Solutions, LLC</strong></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This email was sent on behalf of Business Threat Solutions, LLC. The attached contract is confidential and intended solely for the named recipient.</p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
