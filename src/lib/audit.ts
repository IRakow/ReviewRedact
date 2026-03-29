"use server"

import { getSession } from "./session"
import { createServerClient } from "./supabase/server"
import { headers } from "next/headers"

export async function logAudit(params: {
  tableName: string
  recordId: string
  action: "create" | "update" | "delete"
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}) {
  try {
    const session = await getSession()
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"

    const changedFields: string[] = []
    if (params.oldValues && params.newValues) {
      for (const key of Object.keys(params.newValues)) {
        if (
          JSON.stringify(params.oldValues[key]) !==
          JSON.stringify(params.newValues[key])
        ) {
          changedFields.push(key)
        }
      }
    }

    const supabase = createServerClient()
    await supabase.from("audit_log").insert({
      table_name: params.tableName,
      record_id: params.recordId,
      action: params.action,
      changed_by_type: session?.user_type ?? "system",
      changed_by_id: session?.user_id ?? null,
      changed_by_name: session?.name ?? "System",
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
      changed_fields: changedFields.length > 0 ? changedFields : null,
      ip_address: ip,
    })
  } catch (err) {
    // Fire-and-forget: audit failures must never block the main action
    console.error("Audit log failed:", err)
  }
}

// Helper: fetch current record before update (to capture old values)
export async function getRecordForAudit(
  table: string,
  id: string
): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase.from(table).select("*").eq("id", id).single()
    return data as Record<string, unknown> | null
  } catch {
    return null
  }
}
