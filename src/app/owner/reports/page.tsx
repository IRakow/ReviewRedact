import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { DollarSign, ShieldCheck, TrendingUp, Users, ArrowRight } from "lucide-react"

export default async function OwnerReportsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch summary data
  const [{ data: invoices }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("status, total_amount, bts_base_amount, reseller_amount, salesperson_amount"),
    supabase.from("clients").select("id, status"),
  ])

  const paidInvoices = (invoices ?? []).filter((i) => i.status === "paid")
  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total_amount), 0)
  const totalBtsRetained = paidInvoices.reduce((s, i) => s + Number(i.bts_base_amount), 0)
  const totalCommissions = paidInvoices.reduce(
    (s, i) => s + Number(i.reseller_amount) + Number(i.salesperson_amount),
    0
  )
  const activeClients = (clients ?? []).filter(
    (c) => c.status === "active" || c.status === "in_progress"
  ).length

  const quickLinks = [
    {
      title: "Reseller Performance",
      description: "Revenue, team size, and commission stats for each reseller",
      href: "/owner/reports/resellers",
      icon: Users,
    },
    {
      title: "Salesperson Performance",
      description: "All salespeople across resellers and owner-direct",
      href: "/owner/reports/salespeople",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revenue, commissions, and team performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="BTS Retained"
          value={`$${totalBtsRetained.toLocaleString()}`}
          icon={<ShieldCheck className="h-5 w-5" />}
          subtext="base amount"
        />
        <StatsCard
          label="Commissions Paid"
          value={`$${totalCommissions.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtext="reseller + SP"
        />
        <StatsCard
          label="Active Clients"
          value={activeClients}
          icon={<Users className="h-5 w-5" />}
          subtext="active or in progress"
        />
      </div>

      {/* Quick links */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Reports</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-md border border-border bg-surface p-5 transition-all hover:border-steel/30 hover:bg-steel/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-steel/20 bg-steel/10 text-steel">
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-steel">
                      {link.title}
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
