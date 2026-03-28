import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { FinancialDashboard } from "./FinancialDashboard"

export default async function DashboardInvoicesPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const isReseller = session.user_type === "reseller"
  const isSalesperson = session.user_type === "salesperson"

  if (!isReseller && !isSalesperson) redirect("/dashboard")

  const supabase = createServerClient()

  // ── Fetch invoices based on role ────────────────────────────────────────

  let directInvoices: Array<{
    id: string
    total_amount: number
    reseller_amount: number
    salesperson_amount: number
    status: string
    created_at: string
    client_name: string
    salesperson_name?: string | null
  }> = []

  let teamInvoices: typeof directInvoices = []

  if (isReseller) {
    // Direct sales: reseller sold directly (no salesperson)
    const { data: direct } = await supabase
      .from("invoices")
      .select("id, total_amount, reseller_amount, salesperson_amount, status, created_at, clients(business_name)")
      .eq("reseller_id", session.user_id)
      .is("salesperson_id", null)
      .order("created_at", { ascending: false })

    directInvoices = (direct ?? []).map((inv) => {
      const client = inv.clients as unknown as { business_name: string } | null
      return {
        id: inv.id,
        total_amount: Number(inv.total_amount),
        reseller_amount: Number(inv.reseller_amount),
        salesperson_amount: Number(inv.salesperson_amount),
        status: inv.status,
        created_at: inv.created_at,
        client_name: client?.business_name ?? "---",
      }
    })

    // Team sales: through salespeople
    const { data: team } = await supabase
      .from("invoices")
      .select("id, total_amount, reseller_amount, salesperson_amount, status, created_at, clients(business_name), salespeople(name)")
      .eq("reseller_id", session.user_id)
      .not("salesperson_id", "is", null)
      .order("created_at", { ascending: false })

    teamInvoices = (team ?? []).map((inv) => {
      const client = inv.clients as unknown as { business_name: string } | null
      const sp = inv.salespeople as unknown as { name: string } | null
      return {
        id: inv.id,
        total_amount: Number(inv.total_amount),
        reseller_amount: Number(inv.reseller_amount),
        salesperson_amount: Number(inv.salesperson_amount),
        status: inv.status,
        created_at: inv.created_at,
        client_name: client?.business_name ?? "---",
        salesperson_name: sp?.name ?? "Unknown",
      }
    })
  } else {
    // Salesperson: their own invoices
    const { data: mine } = await supabase
      .from("invoices")
      .select("id, total_amount, reseller_amount, salesperson_amount, status, created_at, clients(business_name)")
      .eq("salesperson_id", session.user_id)
      .order("created_at", { ascending: false })

    directInvoices = (mine ?? []).map((inv) => {
      const client = inv.clients as unknown as { business_name: string } | null
      return {
        id: inv.id,
        total_amount: Number(inv.total_amount),
        reseller_amount: Number(inv.reseller_amount),
        salesperson_amount: Number(inv.salesperson_amount),
        status: inv.status,
        created_at: inv.created_at,
        client_name: client?.business_name ?? "---",
      }
    })
  }

  // ── Fetch payouts ──────────────────────────────────────────────────────

  const { data: payoutsRaw } = await supabase
    .from("payouts")
    .select("id, amount, status, paid_at, created_at")
    .eq("recipient_type", isReseller ? "reseller" : "salesperson")
    .eq("recipient_id", session.user_id)
    .order("created_at", { ascending: false })

  const payouts = (payoutsRaw ?? []).map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    paid_at: p.paid_at,
    created_at: p.created_at,
  }))

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Financials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isReseller
              ? "Revenue, commissions, and team performance"
              : "Your sales and commission history"}
          </p>
        </div>
      </div>

      <FinancialDashboard
        role={isReseller ? "reseller" : "salesperson"}
        directInvoices={directInvoices}
        teamInvoices={teamInvoices}
        payouts={payouts}
      />
    </div>
  )
}
