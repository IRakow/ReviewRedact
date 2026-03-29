"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { PIN_CODE_LENGTH } from "@/lib/constants"
import type { CommissionPlanType } from "@/lib/types"
import { logAudit, getRecordForAudit } from "@/lib/audit"

const resend = new Resend(process.env.RESEND_API_KEY)

function generatePinCode(): string {
  const max = Math.pow(10, PIN_CODE_LENGTH)
  const pin = Math.floor(Math.random() * max)
  return pin.toString().padStart(PIN_CODE_LENGTH, "0")
}

async function generateUniquePinCode(): Promise<string> {
  const supabase = createServerClient()
  let attempts = 0

  while (attempts < 20) {
    const pin = generatePinCode()
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("resellers").select("id").eq("pin_code", pin).maybeSingle(),
      supabase.from("salespeople").select("id").eq("pin_code", pin).maybeSingle(),
    ])
    if (!r && !s) return pin
    attempts++
  }
  throw new Error("Failed to generate unique PIN")
}

export async function resetResellerPin(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: resellerData } = await supabase
    .from("resellers")
    .select("id, name, email, role")
    .eq("id", id)
    .eq("role", "reseller")
    .single()

  if (!resellerData) {
    return { error: "Reseller not found" }
  }

  const old = await getRecordForAudit("resellers", id)
  const newPin = await generateUniquePinCode()

  const { error } = await supabase
    .from("resellers")
    .update({ pin_code: newPin, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await logAudit({ tableName: "resellers", recordId: id, action: "update", oldValues: old, newValues: { pin_code: "[reset]" } })

  // Email the reseller
  try {
    await resend.emails.send({
      from: "Review Redact <notifications@reviewredact.com>",
      to: resellerData.email,
      subject: "ReviewRedact \u2014 Your New Access Code",
      html: `<p>Hi ${resellerData.name},</p><p>Your access code has been reset by an administrator.</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 0.5em; font-family: monospace;">${newPin}</p><p>Please log in at reviewredact.com and keep this code secure.</p>`,
    })
  } catch (err) {
    console.error("Failed to send PIN reset email:", err)
  }

  revalidatePath(`/owner/resellers/${id}`)
  return { success: true, pin_code: newPin }
}

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

  const old = await getRecordForAudit("resellers", id)

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

  const newValues = {
    base_rate_google: baseRateGoogle,
    base_rate_facebook: baseRateFacebook,
    is_active: isActive,
    commission_plan_type: commissionPlanType,
    commission_plan_config: config,
  }

  const { error } = await supabase
    .from("resellers")
    .update(newValues)
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await logAudit({ tableName: "resellers", recordId: id, action: "update", oldValues: old, newValues })

  revalidatePath(`/owner/resellers/${id}`)
  revalidatePath("/owner/resellers")
  return { success: true }
}
