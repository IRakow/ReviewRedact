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
}

export default async function ResellerPerformancePage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch all resellers (role = "reseller")
  const { data: resellers } = await supabase
    .from("resellers")
    .select("id, name, company, email, commission_plan_type")
    .eq("role", "reseller")
    .order("name")

  const resellerList = resellers ?? []

  // Fetch aggregated data for each reseller
  const resellerIds = resellerList.map((r) => r.id)

  // Count salespeople per reseller
  const { data: allSp } = await supabase
    .from("salespeople")
    .select("id, reseller_id")
    .in("reseller_id", resellerIds.length > 0 ? resellerIds : ["__none__"])

  // Count clients per reseller
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, reseller_id")
    .in("reseller_id", resellerIds.length > 0 ? resellerIds : ["__none__"])

  // Sum paid invoices per reseller
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("reseller_id, total_amount, reseller_amount")
    .eq("status", "paid")
    .in("reseller_id", resellerIds.length > 0 ? resellerIds : ["__none__"])

  // Build lookup maps
  const spCountMap: Record<string, number> = {}
  const clientCountMap: Record<string, number> = {}
  const revenueMap: Record<string, number> = {}
  const commissionMap: Record<string, number> = {}

  for (const sp of allSp ?? []) {
    if (sp.reseller_id) {
      spCountMap[sp.reseller_id] = (spCountMap[sp.reseller_id] ?? 0) + 1
    }
  }
  for (const c of allClients ?? []) {
    if (c.reseller_id) {
      clientCountMap[c.reseller_id] = (clientCountMap[c.reseller_id] ?? 0) + 1
    }
  }
  for (const inv of allInvoices ?? []) {
    if (inv.reseller_id) {
      revenueMap[inv.reseller_id] = (revenueMap[inv.reseller_id] ?? 0) + Number(inv.total_amount)
      commissionMap[inv.reseller_id] = (commissionMap[inv.reseller_id] ?? 0) + Number(inv.reseller_amount)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Reseller Performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue and team stats for each reseller</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {resellerList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No resellers found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Company</th>
                <th className="px-5 py-3 text-left">Team Size</th>
                <th className="px-5 py-3 text-left">Clients</th>
                <th className="px-5 py-3 text-left">Revenue Generated</th>
                <th className="px-5 py-3 text-left">Commission Earned</th>
                <th className="px-5 py-3 text-left">Plan Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resellerList.map((r) => (
                <tr key={r.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3">
                    <Link
                      href={`/owner/reports/resellers/${r.id}`}
                      className="font-medium text-steel hover:text-steel-light transition-colors"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.company ?? "—"}</td>
                  <td className="px-5 py-3 text-foreground">{spCountMap[r.id] ?? 0}</td>
                  <td className="px-5 py-3 text-foreground">{clientCountMap[r.id] ?? 0}</td>
                  <td className="px-5 py-3 font-mono text-foreground">
                    ${(revenueMap[r.id] ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-mono text-foreground">
                    ${(commissionMap[r.id] ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {PLAN_LABELS[r.commission_plan_type] ?? r.commission_plan_type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
