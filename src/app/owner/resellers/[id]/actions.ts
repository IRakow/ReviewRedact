"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CommissionPlanType } from "@/lib/types"

export async function updateReseller(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // Verify reseller exists
  const { data: existing } = await supabase
    .from("resellers")
    .select("id")
    .eq("id", id)
    .eq("role", "reseller")
    .single()

  if (!existing) {
    return { error: "Reseller not found" }
  }

  const baseRateGoogle = Number(formData.get("base_rate_google"))
  const baseRateFacebook = Number(formData.get("base_rate_facebook"))
  const isActive = formData.get("is_active") === "true"
  const commissionPlanType = formData.get("commission_plan_type") as CommissionPlanType

  if (isNaN(baseRateGoogle) || baseRateGoogle < 0) {
    return { error: "Invalid base rate (Google)" }
  }
  if (isNaN(baseRateFacebook) || baseRateFacebook < 0) {
    return { error: "Invalid base rate (Facebook)" }
  }

  const validPlans: CommissionPlanType[] = ["fixed", "base_split", "percentage", "flat_fee"]
  if (!validPlans.includes(commissionPlanType)) {
    return { error: "Invalid commission plan type" }
  }

  // Build commission_plan_config
  const config: Record<string, number> = {}
  const splitSpPct = formData.get("split_sp_pct")
  const spMarginPct = formData.get("sp_margin_pct")
  const spFlatFee = formData.get("sp_flat_fee")

  if (commissionPlanType === "base_split" && splitSpPct) {
    config.split_sp_pct = Number(splitSpPct)
  }
  if (commissionPlanType === "percentage" && spMarginPct) {
    config.sp_margin_pct = Number(spMarginPct)
  }
  if (commissionPlanType === "flat_fee" && spFlatFee) {
    config.sp_flat_fee = Number(spFlatFee)
  }

  const { error } = await supabase
    .from("resellers")
    .update({
      base_rate_google: baseRateGoogle,
      base_rate_facebook: baseRateFacebook,
      is_active: isActive,
      commission_plan_type: commissionPlanType,
      commission_plan_config: config,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/owner/resellers/${id}`)
  revalidatePath("/owner/resellers")
  return { success: true }
}
