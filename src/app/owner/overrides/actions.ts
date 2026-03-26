"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

  const { error } = await supabase.from("rate_overrides").insert({
    set_by_type: "owner",
    set_by_id: session.user_id,
    target_type: targetType,
    target_id: targetId,
    client_id: clientId,
    rate_google: rateGoogle,
    notes,
  })

  if (error) return { error: error.message }

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

  const supabase = createServerClient()

  const { error } = await supabase
    .from("rate_overrides")
    .update({ rate_google: rateGoogle, notes })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/overrides")
  return { success: true }
}

export async function deleteOverride(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from("rate_overrides")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/owner/overrides")
  return { success: true }
}
