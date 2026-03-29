import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import Link from "next/link"
import {
  Users,
  UserCheck,
  Building2,
  Star,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

export default async function OwnerDashboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Parallel data fetches
  const [
    { count: resellerCount },
    { count: salespersonCount },
    { count: clientCount },
    { count: reviewCount },
    { data: removedReviews },
    { data: invoices },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("resellers").select("id", { count: "exact", head: true }).eq("role", "reseller"),
    supabase.from("salespeople").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }).in("status", ["removed", "waiting_for_payment", "paid"]),
    supabase.from("invoices").select("id, status, total_amount, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id, event_type, subject, created_at").order("created_at", { ascending: false }).limit(10),
  ])

  const totalRevenue = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount), 0)

  const overdueCount = (invoices ?? []).filter((i) => i.status === "overdue").length
  const pendingCount = (invoices ?? []).filter((i) => i.status === "sent").length

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
          Owner Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Business Threat Solutions — complete overview
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Resellers"
          value={resellerCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          subtext="active resellers"
        />
        <StatsCard
          label="Salespeople"
          value={salespersonCount ?? 0}
          icon={<UserCheck className="h-5 w-5" />}
          subtext="across all teams"
        />
        <StatsCard
          label="Total Clients"
          value={clientCount ?? 0}
          icon={<Building2 className="h-5 w-5" />}
          subtext={`${reviewCount ?? 0} reviews tracked`}
        />
        <StatsCard
          label="Reviews Removed"
          value={removedReviews?.length ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          subtext={`${((removedReviews?.length ?? 0) / Math.max(reviewCount ?? 1, 1) * 100).toFixed(0)}% success`}
        />
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="Pending Invoices"
          value={pendingCount}
          icon={<FileText className="h-5 w-5" />}
          subtext="awaiting payment"
        />
        <StatsCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          subtext={overdueCount > 0 ? "action required" : "all clear"}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent invoices */}
        <div className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Invoices</h2>
            <Link href="/owner/invoices" className="text-xs text-steel hover:text-steel-light">
              View all
            </Link>
          </div>
          {(invoices ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No invoices yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(invoices ?? []).slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium text-foreground font-mono">
                      ${Number(inv.total_amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={inv.status as "sent" | "paid" | "overdue" | "draft"} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          {(recentActivity ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(recentActivity ?? []).slice(0, 5).map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <p className="text-xs font-medium text-foreground">{n.subject}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()} — {n.event_type.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
