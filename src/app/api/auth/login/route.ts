import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createSession, setSessionCookie } from "@/lib/session"
import type { Session } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { name, code } = await request.json()

    if (!name || !code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const trimmedName = name.trim()
    const trimmedCode = code.trim()

    // 1. Try resellers table first (owners + resellers)
    const { data: reseller } = await supabase
      .from("resellers")
      .select("id, name, role, is_active, pin_code")
      .ilike("name", trimmedName)
      .eq("pin_code", trimmedCode)
      .single()

    if (reseller) {
      if (!reseller.is_active) {
        return NextResponse.json(
          { error: "Account deactivated" },
          { status: 403 }
        )
      }

      // Owners don't need document signing
      const isOwner = reseller.role === "owner"
      let documentsSigned = isOwner

      if (!isOwner) {
        // Check if reseller has signed both required documents
        const { data: docs } = await supabase
          .from("documents")
          .select("document_type, status")
          .eq("signer_type", "reseller")
          .eq("signer_id", reseller.id)
          .eq("status", "signed")

        const signedTypes = new Set(docs?.map((d) => d.document_type) ?? [])
        documentsSigned = signedTypes.has("w9_1099") && signedTypes.has("contractor_agreement")
      }

      const session: Session = {
        user_id: reseller.id,
        user_type: reseller.role as Session["user_type"],
        name: reseller.name,
        documents_signed: documentsSigned,
      }

      const token = await createSession(session)
      await setSessionCookie(token)

      return NextResponse.json({
        success: true,
        user_type: session.user_type,
        documents_signed: documentsSigned,
      })
    }

    // 2. Try salespeople table
    const { data: salesperson } = await supabase
      .from("salespeople")
      .select("id, name, reseller_id, parent_type, is_active, pin_code")
      .ilike("name", trimmedName)
      .eq("pin_code", trimmedCode)
      .single()

    if (salesperson) {
      if (!salesperson.is_active) {
        return NextResponse.json(
          { error: "Account deactivated" },
          { status: 403 }
        )
      }

      // Check if salesperson has signed both required documents
      const { data: docs } = await supabase
        .from("documents")
        .select("document_type, status")
        .eq("signer_type", "salesperson")
        .eq("signer_id", salesperson.id)
        .eq("status", "signed")

      const signedTypes = new Set(docs?.map((d) => d.document_type) ?? [])
      const documentsSigned = signedTypes.has("w9_1099") && signedTypes.has("contractor_agreement")

      const session: Session = {
        user_id: salesperson.id,
        user_type: "salesperson",
        name: salesperson.name,
        parent_reseller_id: salesperson.reseller_id ?? undefined,
        documents_signed: documentsSigned,
      }

      const token = await createSession(session)
      await setSessionCookie(token)

      return NextResponse.json({
        success: true,
        user_type: session.user_type,
        documents_signed: documentsSigned,
      })
    }

    // 3. No match found
    return NextResponse.json(
      { error: "Access Denied" },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
