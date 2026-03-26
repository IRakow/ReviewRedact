import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ArrowLeft, Users, DollarSign, BarChart3, TrendingUp, Target } from "lucide-react"
import { ResellerDetailCharts } from "./ResellerDetailCharts"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[Number(m) - 1]} ${y}`
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

  // Fetch clients under this reseller
  const { data: resellerClients } = await supabase
    .from("clients")
    .select("id, status")
    .eq("reseller_id", id)

  const clientCount = resellerClients?.length ?? 0

  // Fetch all paid invoices for this reseller
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, salesperson_id, total_amount, bts_base_amount, reseller_amount, salesperson_amount, created_at, paid_at, status")
    .eq("reseller_id", id)

  const allInvoices = invoices ?? []
  const paidInvoices = allInvoices.filter((i) => i.status === "paid")

  // Reseller-level stats
  const totalDeals = paidInvoices.length
  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total_amount), 0)
  const totalCommission = paidInvoices.reduce((s, i) => s + Number(i.reseller_amount), 0)
  const avgDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0

  // Per-SP stats
  const spStatsMap: Record<string, { deals: number; revenue: number; commission: number }> = {}
  for (const sp of spList) {
    spStatsMap[sp.id] = { deals: 0, revenue: 0, commission: 0 }
  }
  for (const inv of paidInvoices) {
    if (inv.salesperson_id && spStatsMap[inv.salesperson_id]) {
      spStatsMap[inv.salesperson_id].deals++
      spStatsMap[inv.salesperson_id].revenue += Number(inv.total_amount)
      spStatsMap[inv.salesperson_id].commission += Number(inv.salesperson_amount)
    }
  }

  // Revenue over time (monthly) for this reseller
  const revenueByMonth: Record<string, { total: number; bts: number; reseller: number; salesperson: number }> = {}
  for (const inv of paidInvoices) {
    const key = monthKey(inv.paid_at ?? inv.created_at)
    if (!revenueByMonth[key]) revenueByMonth[key] = { total: 0, bts: 0, reseller: 0, salesperson: 0 }
    revenueByMonth[key].total += Number(inv.total_amount)
    revenueByMonth[key].bts += Number(inv.bts_base_amount)
    revenueByMonth[key].reseller += Number(inv.reseller_amount)
    revenueByMonth[key].salesperson += Number(inv.salesperson_amount)
  }
  const revenueTimeline = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ date: monthLabel(key), ...vals }))

  // Commission split totals for donut
  const totalBts = paidInvoices.reduce((s, i) => s + Number(i.bts_base_amount), 0)
  const totalSpCommission = paidInvoices.reduce((s, i) => s + Number(i.salesperson_amount), 0)
  const commissionSplitData = [
    { name: "BTS Base", value: totalBts, color: "#8b5cf6" },
    { name: "Reseller Commission", value: totalCommission, color: "#06b6d4" },
    { name: "SP Commission", value: totalSpCommission, color: "#10b981" },
  ].filter((d) => d.value > 0)

  // Per-SP bar chart
  const spBarData = spList
    .map((sp) => ({
      name: sp.name,
      value: spStatsMap[sp.id]?.revenue ?? 0,
      id: sp.id,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/reports/resellers" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{reseller.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reseller.company ? `${reseller.company} — ` : ""}{reseller.email}
            <span className="ml-2 rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {PLAN_LABELS[reseller.commission_plan_type] ?? reseller.commission_plan_type}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
          label="Commission"
          value={`$${totalCommission.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          label="Avg Deal Size"
          value={`$${avgDealSize.toLocaleString()}`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatsCard
          label="Clients"
          value={clientCount}
          icon={<Users className="h-5 w-5" />}
          subtext={`${spList.length} salespeople`}
        />
      </div>

      {/* Charts (client component) */}
      <ResellerDetailCharts
        revenueTimeline={revenueTimeline}
        commissionSplitData={commissionSplitData}
        spBarData={spBarData}
      />

      {/* Team breakdown table */}
      <div className="noise-overlay relative overflow-hidden rounded-md border border-border bg-surface">
        <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-steel/40 to-transparent" />
        <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-steel/40 to-transparent" />
        <div className="border-b border-border px-5 py-4">
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
                  <tr key={sp.id} className="hover:bg-surface/80 transition-colors">
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
