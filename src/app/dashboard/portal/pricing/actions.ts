"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { OWNER_DIRECT_PLAN_A_MAX } from "@/lib/constants"

export async function updateDisplayPrice(price: number) {
  const session = await getSession()
  if (!session || session.user_type !== "salesperson") {
    redirect("/")
  }

  if (price <= 0) {
    return { error: "Price must be positive" }
  }

  const supabase = createServerClient()

  // Check if Plan A — enforce max
  const { data: sp } = await supabase
    .from("salespeople")
    .select("pricing_plan")
    .eq("id", session.user_id)
    .single()

  if (sp?.pricing_plan === "owner_plan_a" && price > OWNER_DIRECT_PLAN_A_MAX) {
    return { error: `Plan A maximum is $${OWNER_DIRECT_PLAN_A_MAX}/removal` }
  }

  const { error } = await supabase
    .from("salespeople")
    .update({ display_price_google: price, updated_at: new Date().toISOString() })
    .eq("id", session.user_id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/portal")
  return { success: true }
}
