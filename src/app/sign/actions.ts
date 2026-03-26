"use server"

import { getSession, createSession, setSessionCookie } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Resend } from "resend"
import { OWNER_EMAILS } from "@/lib/constants"
import type { DocumentType, SignatureData, Session } from "@/lib/types"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function getDocumentStatus() {
  const session = await getSession()
  if (!session) redirect("/")

  if (session.user_type === "owner") {
    return { w9_1099: "signed" as const, contractor_agreement: "signed" as const }
  }

  const supabase = createServerClient()
  const signerType = session.user_type === "reseller" ? "reseller" : "salesperson"

  const { data: docs } = await supabase
    .from("documents")
    .select("document_type, status")
    .eq("signer_type", signerType)
    .eq("signer_id", session.user_id)

  const docMap: Record<string, string> = {}
  for (const doc of docs ?? []) {
    docMap[doc.document_type] = doc.status
  }

  return {
    w9_1099: (docMap.w9_1099 ?? "pending") as "pending" | "signed",
    contractor_agreement: (docMap.contractor_agreement ?? "pending") as "pending" | "signed",
  }
}

export async function signDocument(
  documentType: DocumentType,
  signaturePayload: {
    type: "draw" | "typed"
    image_data?: string
    typed_name?: string
    font?: string
  }
) {
  const session = await getSession()
  if (!session) redirect("/")

  if (session.user_type === "owner") {
    return { error: "Owners do not need to sign documents" }
  }

  const validTypes: DocumentType[] = ["w9_1099", "contractor_agreement"]
  if (!validTypes.includes(documentType)) {
    return { error: "Invalid document type" }
  }

  const signerType = session.user_type === "reseller" ? "reseller" : "salesperson"
  const supabase = createServerClient()

  // Check if already signed
  const { data: existing } = await supabase
    .from("documents")
    .select("id, status")
    .eq("signer_type", signerType)
    .eq("signer_id", session.user_id)
    .eq("document_type", documentType)
    .maybeSingle()

  if (existing?.status === "signed") {
    return { error: "Document already signed" }
  }

  const signatureData: SignatureData = {
    type: signaturePayload.type,
    image_data: signaturePayload.image_data,
    typed_name: signaturePayload.typed_name,
    font: signaturePayload.font,
    ip: "server-side",
    user_agent: "server-side",
    timestamp: new Date().toISOString(),
  }

  if (existing) {
    // Update existing pending document
    const { error } = await supabase
      .from("documents")
      .update({
        status: "signed",
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) return { error: error.message }
  } else {
    // Insert new signed document
    const { error } = await supabase.from("documents").insert({
      signer_type: signerType,
      signer_id: session.user_id,
      document_type: documentType,
      status: "signed",
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
    })

    if (error) return { error: error.message }
  }

  // Email all owners about the signed document
  const docLabel = documentType === "w9_1099" ? "W-9/1099 Form" : "Contractor Agreement"
  try {
    await resend.emails.send({
      from: "Review Redact <contracts@reviewredact.com>",
      to: OWNER_EMAILS,
      subject: `Document Signed: ${docLabel} — ${session.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Document Signed</h2>
          <p><strong>${session.name}</strong> (${signerType}) has signed their <strong>${docLabel}</strong>.</p>
          <p>Signed at: ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}</p>
          <p>Signature type: ${signaturePayload.type === "draw" ? "Drawn signature" : "Typed signature"}</p>
          ${signaturePayload.typed_name ? `<p>Typed name: ${signaturePayload.typed_name}</p>` : ""}
          <br/>
          <p style="font-size: 11px; color: #999;">This is an automated notification from ReviewRedact.</p>
        </div>
      `,
    })
  } catch {
    // Don't fail the signing if email fails
    console.error("Failed to send document signed notification email")
  }

  return { success: true }
}

export async function refreshSessionAfterSigning() {
  const session = await getSession()
  if (!session) redirect("/")

  if (session.user_type === "owner") return

  const supabase = createServerClient()
  const signerType = session.user_type === "reseller" ? "reseller" : "salesperson"

  const { data: docs } = await supabase
    .from("documents")
    .select("document_type, status")
    .eq("signer_type", signerType)
    .eq("signer_id", session.user_id)
    .eq("status", "signed")

  const signedTypes = new Set(docs?.map((d) => d.document_type) ?? [])
  const documentsSigned = signedTypes.has("w9_1099") && signedTypes.has("contractor_agreement")

  if (documentsSigned && !session.documents_signed) {
    // Update the session token with documents_signed = true
    const newSession: Session = {
      ...session,
      documents_signed: true,
    }
    const token = await createSession(newSession)
    await setSessionCookie(token)
  }

  return { documents_signed: documentsSigned }
}
