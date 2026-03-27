"use server"

import { headers } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function signContract(
  token: string,
  data: {
    signerName: string
    signature: {
      type: "draw" | "typed"
      image_data?: string
      typed_name?: string
      font?: string
    }
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createServerClient()

    // 1. Look up contract by signing_token
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*, clients(*)")
      .eq("signing_token", token)
      .single()

    if (contractError || !contract) {
      return { error: "Contract not found" }
    }

    // 2. Verify contract is not already signed
    if (contract.status === "signed") {
      return { error: "This contract has already been signed" }
    }

    // 3. Get client IP from headers
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"

    const signedAt = new Date().toISOString()

    // 4. Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        signed_at: signedAt,
        signer_name: data.signerName,
        signer_ip: ip,
        signature_data: {
          ...data.signature,
          ip,
          user_agent: headersList.get("user-agent") || "unknown",
          timestamp: signedAt,
        },
      })
      .eq("id", contract.id)

    if (updateError) {
      return { error: "Failed to save signature" }
    }

    // 5. Generate signed PDF
    const client = contract.clients as Record<string, unknown>

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .in("id", contract.selected_review_ids || [])

    const { generateSignedContractPDF } = await import("@/lib/contract")
    const signedPdfBytes = await generateSignedContractPDF({
      client: client as any,
      selectedReviews: (reviews || []) as any[],
      contractRate: contract.contract_rate_google ?? 0,
      signatureData: data.signature,
      signerName: data.signerName,
      signedAt,
    })

    // Store the signed PDF as base64 in the signed_pdf_path column
    const pdfBase64 = Buffer.from(signedPdfBytes).toString("base64")
    await supabase
      .from("contracts")
      .update({ signed_pdf_path: pdfBase64 })
      .eq("id", contract.id)

    // 6. Send confirmation emails
    const clientEmail = client.owner_email as string | null
    const clientName = client.owner_name as string
    const businessName = client.business_name as string

    // Email to client
    if (clientEmail) {
      await resend.emails.send({
        from: "Review Redact <contracts@reviewredact.com>",
        to: clientEmail,
        subject: `Contract Signed — ${businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1a1a1a;">Contract Signed Successfully</h2>
            <p>Dear ${clientName},</p>
            <p>Thank you for signing your Digital Reputation Management Contract with Business Threat Solutions, LLC.</p>
            <p>Your signed contract is attached for your records. Our team will begin working on the review removal process as outlined in the contract.</p>
            <br/>
            <p>Regards,</p>
            <p><strong>Business Threat Solutions, LLC</strong></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">This is an automated confirmation. The attached contract has been digitally signed and is legally binding.</p>
          </div>
        `,
        attachments: [
          {
            filename: `DRMC-${businessName.replace(/[^a-zA-Z0-9]/g, "_")}-SIGNED.pdf`,
            content: Buffer.from(signedPdfBytes),
            contentType: "application/pdf",
          },
        ],
      }).catch(() => {
        // Non-blocking — don't fail the signing if email fails
      })
    }

    // Email to owners (BTS)
    await resend.emails.send({
      from: "Review Redact <contracts@reviewredact.com>",
      to: "contracts@bts-solutions.com",
      subject: `Contract Signed by ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Contract Signed</h2>
          <p><strong>${clientName}</strong> from <strong>${businessName}</strong> has signed their Digital Reputation Management Contract.</p>
          <p><strong>Signed at:</strong> ${new Date(signedAt).toLocaleString("en-US")}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <p><strong>Reviews:</strong> ${contract.google_review_count} selected for removal</p>
          <p><strong>Rate:</strong> $${contract.contract_rate_google?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "N/A"} per review</p>
          <br/>
          <p>The signed contract PDF is attached.</p>
        </div>
      `,
      attachments: [
        {
          filename: `DRMC-${businessName.replace(/[^a-zA-Z0-9]/g, "_")}-SIGNED.pdf`,
          content: Buffer.from(signedPdfBytes),
          contentType: "application/pdf",
        },
      ],
    }).catch(() => {
      // Non-blocking
    })

    // Email to reseller (if any, and if not the owner)
    if (contract.reseller_id) {
      const { data: reseller } = await supabase
        .from("resellers")
        .select("email, name, role")
        .eq("id", contract.reseller_id)
        .single()

      if (reseller?.email && reseller.role !== "owner") {
        await resend.emails.send({
          from: "Review Redact <contracts@reviewredact.com>",
          to: reseller.email,
          subject: `Contract Signed — ${businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #1a1a1a;">Contract Signed</h2>
              <p>Hi ${reseller.name},</p>
              <p>Your client <strong>${clientName}</strong> from <strong>${businessName}</strong> has signed their contract.</p>
              <p>The review removal process will begin shortly.</p>
              <br/>
              <p>Regards,</p>
              <p><strong>Business Threat Solutions, LLC</strong></p>
            </div>
          `,
        }).catch(() => {
          // Non-blocking
        })
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Contract signing error:", err)
    return { error: "Something went wrong — please try again" }
  }
}
