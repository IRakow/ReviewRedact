"use server"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { getResellerIdForClient, getSalespersonIdForClient, verifyClientAccess } from "@/lib/auth"

export async function createClient(formData: FormData) {
  const session = await getSession()
  if (!session) redirect("/")

  const businessName = formData.get("business_name") as string
  const ownerName = formData.get("owner_name") as string
  const address = formData.get("address") as string
  const businessPhone = (formData.get("business_phone") as string) || null
  const ownerPhone = (formData.get("owner_phone") as string) || null
  const ownerEmail = (formData.get("owner_email") as string) || null
  const googleUrl = formData.get("google_url") as string

  if (!businessName || !ownerName || !address || !googleUrl) {
    throw new Error("Missing required fields")
  }

  const resellerId = getResellerIdForClient(session)
  if (!resellerId && session.user_type !== "owner") {
    throw new Error("Cannot determine reseller for this client")
  }

  const supabase = createServerClient()

  const insertData: Record<string, unknown> = {
    reseller_id: resellerId ?? session.user_id, // Owner uses own ID as fallback
    business_name: businessName.trim(),
    owner_name: ownerName.trim(),
    address: address.trim(),
    business_phone: businessPhone?.trim() || null,
    owner_phone: ownerPhone?.trim() || null,
    owner_email: ownerEmail?.trim() || null,
    google_url: googleUrl.trim(),
    status: "pending",
  }

  const salespersonId = getSalespersonIdForClient(session)
  if (salespersonId) {
    insertData.salesperson_id = salespersonId
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(insertData)
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`)
  }

  redirect(`/dashboard/clients/${data.id}`)
}

export async function updateClient(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect("/")

  // Verify access
  await verifyClientAccess(session, id)

  const supabase = createServerClient()

  const updates: Record<string, string | null> = {}

  const fields = [
    "business_name",
    "owner_name",
    "address",
    "business_phone",
    "owner_phone",
    "owner_email",
    "google_url",
  ] as const

  for (const field of fields) {
    const value = formData.get(field) as string | null
    if (value !== null) {
      updates[field] = value.trim() || null
    }
  }

  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`)
  }

  redirect(`/dashboard/clients/${id}`)
}
