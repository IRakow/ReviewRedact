"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface TableBrowserProps {
  tables: Record<string, Record<string, unknown>[]>
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return "[object]"
  if (typeof value === "string") {
    // UUID detection: 8-4-4-4-12
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value.slice(0, 8)
    }
    // Date detection
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }
  return String(value)
}

function isUUID(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{8}-/i.test(value)
}

function isObject(value: unknown): boolean {
  return value !== null && typeof value === "object"
}

export function TableBrowser({ tables }: TableBrowserProps) {
  const tableNames = Object.keys(tables).sort()
  const [selectedTable, setSelectedTable] = useState(tableNames[0] ?? "")
  const [search, setSearch] = useState("")
  const [expandedCell, setExpandedCell] = useState<string | null>(null)

  const rows = tables[selectedTable] ?? []
  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [rows, search])

  if (tableNames.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No table data in this snapshot
      </div>
    )
  }

  return (
    <div className="flex gap-0 rounded-md border border-border bg-surface overflow-hidden">
      {/* Left sidebar — table list */}
      <div className="w-48 flex-shrink-0 border-r border-border bg-background">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tables ({tableNames.length})
          </p>
        </div>
        <div className="divide-y divide-border">
          {tableNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => { setSelectedTable(name); setSearch("") }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors",
                selectedTable === name
                  ? "bg-steel/10 text-steel-light"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              <span className="truncate font-mono">{name}</span>
              <span className="ml-1 flex-shrink-0 rounded-sm bg-surface px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
                {tables[name].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — data table */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Search bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${selectedTable}...`}
            className="h-7 border-0 bg-transparent text-xs focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {columns.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Empty table</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface/50">
                    {columns.map((col) => {
                      const val = row[col]
                      const cellId = `${rIdx}-${col}`
                      const isExpanded = expandedCell === cellId
                      return (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                          {isObject(val) ? (
                            <button
                              type="button"
                              onClick={() => setExpandedCell(isExpanded ? null : cellId)}
                              className="text-steel hover:text-steel-light text-[10px] font-mono"
                            >
                              {isExpanded ? (
                                <pre className="whitespace-pre-wrap max-w-xs text-left text-foreground/70">
                                  {JSON.stringify(val, null, 2)}
                                </pre>
                              ) : (
                                "[object]"
                              )}
                            </button>
                          ) : (
                            <span
                              className={cn(
                                isUUID(val) ? "font-mono text-muted-foreground" : "text-foreground/80"
                              )}
                              title={typeof val === "string" ? val : undefined}
                            >
                              {formatCell(val)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-1.5 text-[10px] text-muted-foreground">
          {filteredRows.length} of {rows.length} rows
          {search && ` (filtered)`}
        </div>
      </div>
    </div>
  )
}
