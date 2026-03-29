"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  if (session.user_type === "owner") return { error: "Owners cannot update profile here" }

  const table = session.user_type === "reseller" ? "resellers" : "salespeople"

  const supabase = createServerClient()

  const { error } = await supabase
    .from(table)
    .update({
      company: formData.get("company") as string || null,
      email: formData.get("email") as string,
      cell: formData.get("cell") as string,
      address: formData.get("address") as string || null,
    })
    .eq("id", session.user_id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/profile")
  return { success: true }
}
