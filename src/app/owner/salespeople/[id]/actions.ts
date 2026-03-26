"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { PIN_CODE_LENGTH } from "@/lib/constants"
import type { CommissionPlanType, PricingPlan } from "@/lib/types"

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

export async function resetSalespersonPin(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: spData } = await supabase
    .from("salespeople")
    .select("id, name, email")
    .eq("id", id)
    .single()

  if (!spData) {
    return { error: "Salesperson not found" }
  }

  const newPin = await generateUniquePinCode()

  const { error } = await supabase
    .from("salespeople")
    .update({ pin_code: newPin, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  // Email the salesperson
  try {
    await resend.emails.send({
      from: "Review Redact <notifications@reviewredact.com>",
      to: spData.email,
      subject: "ReviewRedact \u2014 Your New Access Code",
      html: `<p>Hi ${spData.name},</p><p>Your access code has been reset by an administrator.</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 0.5em; font-family: monospace;">${newPin}</p><p>Please log in at reviewredact.com and keep this code secure.</p>`,
    })
  } catch (err) {
    console.error("Failed to send PIN reset email:", err)
  }

  revalidatePath(`/owner/salespeople/${id}`)
  return { success: true, pin_code: newPin }
}

export async function updateSalesperson(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // Verify salesperson exists
  const { data: existing } = await supabase
    .from("salespeople")
    .select("id, parent_type")
    .eq("id", id)
    .single()

  if (!existing) {
    return { error: "Salesperson not found" }
  }

  const baseRateGoogle = Number(formData.get("base_rate_google"))
  const displayPriceGoogle = formData.get("display_price_google")
    ? Number(formData.get("display_price_google"))
    : null
  const isActive = formData.get("is_active") === "true"
  const pricingPlan = (formData.get("pricing_plan") as PricingPlan) || null
  const commissionPlanType = (formData.get("commission_plan_type") as CommissionPlanType) || null

  if (isNaN(baseRateGoogle) || baseRateGoogle < 0) {
    return { error: "Invalid base rate (Google)" }
  }
  if (displayPriceGoogle !== null && (isNaN(displayPriceGoogle) || displayPriceGoogle < 0)) {
    return { error: "Invalid display price (Google)" }
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

  const updates: Record<string, unknown> = {
    base_rate_google: baseRateGoogle,
    display_price_google: displayPriceGoogle,
    is_active: isActive,
    commission_plan_type: commissionPlanType,
    commission_plan_config: Object.keys(config).length > 0 ? config : null,
  }

  if (pricingPlan) {
    updates.pricing_plan = pricingPlan
  }

  const { error } = await supabase
    .from("salespeople")
    .update(updates)
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/owner/salespeople/${id}`)
  revalidatePath("/owner/salespeople")
  return { success: true }
}
