import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function OwnerSalespeopleListPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, name, email, parent_type, pricing_plan, base_rate_google, is_active, reseller_id, created_at")
    .order("created_at", { ascending: false })

  // Get reseller names
  const { data: resellers } = await supabase
    .from("resellers")
    .select("id, name")
    .eq("role", "reseller")

  const resellerMap: Record<string, string> = {}
  for (const r of resellers ?? []) {
    resellerMap[r.id] = r.name
  }

  function getPlanLabel(sp: { pricing_plan: string | null; parent_type: string; base_rate_google: number }) {
    if (sp.pricing_plan === "owner_plan_a") return "Plan A ($750)"
    if (sp.pricing_plan === "owner_plan_b") return "Plan B ($1K+)"
    return `$${sp.base_rate_google}`
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">All Salespeople</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reseller teams + owner-direct</p>
        </div>
        <Link href="/owner/salespeople/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Direct Salesperson
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(salespeople ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No salespeople yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Parent</th>
                <th className="px-5 py-3 text-left">Plan / Rate</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(salespeople ?? []).map((sp) => (
                <tr key={sp.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">{sp.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {sp.parent_type === "owner" ? (
                      <span className="text-steel">Owner-direct</span>
                    ) : (
                      resellerMap[sp.reseller_id ?? ""] ?? "Unknown"
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-foreground">{getPlanLabel(sp)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sp.is_active ? "active" : "paused"} />
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/owner/salespeople/${sp.id}`} className="text-xs text-steel hover:text-steel-light">
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
