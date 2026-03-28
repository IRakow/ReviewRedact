"use client"

import { useState, useTransition, useCallback } from "react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Check,
  CheckCheck,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import {
  markFilingFeePaid,
  bulkMarkFilingFeesPaid,
  markPayoutPaid,
  updateFilingFeeRate,
  getFinancialOverview,
  getMoneyFlow,
  getFilingFees,
  getCommissions,
  getReconciliation,
  getFilingFeeRate,
  getFilingFeeHistory,
} from "./actions"
import type {
  MoneyFlowRow,
  FilingFeeRow,
  CommissionRow,
  ReconciliationRow,
} from "./actions"

// ─── Types ──────────────────────────────────────────────────────────────────

interface FinancialOverview {
  revenue: number
  filingFeesOwed: number
  filingFeesPaid: number
  commissionsOwed: number
  commissionsPaid: number
  netProfit: number
  pendingCostCount: number
}

interface Props {
  initialOverview: FinancialOverview
  initialMoneyFlow: { rows: MoneyFlowRow[]; total: number }
  initialFilingFees: FilingFeeRow[]
  initialResellerCommissions: CommissionRow[]
  initialSpCommissions: CommissionRow[]
  initialReconciliation: ReconciliationRow[]
  initialFilingRate: number
  initialFeeHistory: Array<{ updatedBy: string; updatedAt: string; amount: number }>
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "filing-fees", label: "Filing Fees" },
  { id: "commissions", label: "Commissions" },
  { id: "reconciliation", label: "Reconciliation" },
  { id: "settings", label: "Settings" },
] as const

type TabId = (typeof TABS)[number]["id"]

// ─── Formatting ─────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(d: string | null) {
  if (!d) return "--"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function truncId(id: string) {
  return id.slice(0, 8)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AccountingDashboard({
  initialOverview,
  initialMoneyFlow,
  initialFilingFees,
  initialResellerCommissions,
  initialSpCommissions,
  initialReconciliation,
  initialFilingRate,
  initialFeeHistory,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview")
  const [isPending, startTransition] = useTransition()

  // State
  const [overview, setOverview] = useState(initialOverview)
  const [moneyFlow, setMoneyFlow] = useState(initialMoneyFlow)
  const [flowPage, setFlowPage] = useState(1)
  const [filingFees, setFilingFees] = useState(initialFilingFees)
  const [feeFilter, setFeeFilter] = useState<"all" | "pending" | "paid">("all")
  const [resellerComm, setResellerComm] = useState(initialResellerCommissions)
  const [spComm, setSpComm] = useState(initialSpCommissions)
  const [commTab, setCommTab] = useState<"reseller" | "salesperson">("reseller")
  const [reconciliation, setReconciliation] = useState(initialReconciliation)
  const [filingRate, setFilingRate] = useState(initialFilingRate)
  const [newRate, setNewRate] = useState(String(initialFilingRate))
  const [feeHistory, setFeeHistory] = useState(initialFeeHistory)
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set())

  // ─── Refresh helpers ────────────────────────────────────────────────────

  const refreshAll = useCallback(() => {
    startTransition(async () => {
      const [ov, mf, ff, rc, sc, recon, rate, hist] = await Promise.all([
        getFinancialOverview(),
        getMoneyFlow(flowPage),
        getFilingFees(feeFilter),
        getCommissions("reseller"),
        getCommissions("salesperson"),
        getReconciliation(),
        getFilingFeeRate(),
        getFilingFeeHistory(),
      ])
      setOverview(ov)
      setMoneyFlow(mf)
      setFilingFees(ff)
      setResellerComm(rc)
      setSpComm(sc)
      setReconciliation(recon)
      setFilingRate(rate)
      setNewRate(String(rate))
      setFeeHistory(hist)
    })
  }, [flowPage, feeFilter])

  // ─── Filing Fee Actions ─────────────────────────────────────────────────

  function handleMarkFeePaid(costId: string) {
    startTransition(async () => {
      await markFilingFeePaid(costId)
      const ff = await getFilingFees(feeFilter)
      setFilingFees(ff)
      const ov = await getFinancialOverview()
      setOverview(ov)
      setSelectedFees((prev) => {
        const next = new Set(prev)
        next.delete(costId)
        return next
      })
    })
  }

  function handleBulkMarkPaid() {
    if (selectedFees.size === 0) return
    startTransition(async () => {
      await bulkMarkFilingFeesPaid([...selectedFees])
      const ff = await getFilingFees(feeFilter)
      setFilingFees(ff)
      const ov = await getFinancialOverview()
      setOverview(ov)
      setSelectedFees(new Set())
    })
  }

  function handleFeeFilterChange(f: "all" | "pending" | "paid") {
    setFeeFilter(f)
    setSelectedFees(new Set())
    startTransition(async () => {
      const ff = await getFilingFees(f)
      setFilingFees(ff)
    })
  }

  function toggleFeeSelection(id: string) {
    setSelectedFees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllFees() {
    const pendingFees = filingFees.filter((f) => f.status === "pending")
    if (selectedFees.size === pendingFees.length) {
      setSelectedFees(new Set())
    } else {
      setSelectedFees(new Set(pendingFees.map((f) => f.id)))
    }
  }

  // ─── Payout Actions ────────────────────────────────────────────────────

  function handleMarkPayoutPaid(payoutId: string) {
    startTransition(async () => {
      await markPayoutPaid(payoutId)
      const [rc, sc, ov] = await Promise.all([
        getCommissions("reseller"),
        getCommissions("salesperson"),
        getFinancialOverview(),
      ])
      setResellerComm(rc)
      setSpComm(sc)
      setOverview(ov)
    })
  }

  // ─── Filing Fee Rate ──────────────────────────────────────────────────

  function handleUpdateRate() {
    const rate = Number(newRate)
    if (isNaN(rate) || rate < 0) return
    startTransition(async () => {
      await updateFilingFeeRate(rate)
      setFilingRate(rate)
      const hist = await getFilingFeeHistory()
      setFeeHistory(hist)
    })
  }

  // ─── Money Flow Pagination ────────────────────────────────────────────

  function handleFlowPageChange(p: number) {
    setFlowPage(p)
    startTransition(async () => {
      const mf = await getMoneyFlow(p)
      setMoneyFlow(mf)
    })
  }

  const totalFlowPages = Math.ceil(moneyFlow.total / 25) || 1

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Financial Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete money trail -- every dollar in and out
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground",
            isPending && "opacity-50"
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-steel text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <OverviewTab
          overview={overview}
          moneyFlow={moneyFlow}
          flowPage={flowPage}
          totalPages={totalFlowPages}
          onPageChange={handleFlowPageChange}
          isPending={isPending}
        />
      )}

      {tab === "filing-fees" && (
        <FilingFeesTab
          fees={filingFees}
          filter={feeFilter}
          onFilterChange={handleFeeFilterChange}
          selectedFees={selectedFees}
          onToggleFee={toggleFeeSelection}
          onToggleAll={toggleAllFees}
          onMarkPaid={handleMarkFeePaid}
          onBulkMarkPaid={handleBulkMarkPaid}
          isPending={isPending}
        />
      )}

      {tab === "commissions" && (
        <CommissionsTab
          commTab={commTab}
          onCommTabChange={setCommTab}
          resellerComm={resellerComm}
          spComm={spComm}
          onMarkPaid={handleMarkPayoutPaid}
          isPending={isPending}
        />
      )}

      {tab === "reconciliation" && (
        <ReconciliationTab rows={reconciliation} />
      )}

      {tab === "settings" && (
        <SettingsTab
          currentRate={filingRate}
          newRate={newRate}
          onRateChange={setNewRate}
          onUpdateRate={handleUpdateRate}
          history={feeHistory}
          isPending={isPending}
        />
      )}
    </div>
  )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({
  overview,
  moneyFlow,
  flowPage,
  totalPages,
  onPageChange,
  isPending,
}: {
  overview: FinancialOverview
  moneyFlow: { rows: MoneyFlowRow[]; total: number }
  flowPage: number
  totalPages: number
  onPageChange: (p: number) => void
  isPending: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Revenue"
          value={fmtMoney(overview.revenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="from paid invoices"
        />
        <StatsCard
          label="Filing Fees Owed"
          value={fmtMoney(overview.filingFeesOwed)}
          icon={<FileText className="h-5 w-5" />}
          subtext={`${overview.pendingCostCount} pending`}
        />
        <StatsCard
          label="Commissions Owed"
          value={fmtMoney(overview.commissionsOwed)}
          icon={<Users className="h-5 w-5" />}
          subtext="reseller + salesperson"
        />
        <StatsCard
          label="Net Profit"
          value={fmtMoney(overview.netProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtext="revenue - fees - commissions"
        />
      </div>

      {/* Money Flow Table */}
      <div className="rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Money Flow Breakdown</h2>
          <p className="text-xs text-muted-foreground">{moneyFlow.total} paid invoices</p>
        </div>

        {moneyFlow.rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No paid invoices yet
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Paid</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Filing Fee</th>
                    <th className="px-4 py-3 text-right">Reseller</th>
                    <th className="px-4 py-3 text-right">SP</th>
                    <th className="px-4 py-3 text-right">BTS Net</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {moneyFlow.rows.map((row) => (
                    <tr
                      key={row.invoiceId}
                      className="hover:bg-surface-raised/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {truncId(row.invoiceId)}
                      </td>
                      <td className="px-4 py-3 text-foreground text-xs">
                        {row.clientName}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {fmtDate(row.paidAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground uppercase">
                        {row.paymentMethod ?? "--"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400 text-right">
                        {fmtMoney(row.revenue)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-red-400 text-right">
                        -{fmtMoney(row.filingFee)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-amber text-right">
                        -{fmtMoney(row.resellerCut)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-amber text-right">
                        -{fmtMoney(row.spCut)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-foreground text-right">
                        {fmtMoney(row.btsNet)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex h-2 w-2 rounded-full",
                            row.allPaid
                              ? "bg-emerald-400"
                              : "bg-amber"
                          )}
                          title={row.allPaid ? "All parties paid" : "Some payments pending"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals Row */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface-raised/30">
                    <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-foreground">
                      Page Totals
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-400 text-right">
                      {fmtMoney(moneyFlow.rows.reduce((s, r) => s + r.revenue, 0))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-red-400 text-right">
                      -{fmtMoney(moneyFlow.rows.reduce((s, r) => s + r.filingFee, 0))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-amber text-right">
                      -{fmtMoney(moneyFlow.rows.reduce((s, r) => s + r.resellerCut, 0))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-amber text-right">
                      -{fmtMoney(moneyFlow.rows.reduce((s, r) => s + r.spCut, 0))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground text-right">
                      {fmtMoney(moneyFlow.rows.reduce((s, r) => s + r.btsNet, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {flowPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange(flowPage - 1)}
                    disabled={flowPage <= 1 || isPending}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onPageChange(flowPage + 1)}
                    disabled={flowPage >= totalPages || isPending}
                    className="rounded border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Filing Fees Tab ────────────────────────────────────────────────────────

function FilingFeesTab({
  fees,
  filter,
  onFilterChange,
  selectedFees,
  onToggleFee,
  onToggleAll,
  onMarkPaid,
  onBulkMarkPaid,
  isPending,
}: {
  fees: FilingFeeRow[]
  filter: "all" | "pending" | "paid"
  onFilterChange: (f: "all" | "pending" | "paid") => void
  selectedFees: Set<string>
  onToggleFee: (id: string) => void
  onToggleAll: () => void
  onMarkPaid: (id: string) => void
  onBulkMarkPaid: () => void
  isPending: boolean
}) {
  const pendingTotal = fees
    .filter((f) => f.status === "pending")
    .reduce((s, f) => s + f.amount, 0)
  const paidTotal = fees
    .filter((f) => f.status === "paid")
    .reduce((s, f) => s + f.amount, 0)

  // Group by provider
  const providers = [...new Set(fees.map((f) => f.providerName))]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Total Filing Fees"
          value={fmtMoney(pendingTotal + paidTotal)}
          subtext={`${fees.length} removals`}
        />
        <StatsCard
          label="Pending"
          value={fmtMoney(pendingTotal)}
          subtext={`${fees.filter((f) => f.status === "pending").length} unpaid`}
        />
        <StatsCard
          label="Paid"
          value={fmtMoney(paidTotal)}
          subtext={`${fees.filter((f) => f.status === "paid").length} settled`}
        />
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "pending", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-steel/15 text-steel-light border border-steel/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {selectedFees.size > 0 && (
          <button
            onClick={onBulkMarkPaid}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark {selectedFees.size} as Paid
          </button>
        )}
      </div>

      {/* Table grouped by provider */}
      {providers.map((provider) => {
        const providerFees = fees.filter((f) => f.providerName === provider)
        return (
          <div
            key={provider}
            className="rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {provider}
              </h3>
              <p className="text-xs text-muted-foreground">
                {providerFees.length} removals --{" "}
                {fmtMoney(providerFees.reduce((s, f) => s + f.amount, 0))} total
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={
                        providerFees.filter((f) => f.status === "pending").length > 0 &&
                        providerFees
                          .filter((f) => f.status === "pending")
                          .every((f) => selectedFees.has(f.id))
                      }
                      onChange={onToggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Reviewer</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-left">Paid Date</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providerFees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      {fee.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={selectedFees.has(fee.id)}
                          onChange={() => onToggleFee(fee.id)}
                          className="rounded border-border"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-foreground">
                      {fee.reviewerName}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fee.clientName}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-red-400 text-right">
                      {fmtMoney(fee.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge
                        status={fee.status === "paid" ? "paid" : "pending"}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(fee.paidAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {fee.status === "pending" && (
                        <button
                          onClick={() => onMarkPaid(fee.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {fees.length === 0 && (
        <div className="rounded-md border border-border bg-surface py-12 text-center text-sm text-muted-foreground">
          No filing fee records found
        </div>
      )}
    </div>
  )
}

// ─── Commissions Tab ────────────────────────────────────────────────────────

function CommissionsTab({
  commTab,
  onCommTabChange,
  resellerComm,
  spComm,
  onMarkPaid,
  isPending,
}: {
  commTab: "reseller" | "salesperson"
  onCommTabChange: (t: "reseller" | "salesperson") => void
  resellerComm: CommissionRow[]
  spComm: CommissionRow[]
  onMarkPaid: (id: string) => void
  isPending: boolean
}) {
  const data = commTab === "reseller" ? resellerComm : spComm

  // Group by recipient
  const grouped = data.reduce(
    (acc, row) => {
      if (!acc[row.recipientName]) acc[row.recipientName] = []
      acc[row.recipientName].push(row)
      return acc
    },
    {} as Record<string, CommissionRow[]>
  )

  const totalPending = data
    .filter((d) => d.status === "pending")
    .reduce((s, d) => s + d.amount, 0)
  const totalPaid = data
    .filter((d) => d.status === "paid")
    .reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {(["reseller", "salesperson"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onCommTabChange(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                commTab === t
                  ? "bg-steel/15 text-steel-light border border-steel/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              {t === "reseller" ? "Reseller Commissions" : "Salesperson Commissions"}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Pending: <span className="font-mono text-amber">{fmtMoney(totalPending)}</span>
          {" | "}
          Paid: <span className="font-mono text-emerald-400">{fmtMoney(totalPaid)}</span>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-12 text-center text-sm text-muted-foreground">
          No {commTab} commission records found
        </div>
      ) : (
        Object.entries(grouped).map(([name, rows]) => {
          const subtotal = rows.reduce((s, r) => s + r.amount, 0)
          const pendingCount = rows.filter((r) => r.status === "pending").length
          return (
            <div
              key={name}
              className="rounded-md border border-border bg-surface"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {rows.length} payouts -- {fmtMoney(subtotal)} total
                    {pendingCount > 0 && (
                      <span className="text-amber">
                        {" "}({pendingCount} pending)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left">Invoice</th>
                    <th className="px-4 py-2 text-left">Client</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-left">Paid Date</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-raised/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                        {truncId(row.invoiceId)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {row.clientName}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-amber text-right">
                        {fmtMoney(row.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <StatusBadge
                          status={row.status === "paid" ? "paid" : "pending"}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {fmtDate(row.paidAt)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {row.status === "pending" && (
                          <button
                            onClick={() => onMarkPaid(row.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-surface-raised/30">
                    <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-foreground">
                      Subtotal
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground text-right">
                      {fmtMoney(subtotal)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Reconciliation Tab ─────────────────────────────────────────────────────

function ReconciliationTab({ rows }: { rows: ReconciliationRow[] }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Total Invoices"
          value={rows.length}
          subtext="all invoices"
        />
        <StatsCard
          label="With Payment Links"
          value={rows.filter((r) => r.paymentToken).length}
          subtext="tokens generated"
        />
        <StatsCard
          label="Paid via Link"
          value={rows.filter((r) => r.status === "paid" && r.paymentToken).length}
          subtext="payment links used"
        />
      </div>

      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Payment Reconciliation
          </h2>
        </div>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No invoices to reconcile
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left">Invoice</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Paid</th>
                  <th className="px-4 py-2 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.invoiceId}
                    className="hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                      {truncId(row.invoiceId)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {row.clientName}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground text-right">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge
                        status={
                          row.status === "paid"
                            ? "paid"
                            : row.status === "overdue"
                              ? "overdue"
                              : row.status === "sent"
                                ? "sent"
                                : "draft"
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground uppercase">
                      {row.paymentMethod ?? "--"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(row.paidAt)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.paymentToken ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            row.status === "paid"
                              ? "text-emerald-400"
                              : "text-steel-light"
                          )}
                          title={`${appUrl}/pay/${row.paymentToken}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {row.status === "paid" ? "Used" : "Active"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab({
  currentRate,
  newRate,
  onRateChange,
  onUpdateRate,
  history,
  isPending,
}: {
  currentRate: number
  newRate: string
  onRateChange: (v: string) => void
  onUpdateRate: () => void
  history: Array<{ updatedBy: string; updatedAt: string; amount: number }>
  isPending: boolean
}) {
  const hasChanged = Number(newRate) !== currentRate

  return (
    <div className="space-y-6">
      {/* Filing Fee Rate */}
      <div className="rounded-md border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground">
            <Settings className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Filing Fee Per Removal
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                The cost BTS pays to external removal providers for each review removal.
                This is deducted from revenue in the money flow calculations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => onRateChange(e.target.value)}
                  className="w-40 rounded-md border border-border bg-surface-raised pl-7 pr-3 py-2 font-mono text-sm text-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
                  min={0}
                  max={10000}
                  step={1}
                />
              </div>
              <button
                onClick={onUpdateRate}
                disabled={isPending || !hasChanged}
                className={cn(
                  "rounded-md px-4 py-2 text-xs font-medium transition-colors",
                  hasChanged
                    ? "bg-steel/15 text-steel-light border border-steel/30 hover:bg-steel/25"
                    : "bg-surface-raised text-muted-foreground border border-border opacity-50 cursor-not-allowed"
                )}
              >
                Update Filing Fee
              </button>
              {!hasChanged && (
                <span className="text-xs text-muted-foreground">
                  Current rate: {fmtMoney(currentRate)}/removal
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Rate Change History
          </h3>
        </div>
        {history.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No changes recorded
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Rate set to{" "}
                    <span className="font-mono text-steel-light">
                      {fmtMoney(h.amount)}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    by {h.updatedBy}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(h.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
