import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerClient } from "@/lib/supabase/server"
import { PIN_CODE_LENGTH, OWNER_EMAILS } from "@/lib/constants"

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

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      // Still return success for security
      return NextResponse.json({ success: true })
    }

    const supabase = createServerClient()
    const trimmedName = name.trim()

    // Search resellers (non-owner) by name
    const { data: reseller } = await supabase
      .from("resellers")
      .select("id, name, email, role")
      .ilike("name", trimmedName)
      .eq("role", "reseller")
      .maybeSingle()

    if (reseller) {
      const newPin = await generateUniquePinCode()

      await supabase
        .from("resellers")
        .update({ pin_code: newPin, updated_at: new Date().toISOString() })
        .eq("id", reseller.id)

      // Email the user
      try {
        await resend.emails.send({
          from: "Review Redact <notifications@reviewredact.com>",
          to: reseller.email,
          subject: "ReviewRedact \u2014 Your New Access Code",
          html: `<p>Hi ${reseller.name},</p><p>Your access code has been reset.</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 0.5em; font-family: monospace;">${newPin}</p><p>Please log in at reviewredact.com and keep this code secure.</p>`,
        })
      } catch (err) {
        console.error("Failed to send PIN reset email:", err)
      }

      // Notify owners
      try {
        await resend.emails.send({
          from: "Review Redact <notifications@reviewredact.com>",
          to: OWNER_EMAILS,
          subject: `[PIN Reset] ${reseller.name} requested a code reset`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;"><h2 style="color: #1a1a1a;">PIN Reset Alert</h2><p>Reseller <strong>${reseller.name}</strong> (${reseller.email}) requested a PIN reset via the login page.</p><p>A new code has been sent to their email.</p><br/><p style="font-size: 11px; color: #999;">Automated alert \u2014 ReviewRedact</p></div>`,
        })
      } catch (err) {
        console.error("Failed to send owner PIN reset notification:", err)
      }

      return NextResponse.json({ success: true })
    }

    // Search salespeople by name
    const { data: salesperson } = await supabase
      .from("salespeople")
      .select("id, name, email")
      .ilike("name", trimmedName)
      .maybeSingle()

    if (salesperson) {
      const newPin = await generateUniquePinCode()

      await supabase
        .from("salespeople")
        .update({ pin_code: newPin, updated_at: new Date().toISOString() })
        .eq("id", salesperson.id)

      // Email the user
      try {
        await resend.emails.send({
          from: "Review Redact <notifications@reviewredact.com>",
          to: salesperson.email,
          subject: "ReviewRedact \u2014 Your New Access Code",
          html: `<p>Hi ${salesperson.name},</p><p>Your access code has been reset.</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 0.5em; font-family: monospace;">${newPin}</p><p>Please log in at reviewredact.com and keep this code secure.</p>`,
        })
      } catch (err) {
        console.error("Failed to send PIN reset email:", err)
      }

      // Notify owners
      try {
        await resend.emails.send({
          from: "Review Redact <notifications@reviewredact.com>",
          to: OWNER_EMAILS,
          subject: `[PIN Reset] ${salesperson.name} requested a code reset`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;"><h2 style="color: #1a1a1a;">PIN Reset Alert</h2><p>Salesperson <strong>${salesperson.name}</strong> (${salesperson.email}) requested a PIN reset via the login page.</p><p>A new code has been sent to their email.</p><br/><p style="font-size: 11px; color: #999;">Automated alert \u2014 ReviewRedact</p></div>`,
        })
      } catch (err) {
        console.error("Failed to send owner PIN reset notification:", err)
      }
    }

    // Always return success (don't reveal if account exists)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
