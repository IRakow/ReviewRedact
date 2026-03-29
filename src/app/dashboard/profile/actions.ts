"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAudit, getRecordForAudit } from "@/lib/audit"

export async function updateProfile(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  if (session.user_type === "owner") return { error: "Owners cannot update profile here" }

  const table = session.user_type === "reseller" ? "resellers" : "salespeople"

  const old = await getRecordForAudit(table, session.user_id)

  const supabase = createServerClient()

  const newValues = {
    company: formData.get("company") as string || null,
    email: formData.get("email") as string,
    cell: formData.get("cell") as string,
    address: formData.get("address") as string || null,
  }

  const { error } = await supabase
    .from(table)
    .update(newValues)
    .eq("id", session.user_id)

  if (error) return { error: error.message }

  await logAudit({ tableName: table, recordId: session.user_id, action: "update", oldValues: old, newValues })

  revalidatePath("/dashboard/profile")
  return { success: true }
}
