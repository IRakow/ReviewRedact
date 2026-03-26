import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BarChart3, DollarSign, FileText, AlertTriangle, Download, ShieldCheck } from "lucide-react"

export default async function OwnerReportsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch summary data
  const [
    { data: invoices },
    { data: payouts },
  ] = await Promise.all([
    supabase.from("invoices").select("status, total_amount, bts_base_amount, reseller_amount, salesperson_amount"),
    supabase.from("payouts").select("status, amount"),
  ])

  const paidInvoices = (invoices ?? []).filter((i) => i.status === "paid")
  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total_amount), 0)
  const totalBtsRetained = paidInvoices.reduce((s, i) => s + Number(i.bts_base_amount), 0)
  const totalResellerPaid = paidInvoices.reduce((s, i) => s + Number(i.reseller_amount), 0)
  const totalSpPaid = paidInvoices.reduce((s, i) => s + Number(i.salesperson_amount), 0)
  const pendingPayouts = (payouts ?? []).filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0)

  const reports = [
    {
      title: "Revenue Report",
      description: "Total revenue by period, reseller, and salesperson",
      icon: DollarSign,
      stats: `$${totalRevenue.toLocaleString()} total`,
      href: "/owner/invoices",
    },
    {
      title: "Commission Breakdown",
      description: "BTS retained, reseller cuts, salesperson cuts per deal",
      icon: BarChart3,
      stats: `BTS: $${totalBtsRetained.toLocaleString()} | Resellers: $${totalResellerPaid.toLocaleString()} | SP: $${totalSpPaid.toLocaleString()}`,
      href: "/owner/invoices",
    },
    {
      title: "Outstanding Invoices",
      description: "Unpaid and overdue invoices with aging",
      icon: AlertTriangle,
      stats: `${(invoices ?? []).filter((i) => i.status === "sent" || i.status === "overdue").length} outstanding`,
      href: "/owner/invoices",
    },
    {
      title: "Payout Report",
      description: "What BTS owes / has paid to resellers and salespeople",
      icon: FileText,
      stats: `$${pendingPayouts.toLocaleString()} pending payouts`,
      href: "/owner/payments",
    },
    {
      title: "Compliance Audit",
      description: "Double-dipping detection — flags plan violations by owner-direct salespeople",
      icon: ShieldCheck,
      stats: "Check plan rule compliance",
      href: "/owner/salespeople",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">CPA-grade accounting and compliance reports</p>
        </div>
        <button className="flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-steel hover:bg-steel/20">
          <Download className="h-3.5 w-3.5" />
          Export All (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className="group rounded-md border border-border bg-surface p-5 transition-all hover:border-steel/30 hover:bg-steel/5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-steel/20 bg-steel/10 text-steel">
                <report.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-steel">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                <p className="text-xs font-mono text-steel mt-2">{report.stats}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
