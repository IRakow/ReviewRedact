"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { PIN_CODE_LENGTH, OWNER_DIRECT_PLAN_A_BASE, OWNER_DIRECT_PLAN_B_BASE } from "@/lib/constants"
import type { PricingPlan } from "@/lib/types"

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

export async function createDirectSalesperson(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const pricingPlan = formData.get("pricing_plan") as PricingPlan

  if (!name || !email || !cell) {
    return { error: "Name, email, and cell are required" }
  }

  if (pricingPlan !== "owner_plan_a" && pricingPlan !== "owner_plan_b") {
    return { error: "Invalid pricing plan" }
  }

  const baseRate = pricingPlan === "owner_plan_a" ? OWNER_DIRECT_PLAN_A_BASE : OWNER_DIRECT_PLAN_B_BASE
  const pinCode = await generateUniquePinCode()

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("salespeople")
    .insert({
      reseller_id: null,
      name,
      email,
      cell,
      pin_code: pinCode,
      parent_type: "owner",
      pricing_plan: pricingPlan,
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

  revalidatePath("/owner/salespeople")
  return { data, pin_code: pinCode }
}
