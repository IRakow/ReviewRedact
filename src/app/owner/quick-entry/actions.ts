"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createQuickEntry(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const title = (formData.get("title") as string)?.trim()
  if (!title) return { error: "Title is required" }

  const type = (formData.get("type") as string) || "misc"
  const contactName = (formData.get("contact_name") as string)?.trim() || null
  const contactEmail = (formData.get("contact_email") as string)?.trim() || null
  const contactPhone = (formData.get("contact_phone") as string)?.trim() || null
  const linkUrl = (formData.get("link_url") as string)?.trim() || null
  const amountStr = (formData.get("amount") as string)?.trim()
  const amount = amountStr ? parseFloat(amountStr) : 0
  const notes = (formData.get("notes") as string)?.trim() || null
  const notifyRaw = (formData.get("notify_emails") as string)?.trim() || ""
  const notifyEmails = notifyRaw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"))

  const { error } = await supabase.from("quick_entries").insert({
    title,
    type,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    link_url: linkUrl,
    amount,
    notes,
    notify_emails: notifyEmails,
    status: "open",
    created_by: session.user_id,
  })

  if (error) return { error: error.message }

  // Send notification emails if any
  if (notifyEmails.length > 0) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : ""}${process.env.NODE_ENV === "production" ? "https://reviewredact.com" : "http://localhost:3000"}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notifyEmails,
          subject: `[ReviewRedact] ${type === "free_demo" ? "Free Demo" : type === "comp" ? "Comp" : "Quick Entry"}: ${title}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2 style="color: #c9a96e;">${title}</h2>
              <p><strong>Type:</strong> ${type.replace(/_/g, " ")}</p>
              ${contactName ? `<p><strong>Contact:</strong> ${contactName}</p>` : ""}
              ${contactEmail ? `<p><strong>Email:</strong> ${contactEmail}</p>` : ""}
              ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ""}
              ${amount > 0 ? `<p><strong>Amount:</strong> $${amount.toFixed(2)}</p>` : amount === 0 ? `<p><strong>Amount:</strong> FREE</p>` : ""}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
              <p style="font-size: 12px; color: #999;">Sent from ReviewRedact Quick Entry</p>
            </div>
          `,
        }),
      })
    } catch {
      // Email failure shouldn't block the entry creation
    }
  }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}

export async function updateEntryStatus(id: string, status: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("quick_entries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}

export async function deleteEntry(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const { error } = await supabase.from("quick_entries").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/quick-entry")
  return { success: true }
}
