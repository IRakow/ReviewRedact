"use server"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

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

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("clients")
    .insert({
      reseller_id: session.reseller_id,
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      address: address.trim(),
      business_phone: businessPhone?.trim() || null,
      owner_phone: ownerPhone?.trim() || null,
      owner_email: ownerEmail?.trim() || null,
      google_url: googleUrl.trim(),
      status: "pending",
    })
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

  const supabase = createServerClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from("clients")
    .select("reseller_id")
    .eq("id", id)
    .single()

  if (!existing) {
    throw new Error("Client not found")
  }

  if (session.role !== "admin" && existing.reseller_id !== session.reseller_id) {
    throw new Error("Unauthorized")
  }

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
