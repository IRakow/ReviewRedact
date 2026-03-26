"use client"

import { useState, useCallback, useTransition } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  GripVertical,
  Save,
  Trash2,
  FolderOpen,
  Plus,
  X,
} from "lucide-react"
import {
  saveReport,
  deleteReport,
  type SavedReport,
  type SavedReportConfig,
} from "./actions"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportData {
  invoices: Array<{
    id: string
    status: string
    total_amount: number
    bts_base_amount: number
    reseller_amount: number
    salesperson_amount: number
    reseller_id: string | null
    salesperson_id: string | null
    client_id: string
    created_at: string
    paid_at: string | null
  }>
  clients: Array<{ id: string; business_name: string; reseller_id: string; salesperson_id: string | null; status: string }>
  reviews: Array<{ id: string; client_id: string; status: string; removal_date: string | null; created_at: string }>
  resellers: Array<{ id: string; name: string; company: string | null }>
  salespeople: Array<{ id: string; name: string; reseller_id: string | null }>
}

interface CellConfig {
  metric: string | null
  groupBy: string | null
}

const METRICS = [
  { key: "revenue", label: "Revenue", icon: "$" },
  { key: "bts_cut", label: "BTS Cut", icon: "$" },
  { key: "reseller_commission", label: "Reseller Commission", icon: "$" },
  { key: "sp_commission", label: "SP Commission", icon: "$" },
  { key: "client_count", label: "Client Count", icon: "#" },
  { key: "review_count", label: "Review Count", icon: "#" },
  { key: "removal_count", label: "Removal Count", icon: "#" },
  { key: "avg_deal_size", label: "Avg Deal Size", icon: "$" },
  { key: "success_rate", label: "Success Rate", icon: "%" },
  { key: "days_to_payment", label: "Days to Payment", icon: "#" },
]

const GROUP_BY = [
  { key: "reseller", label: "Reseller" },
  { key: "salesperson", label: "Salesperson" },
  { key: "client", label: "Client" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
]

const PALETTE = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#3b82f6", "#14b8a6", "#f97316", "#a855f7",
]

// ─── Data computation ───────────────────────────────────────────────────────

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr)
  const onejan = new Date(d.getFullYear(), 0, 1)
  const wk = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(wk).padStart(2, "0")}`
}

function computeMetric(metric: string, data: ReportData): number {
  const paid = data.invoices.filter((i) => i.status === "paid")
  switch (metric) {
    case "revenue":
      return paid.reduce((s, i) => s + Number(i.total_amount), 0)
    case "bts_cut":
      return paid.reduce((s, i) => s + Number(i.bts_base_amount), 0)
    case "reseller_commission":
      return paid.reduce((s, i) => s + Number(i.reseller_amount), 0)
    case "sp_commission":
      return paid.reduce((s, i) => s + Number(i.salesperson_amount), 0)
    case "client_count":
      return data.clients.length
    case "review_count":
      return data.reviews.length
    case "removal_count":
      return data.reviews.filter((r) => ["removed", "waiting_for_payment", "paid"].includes(r.status)).length
    case "avg_deal_size":
      return paid.length > 0
        ? Math.round(paid.reduce((s, i) => s + Number(i.total_amount), 0) / paid.length)
        : 0
    case "success_rate": {
      const relevant = data.reviews.filter((r) =>
        ["in_progress", "removed", "waiting_for_payment", "paid", "failed"].includes(r.status)
      )
      const success = data.reviews.filter((r) =>
        ["removed", "waiting_for_payment", "paid"].includes(r.status)
      )
      return relevant.length > 0 ? Math.round((success.length / relevant.length) * 100) : 0
    }
    case "days_to_payment": {
      const paidWithDates = paid.filter((i) => i.paid_at)
      if (paidWithDates.length === 0) return 0
      const totalDays = paidWithDates.reduce((s, i) => {
        const created = new Date(i.created_at).getTime()
        const paidAt = new Date(i.paid_at!).getTime()
        return s + Math.max(0, (paidAt - created) / 86400000)
      }, 0)
      return Math.round(totalDays / paidWithDates.length)
    }
    default:
      return 0
  }
}

function computeGrouped(
  metric: string,
  groupBy: string,
  data: ReportData
): Array<{ name: string; value: number }> {
  const paid = data.invoices.filter((i) => i.status === "paid")

  function getMetricValue(
    filteredInvoices: typeof paid,
    filteredReviews?: typeof data.reviews,
    filteredClients?: typeof data.clients
  ): number {
    switch (metric) {
      case "revenue":
        return filteredInvoices.reduce((s, i) => s + Number(i.total_amount), 0)
      case "bts_cut":
        return filteredInvoices.reduce((s, i) => s + Number(i.bts_base_amount), 0)
      case "reseller_commission":
        return filteredInvoices.reduce((s, i) => s + Number(i.reseller_amount), 0)
      case "sp_commission":
        return filteredInvoices.reduce((s, i) => s + Number(i.salesperson_amount), 0)
      case "client_count":
        return filteredClients?.length ?? 0
      case "review_count":
        return filteredReviews?.length ?? 0
      case "removal_count":
        return (filteredReviews ?? []).filter((r) =>
          ["removed", "waiting_for_payment", "paid"].includes(r.status)
        ).length
      case "avg_deal_size":
        return filteredInvoices.length > 0
          ? Math.round(
              filteredInvoices.reduce((s, i) => s + Number(i.total_amount), 0) /
                filteredInvoices.length
            )
          : 0
      case "success_rate": {
        const relevant = (filteredReviews ?? []).filter((r) =>
          ["in_progress", "removed", "waiting_for_payment", "paid", "failed"].includes(r.status)
        )
        const success = (filteredReviews ?? []).filter((r) =>
          ["removed", "waiting_for_payment", "paid"].includes(r.status)
        )
        return relevant.length > 0 ? Math.round((success.length / relevant.length) * 100) : 0
      }
      default:
        return 0
    }
  }

  if (groupBy === "reseller") {
    return data.resellers.map((r) => ({
      name: r.company ?? r.name,
      value: getMetricValue(
        paid.filter((i) => i.reseller_id === r.id),
        data.reviews.filter((rv) => {
          const clientIds = data.clients.filter((c) => c.reseller_id === r.id).map((c) => c.id)
          return clientIds.includes(rv.client_id)
        }),
        data.clients.filter((c) => c.reseller_id === r.id)
      ),
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  }

  if (groupBy === "salesperson") {
    return data.salespeople.map((sp) => ({
      name: sp.name,
      value: getMetricValue(
        paid.filter((i) => i.salesperson_id === sp.id),
        data.reviews.filter((rv) => {
          const clientIds = data.clients.filter((c) => c.salesperson_id === sp.id).map((c) => c.id)
          return clientIds.includes(rv.client_id)
        }),
        data.clients.filter((c) => c.salesperson_id === sp.id)
      ),
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  }

  if (groupBy === "client") {
    return data.clients.map((c) => ({
      name: c.business_name,
      value: getMetricValue(
        paid.filter((i) => i.client_id === c.id),
        data.reviews.filter((rv) => rv.client_id === c.id),
        [c]
      ),
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 15)
  }

  if (groupBy === "month") {
    const buckets: Record<string, typeof paid> = {}
    for (const inv of paid) {
      const key = monthKey(inv.paid_at ?? inv.created_at)
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(inv)
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, invs]) => {
        const [y, m] = key.split("-")
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return { name: `${months[Number(m) - 1]} ${y}`, value: getMetricValue(invs) }
      })
  }

  if (groupBy === "week") {
    const buckets: Record<string, typeof paid> = {}
    for (const inv of paid) {
      const key = weekKey(inv.paid_at ?? inv.created_at)
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(inv)
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, invs]) => ({ name: key, value: getMetricValue(invs) }))
  }

  return []
}

// ─── Chart rendering ────────────────────────────────────────────────────────

function MetricNumberCard({ value, metricKey }: { value: number; metricKey: string }) {
  const m = METRICS.find((m) => m.key === metricKey)
  const formatted =
    m?.icon === "$"
      ? `$${value.toLocaleString()}`
      : m?.icon === "%"
        ? `${value}%`
        : value.toLocaleString()

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <p className="font-mono text-4xl font-bold text-foreground">{formatted}</p>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        {m?.label ?? metricKey}
      </p>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-[#1a1a2e] px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold text-foreground">
        {Number(payload[0].value).toLocaleString()}
      </p>
    </div>
  )
}

function GroupedChart({
  chartData,
  isTimeSeries,
}: {
  chartData: Array<{ name: string; value: number }>
  isTimeSeries: boolean
}) {
  if (isTimeSeries) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3, fill: "#6366f1" }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: "#ccc" }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ReportBuilder({
  initialData,
  initialSavedReports,
}: {
  initialData: ReportData
  initialSavedReports: SavedReport[]
}) {
  const [cells, setCells] = useState<CellConfig[]>([
    { metric: null, groupBy: null },
    { metric: null, groupBy: null },
    { metric: null, groupBy: null },
    { metric: null, groupBy: null },
  ])
  const [savedReports, setSavedReports] = useState(initialSavedReports)
  const [saveName, setSaveName] = useState("")
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dragItem, setDragItem] = useState<{ type: "metric" | "groupBy"; key: string } | null>(null)

  // ── Drag handlers ──
  const handleDragStart = (type: "metric" | "groupBy", key: string) => {
    setDragItem({ type, key })
  }

  const handleDrop = (cellIndex: number) => {
    if (!dragItem) return
    setCells((prev) => {
      const next = [...prev]
      if (dragItem.type === "metric") {
        next[cellIndex] = { ...next[cellIndex], metric: dragItem.key }
      } else {
        next[cellIndex] = { ...next[cellIndex], groupBy: dragItem.key }
      }
      return next
    })
    setDragItem(null)
  }

  const clearCell = (index: number) => {
    setCells((prev) => {
      const next = [...prev]
      next[index] = { metric: null, groupBy: null }
      return next
    })
  }

  // ── Save / Load / Delete ──
  const handleSave = () => {
    if (!saveName.trim()) return
    startTransition(async () => {
      const result = await saveReport(saveName.trim(), { cells })
      if (!("error" in result) && result.data) {
        setSavedReports((prev) => [result.data as SavedReport, ...prev])
        setSaveName("")
        setShowSaveInput(false)
      }
    })
  }

  const handleLoad = (report: SavedReport) => {
    const config = report.config as SavedReportConfig
    if (config?.cells) {
      setCells(config.cells.map((c) => ({
        metric: c.metric ?? null,
        groupBy: c.groupBy ?? null,
      })))
    }
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteReport(id)
      setSavedReports((prev) => prev.filter((r) => r.id !== id))
    })
  }

  // ── Render cell content ──
  const renderCellContent = (cell: CellConfig) => {
    if (!cell.metric) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <Plus className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-xs">Drop a metric here</p>
        </div>
      )
    }

    if (!cell.groupBy) {
      const value = computeMetric(cell.metric, initialData)
      return <MetricNumberCard value={value} metricKey={cell.metric} />
    }

    const chartData = computeGrouped(cell.metric, cell.groupBy, initialData)
    const isTimeSeries = cell.groupBy === "month" || cell.groupBy === "week"

    if (chartData.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data
        </div>
      )
    }

    return <GroupedChart chartData={chartData} isTimeSeries={isTimeSeries} />
  }

  return (
    <div className="grid grid-cols-[240px_1fr_240px] gap-6">
      {/* LEFT: Available Metrics */}
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metrics
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {METRICS.map((m) => (
              <div
                key={m.key}
                draggable
                onDragStart={() => handleDragStart("metric", m.key)}
                className="flex cursor-grab items-center gap-2 rounded px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-steel/10 active:cursor-grabbing"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-raised text-[10px] font-bold text-muted-foreground">
                  {m.icon}
                </span>
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Group By
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {GROUP_BY.map((g) => (
              <div
                key={g.key}
                draggable
                onDragStart={() => handleDragStart("groupBy", g.key)}
                className="flex cursor-grab items-center gap-2 rounded px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-steel/10 active:cursor-grabbing"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                {g.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: Drop Zone Grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        {cells.map((cell, i) => {
          const metricObj = METRICS.find((m) => m.key === cell.metric)
          const groupObj = GROUP_BY.find((g) => g.key === cell.groupBy)

          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="noise-overlay relative flex min-h-[240px] flex-col overflow-hidden rounded-md border border-border bg-surface transition-all hover:border-steel/20"
            >
              {/* Corner accent */}
              <div className="absolute top-0 left-0 h-px w-12 bg-gradient-to-r from-steel/30 to-transparent" />
              <div className="absolute top-0 left-0 h-12 w-px bg-gradient-to-b from-steel/30 to-transparent" />

              {/* Header */}
              {cell.metric && (
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {metricObj?.label}
                    </span>
                    {groupObj && (
                      <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[10px] text-steel">
                        by {groupObj.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => clearCell(i)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-3">{renderCellContent(cell)}</div>
            </div>
          )
        })}
      </div>

      {/* RIGHT: Saved Reports */}
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saved Reports
            </h3>
            <button
              onClick={() => setShowSaveInput(true)}
              className="text-steel hover:text-steel-light transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
          </div>

          {showSaveInput && (
            <div className="border-b border-border p-3">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Report name..."
                className="mb-2 w-full rounded border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-steel/40 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending || !saveName.trim()}
                  className="flex-1 rounded bg-steel/20 px-2 py-1 text-xs font-medium text-steel transition-colors hover:bg-steel/30 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setShowSaveInput(false); setSaveName("") }}
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto">
            {savedReports.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No saved reports
              </div>
            ) : (
              <div className="divide-y divide-border">
                {savedReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface/80 transition-colors"
                  >
                    <button
                      onClick={() => handleLoad(r)}
                      className="flex-1 text-left"
                    >
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="ml-2 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
