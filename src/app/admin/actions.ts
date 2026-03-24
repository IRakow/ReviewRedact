"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { PIN_CODE_LENGTH, BASE_RATE_GOOGLE, BASE_RATE_FACEBOOK } from "@/lib/constants"
import { revalidatePath } from "next/cache"

function generatePinCode(): string {
  const max = Math.pow(10, PIN_CODE_LENGTH)
  const pin = Math.floor(Math.random() * max)
  return pin.toString().padStart(PIN_CODE_LENGTH, "0")
}

async function generateUniquePinCode(): Promise<string> {
  const supabase = createServerClient()
  let attempts = 0
  const maxAttempts = 20

  while (attempts < maxAttempts) {
    const pin = generatePinCode()
    const { data } = await supabase
      .from("resellers")
      .select("id")
      .eq("pin_code", pin)
      .maybeSingle()

    if (!data) return pin
    attempts++
  }

  throw new Error("Failed to generate unique PIN after maximum attempts")
}

export async function createReseller(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const company = (formData.get("company") as string) || null
  const address = (formData.get("address") as string) || null
  const taxId1099 = (formData.get("tax_id_1099") as string) || null
  const baseRateGoogle = Number(formData.get("base_rate_google")) || BASE_RATE_GOOGLE
  const baseRateFacebook = Number(formData.get("base_rate_facebook")) || BASE_RATE_FACEBOOK

  if (!name || !email || !cell) {
    return { error: "Name, email, and cell are required" }
  }

  const pinCode = await generateUniquePinCode()

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("resellers")
    .insert({
      name,
      email,
      cell,
      company,
      address,
      tax_id_1099: taxId1099,
      base_rate_google: baseRateGoogle,
      base_rate_facebook: baseRateFacebook,
      pin_code: pinCode,
      role: "reseller",
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { data }
}

export async function updateReseller(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const company = (formData.get("company") as string) || null
  const address = (formData.get("address") as string) || null
  const taxId1099 = (formData.get("tax_id_1099") as string) || null
  const baseRateGoogle = Number(formData.get("base_rate_google")) || BASE_RATE_GOOGLE
  const baseRateFacebook = Number(formData.get("base_rate_facebook")) || BASE_RATE_FACEBOOK

  if (!name || !email || !cell) {
    return { error: "Name, email, and cell are required" }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("resellers")
    .update({
      name,
      email,
      cell,
      company,
      address,
      tax_id_1099: taxId1099,
      base_rate_google: baseRateGoogle,
      base_rate_facebook: baseRateFacebook,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/resellers/${id}`)
  return { data }
}

export async function toggleResellerActive(id: string, isActive: boolean) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("resellers")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/resellers/${id}`)
  return { success: true }
}
