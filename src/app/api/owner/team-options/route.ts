import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient()

  const [{ data: resellers }, { data: salespeople }] = await Promise.all([
    supabase
      .from("resellers")
      .select("id, name")
      .eq("role", "reseller")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("salespeople")
      .select("id, name, reseller_id")
      .eq("is_active", true)
      .order("name"),
  ])

  return NextResponse.json({
    resellers: resellers ?? [],
    salespeople: salespeople ?? [],
  })
}
