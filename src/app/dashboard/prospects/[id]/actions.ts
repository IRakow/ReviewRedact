"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { getResellerIdForClient, getSalespersonIdForClient } from "@/lib/auth"

async function verifyProspectAccess(session: NonNullable<Awaited<ReturnType<typeof getSession>>>, prospectId: string) {
  const supabase = createServerClient()

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single()

  if (error || !prospect) {
    throw new Error("Prospect not found")
  }

  if (session.user_type === "salesperson" && prospect.created_by_id !== session.user_id) {
    throw new Error("Unauthorized")
  }

  if (session.user_type === "reseller") {
    const { data: salespeople } = await supabase
      .from("salespeople")
      .select("id")
      .eq("reseller_id", session.user_id)

    const spIds = (salespeople ?? []).map((sp: { id: string }) => sp.id)
    const allowedIds = [session.user_id, ...spIds]

    if (!allowedIds.includes(prospect.created_by_id)) {
      throw new Error("Unauthorized")
    }
  }

  return prospect
}

export async function updateProspectNotes(prospectId: string, notes: string) {
  const session = await getSession()
  if (!session) redirect("/")

  await verifyProspectAccess(session, prospectId)

  const supabase = createServerClient()

  const { error } = await supabase
    .from("prospects")
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId)

  if (error) {
    throw new Error(`Failed to update notes: ${error.message}`)
  }

  revalidatePath(`/dashboard/prospects/${prospectId}`)
}

export async function convertToClient(prospectId: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect("/")

  const prospect = await verifyProspectAccess(session, prospectId)

  const businessName = formData.get("business_name") as string
  const ownerName = formData.get("owner_name") as string
  const address = formData.get("address") as string

  if (!businessName?.trim()) {
    throw new Error("Business name is required")
  }

  const supabase = createServerClient()

  const resellerId = getResellerIdForClient(session)
  const salespersonId = getSalespersonIdForClient(session)

  const insertData: Record<string, unknown> = {
    reseller_id: resellerId ?? session.user_id,
    business_name: businessName.trim(),
    owner_name: (ownerName || prospect.contact_name || "").trim() || "Unknown",
    address: (address || "").trim() || "TBD",
    google_url: prospect.google_url,
    status: "pending",
  }

  if (prospect.phone) {
    insertData.business_phone = prospect.phone
  }

  if (salespersonId) {
    insertData.salesperson_id = salespersonId
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert(insertData)
    .select("id")
    .single()

  if (clientError) {
    throw new Error(`Failed to create client: ${clientError.message}`)
  }

  // Update prospect status
  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      status: "converted",
      converted_client_id: client.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId)

  if (updateError) {
    throw new Error(`Failed to update prospect: ${updateError.message}`)
  }

  redirect(`/dashboard/clients/${client.id}`)
}

export async function markAsLost(prospectId: string) {
  const session = await getSession()
  if (!session) redirect("/")

  await verifyProspectAccess(session, prospectId)

  const supabase = createServerClient()

  const { error } = await supabase
    .from("prospects")
    .update({
      status: "lost",
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId)

  if (error) {
    throw new Error(`Failed to mark as lost: ${error.message}`)
  }

  revalidatePath(`/dashboard/prospects/${prospectId}`)
}
