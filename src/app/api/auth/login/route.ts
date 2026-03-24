import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createSession, setSessionCookie } from "@/lib/session"

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

    // Look up reseller by name (case-insensitive) AND pin_code
    const { data: reseller, error } = await supabase
      .from("resellers")
      .select("id, name, role, is_active, pin_code")
      .ilike("name", name.trim())
      .eq("pin_code", code.trim())
      .single()

    if (error || !reseller) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 401 }
      )
    }

    if (!reseller.is_active) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }

    // Create session token
    const token = await createSession({
      reseller_id: reseller.id,
      role: reseller.role,
      name: reseller.name,
    })

    // Set cookie
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      role: reseller.role,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
