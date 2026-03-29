import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { AuditLogTable } from "./AuditLogTable"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; action?: string; user?: string; page?: string }>
}) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = 50
  const offset = (page - 1) * perPage

  const supabase = createServerClient()

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1)

  if (params.table) {
    query = query.eq("table_name", params.table)
  }
  if (params.action) {
    query = query.eq("action", params.action)
  }
  if (params.user) {
    query = query.ilike("changed_by_name", `%${params.user}%`)
  }

  const { data: logs, count } = await query

  // Get distinct table names for filter dropdown
  const { data: tables } = await supabase
    .from("audit_log")
    .select("table_name")
    .order("table_name")

  const uniqueTables = [...new Set((tables ?? []).map((t) => t.table_name))]

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete change history across all records
        </p>
      </div>

      <AuditLogTable
        logs={(logs ?? []).map((l) => ({
          id: l.id,
          table_name: l.table_name,
          record_id: l.record_id,
          action: l.action,
          changed_by_type: l.changed_by_type,
          changed_by_name: l.changed_by_name,
          old_values: l.old_values as Record<string, unknown> | null,
          new_values: l.new_values as Record<string, unknown> | null,
          changed_fields: l.changed_fields as string[] | null,
          ip_address: l.ip_address,
          created_at: l.created_at,
        }))}
        totalCount={count ?? 0}
        currentPage={page}
        perPage={perPage}
        tables={uniqueTables}
        filters={{
          table: params.table ?? "",
          action: params.action ?? "",
          user: params.user ?? "",
        }}
      />
    </div>
  )
}
