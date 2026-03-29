import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { createOverride, deleteOverride } from "./actions"
import { OverrideForm } from "./OverrideForm"

export default async function OwnerOverridesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch overrides + all resellers/salespeople/clients for the dropdown
  const [
    { data: overrides },
    { data: allResellers },
    { data: allSalespeople },
    { data: allClients },
  ] = await Promise.all([
    supabase
      .from("rate_overrides")
      .select("id, set_by_type, set_by_id, target_type, target_id, client_id, rate_google, notes, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("resellers").select("id, name").order("name"),
    supabase.from("salespeople").select("id, name").order("name"),
    supabase.from("clients").select("id, business_name").order("business_name"),
  ])

  // Build name map for display
  const nameMap: Record<string, string> = {}
  for (const r of allResellers ?? []) nameMap[r.id] = r.name
  for (const s of allSalespeople ?? []) nameMap[s.id] = s.name
  for (const c of allClients ?? []) nameMap[c.id] = c.business_name

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">Rate Overrides</h1>
        <p className="mt-1 text-sm text-muted-foreground">Per-deal and universal rate adjustments</p>
      </div>

      <OverrideForm
        resellers={(allResellers ?? []).map((r) => ({ id: r.id, name: r.name }))}
        salespeople={(allSalespeople ?? []).map((s) => ({ id: s.id, name: s.name }))}
        clients={(allClients ?? []).map((c) => ({ id: c.id, business_name: c.business_name }))}
        overrides={(overrides ?? []).map((o) => ({
          id: o.id,
          set_by_type: o.set_by_type,
          set_by_id: o.set_by_id,
          target_type: o.target_type,
          target_id: o.target_id,
          client_id: o.client_id,
          rate_google: o.rate_google,
          notes: o.notes,
          created_at: o.created_at,
        }))}
        nameMap={nameMap}
        createOverride={createOverride}
        deleteOverride={deleteOverride}
      />
    </div>
  )
}
