"use server"

import { getSession, createSession, setSessionCookie } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { PIN_CODE_LENGTH } from "@/lib/constants"
import { RESELLER_SALESPERSON_MIN_RATE } from "@/lib/constants"
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

export async function createSalesperson(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string

  if (!name || !email || !cell) {
    return { error: "Name, email, and cell are required" }
  }

  const pinCode = await generateUniquePinCode()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("salespeople")
    .insert({
      reseller_id: session.user_id,
      name,
      email,
      cell,
      pin_code: pinCode,
      parent_type: "reseller",
      pricing_plan: "reseller_set",
      base_rate_google: RESELLER_SALESPERSON_MIN_RATE,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await logAudit({ tableName: "salespeople", recordId: data.id, action: "create", oldValues: null, newValues: { name, email, cell, parent_type: "reseller", pricing_plan: "reseller_set" } })

  // Create pending document rows
  await supabase.from("documents").insert([
    { signer_type: "salesperson", signer_id: data.id, document_type: "w9_1099", status: "pending" },
    { signer_type: "salesperson", signer_id: data.id, document_type: "contractor_agreement", status: "pending" },
  ])

  // Email the new salesperson their credentials
  try {
    await resend.emails.send({
      from: "Review Redact <notifications@reviewredact.com>",
      to: email,
      subject: "Welcome to ReviewRedact — Your Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Welcome to ReviewRedact</h2>
          <p>Hi ${name},</p>
          <p>You've been invited to ReviewRedact.</p>
          <p>Your username: <strong>${name}</strong></p>
          <p>Your access code: <strong style="font-size:24px;font-family:monospace;letter-spacing:0.3em;">${pinCode}</strong></p>
          <p>Log in at <a href="https://reviewredact.com">reviewredact.com</a> to complete your onboarding.</p>
          <br/>
          <p style="font-size: 11px; color: #999;">This is an automated message from ReviewRedact.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error("Failed to send welcome email:", e)
  }

  revalidatePath("/dashboard/settings")
  return { data, pin_code: pinCode }
}

export async function updateSalesperson(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // Verify this salesperson belongs to this reseller
  const { data: sp } = await supabase
    .from("salespeople")
    .select("reseller_id")
    .eq("id", id)
    .single()

  if (!sp || sp.reseller_id !== session.user_id) {
    return { error: "Not found" }
  }

  const old = await getRecordForAudit("salespeople", id)

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const baseRate = Number(formData.get("base_rate_google")) || RESELLER_SALESPERSON_MIN_RATE

  const newValues = {
    name,
    email,
    cell,
    base_rate_google: baseRate,
  }

  const { error } = await supabase
    .from("salespeople")
    .update({
      ...newValues,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  await logAudit({ tableName: "salespeople", recordId: id, action: "update", oldValues: old, newValues })

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function toggleSalespersonActive(id: string, isActive: boolean) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: sp } = await supabase
    .from("salespeople")
    .select("reseller_id")
    .eq("id", id)
    .single()

  if (!sp || sp.reseller_id !== session.user_id) {
    return { error: "Not found" }
  }

  const old = await getRecordForAudit("salespeople", id)

  const { error } = await supabase
    .from("salespeople")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  await logAudit({ tableName: "salespeople", recordId: id, action: "update", oldValues: old, newValues: { is_active: isActive } })

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateGlobalCommissionPlan(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") return { error: "Unauthorized" }

  const planType = formData.get("plan_type") as string
  const configJson = formData.get("config") as string

  if (!["fixed", "base_split", "percentage", "flat_fee"].includes(planType)) {
    return { error: "Invalid plan type" }
  }

  const config = configJson ? JSON.parse(configJson) : {}
  const old = await getRecordForAudit("resellers", session.user_id)

  const supabase = createServerClient()
  const newValues = { commission_plan_type: planType, commission_plan_config: config }

  const { error } = await supabase
    .from("resellers")
    .update(newValues)
    .eq("id", session.user_id)

  if (error) return { error: error.message }

  await logAudit({ tableName: "resellers", recordId: session.user_id, action: "update", oldValues: old, newValues })

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateSalespersonCommissionPlan(spId: string, planType: string | null, config: Record<string, unknown> | null) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") return { error: "Unauthorized" }

  const supabase = createServerClient()

  const { data: sp } = await supabase.from("salespeople").select("reseller_id").eq("id", spId).single()
  if (!sp || sp.reseller_id !== session.user_id) return { error: "Not found" }

  const old = await getRecordForAudit("salespeople", spId)
  const newValues = { commission_plan_type: planType, commission_plan_config: config }

  const { error } = await supabase
    .from("salespeople")
    .update({ ...newValues, updated_at: new Date().toISOString() })
    .eq("id", spId)

  if (error) return { error: error.message }

  await logAudit({ tableName: "salespeople", recordId: spId, action: "update", oldValues: old, newValues })

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function setDealOverride(salespersonId: string, clientId: string, rate: number) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // Upsert: check if override exists
  const { data: existing } = await supabase
    .from("rate_overrides")
    .select("id")
    .eq("set_by_type", "reseller")
    .eq("set_by_id", session.user_id)
    .eq("target_type", "salesperson")
    .eq("target_id", salespersonId)
    .eq("client_id", clientId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("rate_overrides")
      .update({ rate_google: rate })
      .eq("id", existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("rate_overrides").insert({
      set_by_type: "reseller",
      set_by_id: session.user_id,
      target_type: "salesperson",
      target_id: salespersonId,
      client_id: clientId,
      rate_google: rate,
    })
    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function resetSalespersonPinByReseller(spId: string) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  // Verify SP belongs to this reseller
  const { data: sp } = await supabase
    .from("salespeople")
    .select("id, name, email, reseller_id")
    .eq("id", spId)
    .single()

  if (!sp || sp.reseller_id !== session.user_id) {
    return { error: "Not found" }
  }

  const old = await getRecordForAudit("salespeople", spId)
  const newPin = await generateUniquePinCode()

  const { error } = await supabase
    .from("salespeople")
    .update({ pin_code: newPin, updated_at: new Date().toISOString() })
    .eq("id", spId)

  if (error) return { error: error.message }

  await logAudit({ tableName: "salespeople", recordId: spId, action: "update", oldValues: old, newValues: { pin_code: "[reset]" } })

  // Email the salesperson
  try {
    await resend.emails.send({
      from: "Review Redact <notifications@reviewredact.com>",
      to: sp.email,
      subject: "ReviewRedact \u2014 Your New Access Code",
      html: `<p>Hi ${sp.name},</p><p>Your access code has been reset by your reseller.</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 0.5em; font-family: monospace;">${newPin}</p><p>Please log in at reviewredact.com and keep this code secure.</p>`,
    })
  } catch (err) {
    console.error("Failed to send PIN reset email:", err)
  }

  revalidatePath("/dashboard/settings")
  return { success: true, pin_code: newPin }
}
