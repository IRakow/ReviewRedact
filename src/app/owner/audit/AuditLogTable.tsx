"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, ChevronLeft, Filter } from "lucide-react"

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  action: string
  changed_by_type: string
  changed_by_name: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_fields: string[] | null
  ip_address: string | null
  created_at: string
}

interface Props {
  logs: AuditEntry[]
  totalCount: number
  currentPage: number
  perPage: number
  tables: string[]
  filters: { table: string; action: string; user: string }
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: days > 365 ? "numeric" : undefined,
  })
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    create: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    update: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    delete: "bg-red-500/10 text-red-400 border-red-500/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        styles[action] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {action}
    </span>
  )
}

function DiffValue({ label, oldVal, newVal }: { label: string; oldVal: unknown; newVal: unknown }) {
  const formatVal = (v: unknown): string => {
    if (v === null || v === undefined) return "null"
    if (typeof v === "object") return JSON.stringify(v, null, 2)
    return String(v)
  }

  const oldStr = formatVal(oldVal)
  const newStr = formatVal(newVal)

  // Don't show if both are the same
  if (oldStr === newStr) return null

  return (
    <div className="grid grid-cols-[160px_1fr_1fr] gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-mono text-muted-foreground truncate">{label}</span>
      <div className="text-xs font-mono">
        {oldVal !== undefined && (
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400 break-all">
            {oldStr.length > 200 ? oldStr.slice(0, 200) + "..." : oldStr}
          </span>
        )}
      </div>
      <div className="text-xs font-mono">
        {newVal !== undefined && (
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 break-all">
            {newStr.length > 200 ? newStr.slice(0, 200) + "..." : newStr}
          </span>
        )}
      </div>
    </div>
  )
}

function ExpandedRow({ entry }: { entry: AuditEntry }) {
  // Compute all keys across old + new
  const allKeys = new Set<string>()
  if (entry.changed_fields) {
    entry.changed_fields.forEach((k) => allKeys.add(k))
  } else {
    if (entry.old_values) Object.keys(entry.old_values).forEach((k) => allKeys.add(k))
    if (entry.new_values) Object.keys(entry.new_values).forEach((k) => allKeys.add(k))
  }

  // Filter out noisy fields
  const skipFields = new Set(["updated_at", "created_at", "id"])
  const keys = [...allKeys].filter((k) => !skipFields.has(k))

  if (keys.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-muted-foreground italic">
        No field-level changes recorded
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-1">
      <div className="grid grid-cols-[160px_1fr_1fr] gap-2 pb-1.5 border-b border-border">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Field</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">Old Value</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">New Value</span>
      </div>
      {keys.map((key) => (
        <DiffValue
          key={key}
          label={key}
          oldVal={entry.old_values?.[key]}
          newVal={entry.new_values?.[key]}
        />
      ))}
      {entry.ip_address && (
        <div className="pt-2 text-[10px] text-muted-foreground">
          IP: {entry.ip_address}
        </div>
      )}
    </div>
  )
}

export function AuditLogTable({ logs, totalCount, currentPage, perPage, tables, filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tableFilter, setTableFilter] = useState(filters.table)
  const [actionFilter, setActionFilter] = useState(filters.action)
  const [userFilter, setUserFilter] = useState(filters.user)

  const totalPages = Math.ceil(totalCount / perPage)

  function applyFilters() {
    const params = new URLSearchParams()
    if (tableFilter) params.set("table", tableFilter)
    if (actionFilter) params.set("action", actionFilter)
    if (userFilter) params.set("user", userFilter)
    params.set("page", "1")
    router.push(`/owner/audit?${params.toString()}`)
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/owner/audit?${params.toString()}`)
  }

  function clearFilters() {
    setTableFilter("")
    setActionFilter("")
    setUserFilter("")
    router.push("/owner/audit")
  }

  const hasFilters = filters.table || filters.action || filters.user

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Table
          </label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="block h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="">All tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            User
          </label>
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Search by name..."
            className="block h-8 w-40 rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>

        <button
          onClick={applyFilters}
          className="h-8 rounded-md bg-steel/20 px-3 text-xs font-medium text-steel transition-colors hover:bg-steel/30"
        >
          Apply
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-8 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {totalCount} {totalCount === 1 ? "entry" : "entries"}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 px-3 py-2.5" />
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Who
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Table
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Changed Fields
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Record
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No audit log entries found
                </td>
              </tr>
            )}
            {logs.map((entry) => {
              const isExpanded = expandedId === entry.id
              return (
                <tr key={entry.id} className="group">
                  <td colSpan={7} className="p-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className={cn(
                        "flex w-full items-center text-left transition-colors hover:bg-muted/30",
                        isExpanded && "bg-muted/20"
                      )}
                    >
                      <div className="flex w-8 items-center justify-center px-3 py-2.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-shrink-0 px-3 py-2.5 w-[120px]">
                        <span
                          className="text-xs text-muted-foreground"
                          title={new Date(entry.created_at).toLocaleString()}
                        >
                          {relativeTime(entry.created_at)}
                        </span>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2.5 w-[140px]">
                        <span className="text-xs text-foreground truncate block">
                          {entry.changed_by_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {entry.changed_by_type}
                        </span>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2.5 w-[140px]">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                          {entry.table_name}
                        </span>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2.5 w-[100px]">
                        <ActionBadge action={entry.action} />
                      </div>
                      <div className="flex-1 px-3 py-2.5 min-w-0">
                        {entry.changed_fields ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {entry.changed_fields.join(", ")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">--</span>
                        )}
                      </div>
                      <div className="flex-shrink-0 px-3 py-2.5 w-[100px]">
                        <span className="font-mono text-[10px] text-muted-foreground truncate block">
                          {entry.record_id.slice(0, 8)}...
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-muted/10">
                        <ExpandedRow entry={entry} />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    page === currentPage
                      ? "bg-steel/20 text-steel"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {page}
                </button>
              )
            })}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
