"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

export interface SavedReportConfig {
  cells: Array<{
    metric: string | null
    groupBy: string | null
  }>
}

export interface SavedReport {
  id: string
  owner_id: string
  name: string
  config: SavedReportConfig
  created_at: string
}

export async function saveReport(name: string, config: SavedReportConfig) {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("saved_reports")
    .insert({
      owner_id: session.user_id,
      name,
      config,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function loadReports(): Promise<SavedReport[]> {
  const session = await getSession()
  if (!session) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from("saved_reports")
    .select("*")
    .eq("owner_id", session.user_id)
    .order("created_at", { ascending: false })

  return (data ?? []) as SavedReport[]
}

export async function deleteReport(id: string) {
  const session = await getSession()
  if (!session) return { error: "Not authenticated" }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("saved_reports")
    .delete()
    .eq("id", id)
    .eq("owner_id", session.user_id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchReportData() {
  const session = await getSession()
  if (!session) return null

  const supabase = createServerClient()

  const [
    { data: invoices },
    { data: clients },
    { data: reviews },
    { data: resellers },
    { data: salespeople },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, status, total_amount, bts_base_amount, reseller_amount, salesperson_amount, reseller_id, salesperson_id, client_id, created_at, paid_at"),
    supabase.from("clients").select("id, business_name, reseller_id, salesperson_id, status"),
    supabase.from("reviews").select("id, client_id, status, removal_date, created_at"),
    supabase.from("resellers").select("id, name, company").eq("role", "reseller"),
    supabase.from("salespeople").select("id, name, reseller_id"),
  ])

  return {
    invoices: invoices ?? [],
    clients: clients ?? [],
    reviews: reviews ?? [],
    resellers: resellers ?? [],
    salespeople: salespeople ?? [],
  }
}
