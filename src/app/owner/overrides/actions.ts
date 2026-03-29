"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAudit, getRecordForAudit } from "@/lib/audit"

export async function createOverride(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const targetType = formData.get("target_type") as string
  const targetId = formData.get("target_id") as string
  const clientId = (formData.get("client_id") as string) || null
  const rateGoogle = Number(formData.get("rate_google"))
  const notes = (formData.get("notes") as string) || null

  if (!targetType || !targetId || !rateGoogle) {
    return { error: "Target, target ID, and rate are required" }
  }

  if (!["reseller", "salesperson"].includes(targetType)) {
    return { error: "Invalid target type" }
  }

  if (rateGoogle < 0) {
    return { error: "Rate must be a positive number" }
  }

  const supabase = createServerClient()

  const newValues = {
    set_by_type: "owner",
    set_by_id: session.user_id,
    target_type: targetType,
    target_id: targetId,
    client_id: clientId,
    rate_google: rateGoogle,
    notes,
  }

  const { data: inserted, error } = await supabase.from("rate_overrides").insert(newValues).select("id").single()

  if (error) return { error: error.message }

  await logAudit({ tableName: "rate_overrides", recordId: inserted.id, action: "create", oldValues: null, newValues })

  revalidatePath("/owner/overrides")
  return { success: true }
}

export async function updateOverride(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const rateGoogle = Number(formData.get("rate_google"))
  const notes = (formData.get("notes") as string) || null

  if (!rateGoogle || rateGoogle < 0) {
    return { error: "Rate must be a positive number" }
  }

  const old = await getRecordForAudit("rate_overrides", id)
  const supabase = createServerClient()
  const newValues = { rate_google: rateGoogle, notes }

  const { error } = await supabase
    .from("rate_overrides")
    .update(newValues)
    .eq("id", id)

  if (error) return { error: error.message }

  await logAudit({ tableName: "rate_overrides", recordId: id, action: "update", oldValues: old, newValues })

  revalidatePath("/owner/overrides")
  return { success: true }
}

export async function deleteOverride(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const old = await getRecordForAudit("rate_overrides", id)
  const supabase = createServerClient()

  const { error } = await supabase
    .from("rate_overrides")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  await logAudit({ tableName: "rate_overrides", recordId: id, action: "delete", oldValues: old, newValues: null })

  revalidatePath("/owner/overrides")
  return { success: true }
}
