import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
  reseller_set: "Reseller Set",
  owner_plan_a: "Plan A",
  owner_plan_b: "Plan B",
}

export default async function SalespeoplePerformancePage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch all salespeople with their reseller parent name
  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, name, parent_type, reseller_id, commission_plan_type, pricing_plan, resellers(name)")
    .order("name")

  const spList = salespeople ?? []
  const spIds = spList.map((s) => s.id)

  // Fetch paid invoices for all salespeople
  const { data: invoices } = await supabase
    .from("invoices")
    .select("salesperson_id, total_amount, salesperson_amount")
    .eq("status", "paid")
    .in("salesperson_id", spIds.length > 0 ? spIds : ["__none__"])

  // Build per-SP stats
  const statsMap: Record<string, { deals: number; revenue: number; commission: number }> = {}
  for (const sp of spList) {
    statsMap[sp.id] = { deals: 0, revenue: 0, commission: 0 }
  }
  for (const inv of invoices ?? []) {
    if (inv.salesperson_id && statsMap[inv.salesperson_id]) {
      statsMap[inv.salesperson_id].deals++
      statsMap[inv.salesperson_id].revenue += Number(inv.total_amount)
      statsMap[inv.salesperson_id].commission += Number(inv.salesperson_amount)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Salesperson Performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">All salespeople across resellers and owner-direct</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {spList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No salespeople found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Parent</th>
                <th className="px-5 py-3 text-left">Plan Type</th>
                <th className="px-5 py-3 text-left">Deals</th>
                <th className="px-5 py-3 text-left">Revenue</th>
                <th className="px-5 py-3 text-left">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spList.map((sp) => {
                const stats = statsMap[sp.id] ?? { deals: 0, revenue: 0, commission: 0 }
                const parentReseller = sp.resellers as unknown as { name: string } | null
                const parentName = sp.parent_type === "owner" ? "Owner-Direct" : (parentReseller?.name ?? "—")
                const planLabel = sp.commission_plan_type
                  ? PLAN_LABELS[sp.commission_plan_type] ?? sp.commission_plan_type
                  : sp.pricing_plan
                    ? PLAN_LABELS[sp.pricing_plan] ?? sp.pricing_plan
                    : "Global"

                return (
                  <tr key={sp.id} className="hover:bg-surface/80">
                    <td className="px-5 py-3 font-medium text-foreground">{sp.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{parentName}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{planLabel}</td>
                    <td className="px-5 py-3 text-foreground">{stats.deals}</td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      ${stats.revenue.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      ${stats.commission.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
