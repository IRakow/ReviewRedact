import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"

export default async function OwnerPaymentsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, processor_ref, status, created_at, invoice_id")
    .order("created_at", { ascending: false })

  const totalReceived = (payments ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Payment History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total received: ${totalReceived.toLocaleString()}
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(payments ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No payments yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Method</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(payments ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-mono font-medium text-foreground">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground uppercase text-xs">{p.method}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status === "completed" ? "paid" : p.status === "failed" ? "failed" : "pending"} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.processor_ref ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
