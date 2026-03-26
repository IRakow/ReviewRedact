"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createClientAsOwner(formData: FormData) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const businessName = formData.get("business_name") as string
  const ownerName = formData.get("owner_name") as string
  const address = formData.get("address") as string
  const businessPhone = (formData.get("business_phone") as string) || null
  const ownerPhone = (formData.get("owner_phone") as string) || null
  const ownerEmail = (formData.get("owner_email") as string) || null
  const googleUrl = formData.get("google_url") as string
  const resellerId = (formData.get("reseller_id") as string) || null
  const salespersonId = (formData.get("salesperson_id") as string) || null

  if (!businessName || !ownerName || !address || !googleUrl) {
    return { error: "Business name, owner name, address, and Google URL are required" }
  }

  const supabase = createServerClient()

  const insertData: Record<string, unknown> = {
    reseller_id: resellerId ?? session.user_id, // Owner's own ID for owner-direct
    business_name: businessName.trim(),
    owner_name: ownerName.trim(),
    address: address.trim(),
    business_phone: businessPhone?.trim() || null,
    owner_phone: ownerPhone?.trim() || null,
    owner_email: ownerEmail?.trim() || null,
    google_url: googleUrl.trim(),
    status: "pending",
  }

  if (salespersonId) {
    insertData.salesperson_id = salespersonId
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(insertData)
    .select("id")
    .single()

  if (error) {
    return { error: `Failed to create client: ${error.message}` }
  }

  revalidatePath("/owner/clients")
  redirect(`/owner/clients/${data.id}`)
}
