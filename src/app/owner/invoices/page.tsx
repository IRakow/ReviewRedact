import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"

export default async function OwnerInvoicesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total_amount, bts_base_amount, reseller_amount, salesperson_amount, status, sent_at, paid_at, created_at")
    .order("created_at", { ascending: false })

  const totalRevenue = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount), 0)
  const totalBts = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.bts_base_amount), 0)
  const totalPending = (invoices ?? []).filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total_amount), 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">All Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue: ${totalRevenue.toLocaleString()} | BTS Retained: ${totalBts.toLocaleString()} | Pending: ${totalPending.toLocaleString()}
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(invoices ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No invoices yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">BTS Base</th>
                <th className="px-5 py-3 text-left">Reseller</th>
                <th className="px-5 py-3 text-left">Salesperson</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(invoices ?? []).map((inv) => (
                <tr key={inv.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-mono font-medium text-foreground">${Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">${Number(inv.bts_base_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">${Number(inv.reseller_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">${Number(inv.salesperson_amount).toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status as "sent" | "paid" | "overdue" | "draft"} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
