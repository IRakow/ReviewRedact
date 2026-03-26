"use server"

import { getSession, createSession, setSessionCookie } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { PIN_CODE_LENGTH } from "@/lib/constants"
import { RESELLER_SALESPERSON_MIN_RATE } from "@/lib/constants"

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
  const company = (formData.get("company") as string) || null
  const baseRate = Number(formData.get("base_rate_google")) || RESELLER_SALESPERSON_MIN_RATE

  if (!name || !email || !cell) {
    return { error: "Name, email, and cell are required" }
  }

  if (baseRate < RESELLER_SALESPERSON_MIN_RATE) {
    return { error: `Base rate must be at least $${RESELLER_SALESPERSON_MIN_RATE}` }
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
      company,
      pin_code: pinCode,
      parent_type: "reseller",
      pricing_plan: "reseller_set",
      base_rate_google: baseRate,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Create pending document rows
  await supabase.from("documents").insert([
    { signer_type: "salesperson", signer_id: data.id, document_type: "w9_1099", status: "pending" },
    { signer_type: "salesperson", signer_id: data.id, document_type: "contractor_agreement", status: "pending" },
  ])

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

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const baseRate = Number(formData.get("base_rate_google")) || RESELLER_SALESPERSON_MIN_RATE

  const { error } = await supabase
    .from("salespeople")
    .update({
      name,
      email,
      cell,
      base_rate_google: baseRate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

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

  const { error } = await supabase
    .from("salespeople")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

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

  const supabase = createServerClient()
  const { error } = await supabase
    .from("resellers")
    .update({ commission_plan_type: planType, commission_plan_config: config })
    .eq("id", session.user_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateSalespersonCommissionPlan(spId: string, planType: string | null, config: Record<string, unknown> | null) {
  const session = await getSession()
  if (!session || session.user_type !== "reseller") return { error: "Unauthorized" }

  const supabase = createServerClient()

  const { data: sp } = await supabase.from("salespeople").select("reseller_id").eq("id", spId).single()
  if (!sp || sp.reseller_id !== session.user_id) return { error: "Not found" }

  const { error } = await supabase
    .from("salespeople")
    .update({ commission_plan_type: planType, commission_plan_config: config, updated_at: new Date().toISOString() })
    .eq("id", spId)

  if (error) return { error: error.message }
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
