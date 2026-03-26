import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { ArrowLeft, DollarSign, Clock, CheckCircle, FileText } from "lucide-react"

export default async function DashboardInvoicesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const isReseller = session.user_type === "reseller"
  const isSalesperson = session.user_type === "salesperson"

  if (!isReseller && !isSalesperson) redirect("/dashboard")

  const supabase = createServerClient()

  // Build query based on role
  let query = supabase
    .from("invoices")
    .select("id, client_id, total_amount, reseller_amount, salesperson_amount, status, created_at, clients(business_name)")
    .order("created_at", { ascending: false })

  if (isReseller) {
    query = query.eq("reseller_id", session.user_id)
  } else {
    query = query.eq("salesperson_id", session.user_id)
  }

  const { data: invoices } = await query

  const list = invoices ?? []

  // Calculate summaries
  const commissionField = isReseller ? "reseller_amount" : "salesperson_amount"
  const totalEarned = list
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i[commissionField] ?? 0), 0)
  const pendingCount = list.filter((i) => i.status === "sent").length
  const paidCount = list.filter((i) => i.status === "paid").length

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your commission history and pending invoices</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Total Earned"
          value={`$${totalEarned.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          subtext="awaiting payment"
        />
        <StatsCard
          label="Paid"
          value={paidCount}
          icon={<CheckCircle className="h-5 w-5" />}
          subtext="completed"
        />
      </div>

      {/* Invoice table */}
      <div className="rounded-md border border-border bg-surface">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Invoice #</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Total Amount</th>
                <th className="px-5 py-3 text-left">Your Commission</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((inv) => {
                const client = inv.clients as { business_name: string } | null
                return (
                  <tr key={inv.id} className="hover:bg-surface/80">
                    <td className="px-5 py-3 font-mono text-xs text-foreground">
                      {inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {client?.business_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      ${Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-foreground">
                      ${Number(inv[commissionField] ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status as "sent" | "paid" | "overdue" | "draft"} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
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
