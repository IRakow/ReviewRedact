import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/StatsCard"
import {
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Users,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
} from "lucide-react"
import { ReportsCharts } from "./ReportsCharts"

// ─── helpers ────────────────────────────────────────────────────────────────

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[Number(m) - 1]} ${y}`
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function OwnerReportsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Parallel data fetches
  const [
    { data: invoices },
    { data: clients },
    { data: reviews },
    { data: resellers },
    { data: salespeople },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, status, total_amount, bts_base_amount, reseller_amount, salesperson_amount, reseller_id, salesperson_id, created_at, paid_at"),
    supabase.from("clients").select("id, status"),
    supabase.from("reviews").select("id, status"),
    supabase
      .from("resellers")
      .select("id, name, company")
      .eq("role", "reseller")
      .order("name"),
    supabase
      .from("salespeople")
      .select("id, name, reseller_id, resellers(name)")
      .order("name"),
  ])

  const allInvoices = invoices ?? []
  const paidInvoices = allInvoices.filter((i) => i.status === "paid")
  const allClients = clients ?? []
  const allReviews = reviews ?? []
  const allResellers = resellers ?? []
  const allSalespeople = salespeople ?? []

  // ── Section B: Key Metrics ──
  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total_amount), 0)
  const btsRetained = paidInvoices.reduce((s, i) => s + Number(i.bts_base_amount), 0)
  const activeClients = allClients.filter(
    (c) => c.status === "active" || c.status === "in_progress"
  ).length

  const successStatuses = ["removed", "waiting_for_payment", "paid"]
  const relevantStatuses = ["in_progress", "removed", "waiting_for_payment", "paid", "failed"]
  const relevantReviews = allReviews.filter((r) => relevantStatuses.includes(r.status))
  const successReviews = allReviews.filter((r) => successStatuses.includes(r.status))
  const successRate =
    relevantReviews.length > 0
      ? Math.round((successReviews.length / relevantReviews.length) * 100)
      : 0

  // ── Section A: Revenue Over Time (monthly) ──
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

  // ── Section C: Revenue by Reseller ──
  const revenueByReseller: Record<string, number> = {}
  for (const inv of paidInvoices) {
    if (inv.reseller_id) {
      revenueByReseller[inv.reseller_id] = (revenueByReseller[inv.reseller_id] ?? 0) + Number(inv.total_amount)
    }
  }
  const resellerBarData = allResellers
    .map((r) => ({
      name: r.company ?? r.name,
      value: revenueByReseller[r.id] ?? 0,
      id: r.id,
    }))
    .sort((a, b) => b.value - a.value)

  // ── Section D: Revenue by Salesperson ──
  const revenueBySp: Record<string, number> = {}
  for (const inv of paidInvoices) {
    if (inv.salesperson_id) {
      revenueBySp[inv.salesperson_id] = (revenueBySp[inv.salesperson_id] ?? 0) + Number(inv.total_amount)
    }
  }
  const spBarData = allSalespeople
    .map((sp) => {
      const parentReseller = sp.resellers as unknown as { name: string } | null
      const parentName = parentReseller?.name ?? "Owner-Direct"
      return {
        name: `${sp.name} (${parentName})`,
        value: revenueBySp[sp.id] ?? 0,
        id: sp.id,
      }
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // ── Section E: Review Status Breakdown ──
  const statusCounts: Record<string, number> = {}
  for (const r of allReviews) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  }
  const STATUS_COLORS: Record<string, string> = {
    active: "#64748b",
    in_progress: "#f59e0b",
    removed: "#10b981",
    waiting_for_payment: "#3b82f6",
    paid: "#22c55e",
    failed: "#ef4444",
  }
  const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    in_progress: "In Progress",
    removed: "Removed",
    waiting_for_payment: "Waiting for Payment",
    paid: "Paid",
    failed: "Failed",
  }
  const donutData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? "#6366f1",
    }))

  // ── Section F: Monthly Invoice Trends ──
  const trendByMonth: Record<string, { paid: number; sent: number; overdue: number }> = {}
  for (const inv of allInvoices) {
    const key = monthKey(inv.created_at)
    if (!trendByMonth[key]) trendByMonth[key] = { paid: 0, sent: 0, overdue: 0 }
    if (inv.status === "paid") trendByMonth[key].paid++
    else if (inv.status === "sent") trendByMonth[key].sent++
    else if (inv.status === "overdue") trendByMonth[key].overdue++
  }
  const trendTimeline = Object.entries(trendByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ date: monthLabel(key), ...vals }))

  // ── Section G: Top Performers ──
  const topResellers = [...resellerBarData].slice(0, 5)
  const topSalespeople = [...spBarData].slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, commissions, and performance across the entire network
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/owner/reports/resellers"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            Resellers
          </Link>
          <Link
            href="/owner/reports/salespeople"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Salespeople
          </Link>
          <Link
            href="/owner/reports/builder"
            className="flex items-center gap-1.5 rounded-md border border-steel/30 bg-steel/10 px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-steel/20"
          >
            <Layers className="h-3.5 w-3.5" />
            Report Builder
          </Link>
        </div>
      </div>

      {/* Section B: Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="BTS Retained"
          value={`$${btsRetained.toLocaleString()}`}
          icon={<ShieldCheck className="h-5 w-5" />}
          subtext="base amount kept"
        />
        <StatsCard
          label="Active Clients"
          value={activeClients}
          icon={<Users className="h-5 w-5" />}
          subtext={`${allClients.length} total`}
        />
        <StatsCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={<Activity className="h-5 w-5" />}
          subtext={`${successReviews.length} of ${relevantReviews.length} reviews`}
        />
      </div>

      {/* Client-side charts */}
      <ReportsCharts
        revenueTimeline={revenueTimeline}
        resellerBarData={resellerBarData}
        spBarData={spBarData}
        donutData={donutData}
        trendTimeline={trendTimeline}
        topResellers={topResellers}
        topSalespeople={topSalespeople}
      />
    </div>
  )
}
