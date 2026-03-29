"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { PIN_CODE_LENGTH, BTS_BASE_RATE, BTS_BASE_RATE_FACEBOOK } from "@/lib/constants"
import { logAudit } from "@/lib/audit"

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

export async function createReseller(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const cell = formData.get("cell") as string
  const company = (formData.get("company") as string)?.trim() || null

  if (!name || !email || !cell) {
    return { error: "Name, email, and phone are required" }
  }

  const pinCode = await generateUniquePinCode()
  const supabase = createServerClient()

  const { data: reseller, error } = await supabase
    .from("resellers")
    .insert({
      name,
      email,
      cell,
      company,
      pin_code: pinCode,
      base_rate_google: BTS_BASE_RATE,
      base_rate_facebook: BTS_BASE_RATE_FACEBOOK,
      role: "reseller",
      is_active: true,
      commission_plan_type: "fixed",
      commission_plan_config: {},
    })
    .select("id, pin_code")
    .single()

  if (error) return { error: error.message }

  await logAudit({ tableName: "resellers", recordId: reseller.id, action: "create", oldValues: null, newValues: { name, email, cell, company, role: "reseller" } })

  // Create pending documents
  await supabase.from("documents").insert([
    { signer_type: "reseller", signer_id: reseller.id, document_type: "w9_1099", status: "pending" },
    { signer_type: "reseller", signer_id: reseller.id, document_type: "contractor_agreement", status: "pending" },
  ])

  // Email the new reseller their credentials
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
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
    // Email failure shouldn't block creation
    console.error("Failed to send welcome email:", e)
  }

  revalidatePath("/owner/resellers")
  return { success: true, pin_code: reseller.pin_code, resellerId: reseller.id }
}
