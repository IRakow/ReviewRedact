"use client"

import { useState } from "react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Wallet,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface InvoiceRow {
  id: string
  total_amount: number
  reseller_amount: number
  salesperson_amount: number
  status: string
  created_at: string
  client_name: string
  salesperson_name?: string | null
}

interface PayoutRow {
  id: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string
}

interface Props {
  role: "reseller" | "salesperson"
  directInvoices: InvoiceRow[]
  teamInvoices: InvoiceRow[]
  payouts: PayoutRow[]
}

// ─── Formatting ─────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── Tab Configuration ──────────────────────────────────────────────────────

const RESELLER_TABS = [
  { id: "direct", label: "Direct Sales" },
  { id: "team", label: "Team Sales" },
  { id: "commissions", label: "Commissions" },
] as const

const SP_TABS = [
  { id: "sales", label: "My Sales" },
  { id: "commissions", label: "Commissions" },
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function FinancialDashboard({ role, directInvoices, teamInvoices, payouts }: Props) {
  const isReseller = role === "reseller"
  const tabs = isReseller ? RESELLER_TABS : SP_TABS
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id)

  // ── Compute stats ──────────────────────────────────────────────────────

  const commissionField = isReseller ? "reseller_amount" : "salesperson_amount"
  const allInvoices = isReseller ? [...directInvoices, ...teamInvoices] : directInvoices

  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total_amount), 0)

  const commissionEarned = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i[commissionField] ?? 0), 0)

  const pendingCount = allInvoices.filter(
    (i) => i.status === "sent" || i.status === "pending"
  ).length

  const teamRevenue = teamInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total_amount), 0)

  // Payout stats
  const totalPayoutEarned = payouts.reduce((s, p) => s + Number(p.amount), 0)
  const paidOut = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0)
  const awaitingPayment = payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0)

  // ── Group team invoices by salesperson ─────────────────────────────────

  const teamBySalesperson = teamInvoices.reduce<
    Record<string, { name: string; invoices: InvoiceRow[] }>
  >((acc, inv) => {
    const spName = inv.salesperson_name ?? "Unknown"
    if (!acc[spName]) acc[spName] = { name: spName, invoices: [] }
    acc[spName].invoices.push(inv)
    return acc
  }, {})

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className={cn("grid gap-4", isReseller ? "grid-cols-4" : "grid-cols-3")}>
        <StatsCard
          label="Total Revenue"
          value={fmtMoney(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="Your Commission"
          value={fmtMoney(commissionEarned)}
          icon={<Wallet className="h-5 w-5" />}
          subtext="earned to date"
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          subtext="awaiting payment"
        />
        {isReseller && (
          <StatsCard
            label="Team Revenue"
            value={fmtMoney(teamRevenue)}
            icon={<Users className="h-5 w-5" />}
            subtext="from your salespeople"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "border-steel text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isReseller && activeTab === "direct" && (
        <InvoiceTable
          invoices={directInvoices}
          commissionField="reseller_amount"
          emptyMessage="No direct sales yet"
        />
      )}

      {isReseller && activeTab === "team" && (
        <TeamSalesView groups={teamBySalesperson} />
      )}

      {!isReseller && activeTab === "sales" && (
        <InvoiceTable
          invoices={directInvoices}
          commissionField="salesperson_amount"
          emptyMessage="No sales yet"
        />
      )}

      {activeTab === "commissions" && (
        <CommissionStatusView
          payouts={payouts}
          totalEarned={totalPayoutEarned}
          paidOut={paidOut}
          awaiting={awaitingPayment}
        />
      )}
    </div>
  )
}

// ─── Invoice Table ──────────────────────────────────────────────────────────

function InvoiceTable({
  invoices,
  commissionField,
  emptyMessage,
}: {
  invoices: InvoiceRow[]
  commissionField: "reseller_amount" | "salesperson_amount"
  emptyMessage: string
}) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface">
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3 text-left">Invoice #</th>
            <th className="px-5 py-3 text-left">Client</th>
            <th className="px-5 py-3 text-left">Total</th>
            <th className="px-5 py-3 text-left">Your Commission</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-surface/80 transition-colors">
              <td className="px-5 py-3 font-mono text-xs text-foreground">
                {inv.id.slice(0, 8).toUpperCase()}
              </td>
              <td className="px-5 py-3 text-foreground">
                {inv.client_name}
              </td>
              <td className="px-5 py-3 font-mono text-foreground">
                {fmtMoney(Number(inv.total_amount))}
              </td>
              <td className="px-5 py-3 font-mono font-medium text-foreground">
                {fmtMoney(Number(inv[commissionField] ?? 0))}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={inv.status as "sent" | "paid" | "overdue" | "draft"} />
              </td>
              <td className="px-5 py-3 text-muted-foreground">
                {new Date(inv.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Team Sales View (Reseller Only) ────────────────────────────────────────

function TeamSalesView({
  groups,
}: {
  groups: Record<string, { name: string; invoices: InvoiceRow[] }>
}) {
  const entries = Object.values(groups)

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface">
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No salesperson sales yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((group) => {
        const subtotalTotal = group.invoices.reduce(
          (s, i) => s + Number(i.total_amount),
          0
        )
        const subtotalSpCommission = group.invoices.reduce(
          (s, i) => s + Number(i.salesperson_amount ?? 0),
          0
        )
        const subtotalYourCut = group.invoices.reduce(
          (s, i) => s + Number(i.reseller_amount ?? 0),
          0
        )

        return (
          <div
            key={group.name}
            className="rounded-md border border-border bg-surface overflow-hidden"
          >
            {/* Salesperson header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-raised px-5 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-steel" />
                <span className="text-sm font-medium text-foreground">
                  {group.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {group.invoices.length} invoice{group.invoices.length !== 1 ? "s" : ""}
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">Invoice #</th>
                  <th className="px-5 py-3 text-left">Client</th>
                  <th className="px-5 py-3 text-left">Total</th>
                  <th className="px-5 py-3 text-left">SP Commission</th>
                  <th className="px-5 py-3 text-left">Your Cut</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface/80 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-foreground">
                      {inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {inv.client_name}
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      {fmtMoney(Number(inv.total_amount))}
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground">
                      {fmtMoney(Number(inv.salesperson_amount ?? 0))}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-foreground">
                      {fmtMoney(Number(inv.reseller_amount ?? 0))}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status as "sent" | "paid" | "overdue" | "draft"} />
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Subtotals */}
              <tfoot>
                <tr className="border-t border-border bg-surface-raised">
                  <td className="px-5 py-3" colSpan={2}>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Subtotal
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono font-medium text-foreground">
                    {fmtMoney(subtotalTotal)}
                  </td>
                  <td className="px-5 py-3 font-mono text-foreground">
                    {fmtMoney(subtotalSpCommission)}
                  </td>
                  <td className="px-5 py-3 font-mono font-medium text-foreground">
                    {fmtMoney(subtotalYourCut)}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )
      })}
    </div>
  )
}

// ─── Commission Status View ─────────────────────────────────────────────────

function CommissionStatusView({
  payouts,
  totalEarned,
  paidOut,
  awaiting,
}: {
  payouts: PayoutRow[]
  totalEarned: number
  paidOut: number
  awaiting: number
}) {
  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Total Earned
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-foreground">
            {fmtMoney(totalEarned)}
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Paid Out
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-emerald-400">
            {fmtMoney(paidOut)}
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Awaiting Payment
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-amber">
            {fmtMoney(awaiting)}
          </p>
        </div>
      </div>

      {/* Payout records */}
      <div className="rounded-md border border-border bg-surface overflow-hidden">
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <CheckCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No commission payouts yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Payout #</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Paid Date</th>
                <th className="px-5 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-surface/80 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">
                    {p.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3 font-mono font-medium text-foreground">
                    {fmtMoney(Number(p.amount))}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status as "paid" | "pending"} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "---"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
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
