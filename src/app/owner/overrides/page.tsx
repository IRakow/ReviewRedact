import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"

export default async function OwnerOverridesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: overrides } = await supabase
    .from("rate_overrides")
    .select("id, set_by_type, set_by_id, target_type, target_id, client_id, rate_google, notes, created_at")
    .order("created_at", { ascending: false })

  // Get names
  const allIds = new Set<string>()
  for (const o of overrides ?? []) {
    allIds.add(o.set_by_id)
    allIds.add(o.target_id)
    if (o.client_id) allIds.add(o.client_id)
  }

  const [{ data: resellers }, { data: salespeople }, { data: clients }] = await Promise.all([
    supabase.from("resellers").select("id, name").in("id", Array.from(allIds)),
    supabase.from("salespeople").select("id, name").in("id", Array.from(allIds)),
    supabase.from("clients").select("id, business_name").in("id", Array.from(allIds)),
  ])

  const nameMap: Record<string, string> = {}
  for (const r of resellers ?? []) nameMap[r.id] = r.name
  for (const s of salespeople ?? []) nameMap[s.id] = s.name
  for (const c of clients ?? []) nameMap[c.id] = c.business_name

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Rate Overrides</h1>
        <p className="mt-1 text-sm text-muted-foreground">Per-deal and universal rate adjustments</p>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(overrides ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No rate overrides set</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Set By</th>
                <th className="px-5 py-3 text-left">Target</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Rate</th>
                <th className="px-5 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(overrides ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 text-foreground">{nameMap[o.set_by_id] ?? o.set_by_type}</td>
                  <td className="px-5 py-3 text-foreground">{nameMap[o.target_id] ?? o.target_type}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.client_id ? nameMap[o.client_id] ?? "—" : "Universal"}</td>
                  <td className="px-5 py-3 font-mono text-foreground">${Number(o.rate_google).toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{o.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
