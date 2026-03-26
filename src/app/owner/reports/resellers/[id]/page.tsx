import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ArrowLeft, Users, DollarSign, BarChart3, TrendingUp } from "lucide-react"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export default async function ResellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch reseller info
  const { data: reseller } = await supabase
    .from("resellers")
    .select("id, name, company, email, commission_plan_type")
    .eq("id", id)
    .eq("role", "reseller")
    .single()

  if (!reseller) redirect("/owner/reports/resellers")

  // Fetch salespeople under this reseller
  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, name, commission_plan_type")
    .eq("reseller_id", id)
    .order("name")

  const spList = salespeople ?? []
  const spIds = spList.map((s) => s.id)

  // Fetch all paid invoices for this reseller
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, salesperson_id, total_amount, reseller_amount, salesperson_amount")
    .eq("reseller_id", id)
    .eq("status", "paid")

  const invList = invoices ?? []

  // Reseller-level stats
  const totalDeals = invList.length
  const totalRevenue = invList.reduce((s, i) => s + Number(i.total_amount), 0)
  const totalCommission = invList.reduce((s, i) => s + Number(i.reseller_amount), 0)
  const avgDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0

  // Per-SP stats
  const spStatsMap: Record<string, { deals: number; revenue: number; commission: number }> = {}
  for (const sp of spList) {
    spStatsMap[sp.id] = { deals: 0, revenue: 0, commission: 0 }
  }
  for (const inv of invList) {
    if (inv.salesperson_id && spStatsMap[inv.salesperson_id]) {
      spStatsMap[inv.salesperson_id].deals++
      spStatsMap[inv.salesperson_id].revenue += Number(inv.total_amount)
      spStatsMap[inv.salesperson_id].commission += Number(inv.salesperson_amount)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/reports/resellers" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{reseller.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reseller.company ? `${reseller.company} — ` : ""}{reseller.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Total Deals"
          value={totalDeals}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatsCard
          label="Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatsCard
          label="Commission Earned"
          value={`$${totalCommission.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          label="Avg Deal Size"
          value={`$${avgDealSize.toLocaleString()}`}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Team breakdown */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Team Breakdown</h2>
        </div>

        {spList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No salespeople under this reseller</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Deals</th>
                <th className="px-5 py-3 text-left">Revenue</th>
                <th className="px-5 py-3 text-left">Commission</th>
                <th className="px-5 py-3 text-left">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spList.map((sp) => {
                const stats = spStatsMap[sp.id] ?? { deals: 0, revenue: 0, commission: 0 }
                return (
                  <tr key={sp.id} className="hover:bg-surface/80">
                    <td className="px-5 py-3 font-medium text-foreground">{sp.name}</td>
                    <td className="px-5 py-3 text-foreground">{stats.deals}</td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      ${stats.revenue.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      ${stats.commission.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {sp.commission_plan_type
                        ? PLAN_LABELS[sp.commission_plan_type] ?? sp.commission_plan_type
                        : "Global"}
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
