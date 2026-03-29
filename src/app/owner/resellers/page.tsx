import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function OwnerResellersPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: resellers } = await supabase
    .from("resellers")
    .select("id, name, email, company, base_rate_google, is_active, role, created_at")
    .eq("role", "reseller")
    .order("created_at", { ascending: false })

  // Get client counts per reseller
  const { data: clientCounts } = await supabase
    .from("clients")
    .select("reseller_id")

  const countMap: Record<string, number> = {}
  for (const c of clientCounts ?? []) {
    countMap[c.reseller_id] = (countMap[c.reseller_id] ?? 0) + 1
  }

  // Get document signing status per reseller
  const { data: docStatus } = await supabase
    .from("documents")
    .select("signer_id, document_type, status")
    .eq("signer_type", "reseller")

  const docMap: Record<string, { w9: boolean; ca: boolean }> = {}
  for (const d of docStatus ?? []) {
    if (!docMap[d.signer_id]) docMap[d.signer_id] = { w9: false, ca: false }
    if (d.status === "signed") {
      if (d.document_type === "w9_1099") docMap[d.signer_id].w9 = true
      if (d.document_type === "contractor_agreement") docMap[d.signer_id].ca = true
    }
  }

  // Get salesperson counts per reseller
  const { data: spCounts } = await supabase
    .from("salespeople")
    .select("reseller_id")
    .eq("parent_type", "reseller")

  const spCountMap: Record<string, number> = {}
  for (const sp of spCounts ?? []) {
    if (sp.reseller_id) {
      spCountMap[sp.reseller_id] = (spCountMap[sp.reseller_id] ?? 0) + 1
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Resellers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all resellers</p>
        </div>
        <Link href="/owner/resellers/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Reseller
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(resellers ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No resellers yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Company</th>
                <th className="px-5 py-3 text-left">Base Rate</th>
                <th className="px-5 py-3 text-left">Clients</th>
                <th className="px-5 py-3 text-left">Salespeople</th>
                <th className="px-5 py-3 text-left">Docs</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(resellers ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.company ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-foreground">${r.base_rate_google}</td>
                  <td className="px-5 py-3 text-muted-foreground">{countMap[r.id] ?? 0}</td>
                  <td className="px-5 py-3 text-muted-foreground">{spCountMap[r.id] ?? 0}</td>
                  <td className="px-5 py-3">
                    {(() => {
                      const docs = docMap[r.id]
                      if (!docs) return <span className="text-[10px] font-medium uppercase tracking-wider text-red-400">Not Started</span>
                      if (docs.w9 && docs.ca) return <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Complete</span>
                      return <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400">Incomplete</span>
                    })()}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.is_active ? "active" : "paused"} />
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/owner/resellers/${r.id}`} className="text-xs text-steel hover:text-steel-light">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
