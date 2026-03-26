"use client"

import { cn } from "@/lib/utils"

/* ── Database Diff Types ── */
interface RowDiff {
  type: "added" | "removed" | "modified"
  row: Record<string, unknown>
  changes?: Record<string, { old: unknown; new: unknown }>
}

interface TableDiff {
  table: string
  added: number
  removed: number
  modified: number
  rows: RowDiff[]
}

/* ── Code Diff Types ── */
interface FileDiff {
  filename: string
  additions: number
  deletions: number
  patch: string
}

interface DiffViewProps {
  mode: "database" | "code"
  tables?: TableDiff[]
  files?: FileDiff[]
}

const rowBg: Record<string, string> = {
  added: "bg-emerald-500/5 border-emerald-500/20",
  removed: "bg-red-500/5 border-red-500/20",
  modified: "bg-amber-500/5 border-amber-500/20",
}

const rowLabel: Record<string, string> = {
  added: "text-emerald-400",
  removed: "text-red-400",
  modified: "text-amber-400",
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "null"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function DatabaseDiff({ tables }: { tables: TableDiff[] }) {
  if (tables.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No differences found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tables.map((t) => (
        <div key={t.table} className="rounded-md border border-border bg-surface overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-surface">
            <span className="text-sm font-semibold text-foreground font-mono">{t.table}</span>
            <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider">
              {t.added > 0 && <span className="text-emerald-400">+{t.added} added</span>}
              {t.removed > 0 && <span className="text-red-400">-{t.removed} removed</span>}
              {t.modified > 0 && <span className="text-amber-400">~{t.modified} modified</span>}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {t.rows.map((row, idx) => (
              <div
                key={idx}
                className={cn("px-4 py-2.5 border-l-2", rowBg[row.type])}
              >
                <span className={cn("text-[10px] font-medium uppercase tracking-wider mb-1 block", rowLabel[row.type])}>
                  {row.type}
                </span>
                {row.type === "modified" && row.changes ? (
                  <div className="space-y-1">
                    {Object.entries(row.changes).map(([field, change]) => (
                      <div key={field} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">{field}:</span>
                        <span className="font-mono text-red-400 line-through">
                          {formatValue(change.old)}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-mono text-emerald-400">
                          {formatValue(change.new)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(row.row).map(([key, val]) => (
                      <span key={key} className="text-xs">
                        <span className="font-mono text-muted-foreground">{key}:</span>{" "}
                        <span className="font-mono text-foreground/80">{formatValue(val)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CodeDiff({ files }: { files: FileDiff[] }) {
  if (files.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No file changes
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {files.map((file) => (
        <div key={file.filename} className="rounded-md border border-border bg-surface overflow-hidden">
          {/* File header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-surface">
            <span className="text-sm font-medium text-foreground font-mono">{file.filename}</span>
            <div className="flex items-center gap-2 text-[10px] font-medium font-mono">
              <span className="text-emerald-400">+{file.additions}</span>
              <span className="text-red-400">-{file.deletions}</span>
            </div>
          </div>

          {/* Patch content */}
          <div className="overflow-x-auto">
            <pre className="text-xs leading-5">
              {(file.patch ?? "").split("\n").map((line, idx) => {
                let bg = ""
                let textColor = "text-foreground/70"
                if (line.startsWith("+")) {
                  bg = "bg-emerald-500/10"
                  textColor = "text-emerald-300"
                } else if (line.startsWith("-")) {
                  bg = "bg-red-500/10"
                  textColor = "text-red-300"
                } else if (line.startsWith("@@")) {
                  bg = "bg-steel/5"
                  textColor = "text-steel"
                }
                return (
                  <div key={idx} className={cn("px-4 py-0", bg)}>
                    <span className="inline-block w-8 text-right text-muted-foreground/40 select-none mr-3">
                      {idx + 1}
                    </span>
                    <span className={textColor}>{line}</span>
                  </div>
                )
              })}
            </pre>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DiffView({ mode, tables, files }: DiffViewProps) {
  if (mode === "database" && tables) {
    return <DatabaseDiff tables={tables} />
  }
  if (mode === "code" && files) {
    return <CodeDiff files={files} />
  }
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      No diff data provided
    </div>
  )
}

export type { TableDiff, RowDiff, FileDiff }
