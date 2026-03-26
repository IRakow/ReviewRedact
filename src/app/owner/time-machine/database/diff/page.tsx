"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { DiffView } from "../../components/DiffView"
import type { TableDiff } from "../../components/DiffView"
import { diffSnapshots } from "../actions"

function DiffPageContent() {
  const searchParams = useSearchParams()
  const idA = searchParams.get("a") ?? ""
  const idB = searchParams.get("b") ?? ""
  const [tables, setTables] = useState<TableDiff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idA || !idB) {
      setLoading(false)
      setError("Both snapshot IDs are required. Use the Compare Selector on the database page.")
      return
    }

    setLoading(true)
    diffSnapshots(idA, idB).then((result) => {
      if ("error" in result && result.error) {
        setError(result.error)
      } else if ("diffs" in result && result.diffs) {
        // Convert the existing diff format to TableDiff format
        const diffs = result.diffs as Record<string, {
          added: Array<Record<string, unknown>>
          removed: Array<Record<string, unknown>>
          modified: Array<{ before: Record<string, unknown>; after: Record<string, unknown> }>
          counts: { added: number; removed: number; modified: number }
        }>

        const tableDiffs: TableDiff[] = Object.entries(diffs)
          .filter(([, diff]) => diff.counts.added > 0 || diff.counts.removed > 0 || diff.counts.modified > 0)
          .map(([table, diff]) => ({
            table,
            added: diff.counts.added,
            removed: diff.counts.removed,
            modified: diff.counts.modified,
            rows: [
              ...diff.added.map((row) => ({
                type: "added" as const,
                row: row as Record<string, unknown>,
              })),
              ...diff.removed.map((row) => ({
                type: "removed" as const,
                row: row as Record<string, unknown>,
              })),
              ...diff.modified.map((m) => {
                const changes: Record<string, { old: unknown; new: unknown }> = {}
                const before = m.before as Record<string, unknown>
                const after = m.after as Record<string, unknown>
                for (const key of Object.keys(after)) {
                  if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                    changes[key] = { old: before[key], new: after[key] }
                  }
                }
                return {
                  type: "modified" as const,
                  row: after as Record<string, unknown>,
                  changes,
                }
              }),
            ],
          }))

        setTables(tableDiffs)
      }
      setLoading(false)
    })
  }, [idA, idB])

  const totalAdded = tables.reduce((s, t) => s + t.added, 0)
  const totalRemoved = tables.reduce((s, t) => s + t.removed, 0)
  const totalModified = tables.reduce((s, t) => s + t.modified, 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/time-machine/database"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Snapshot Diff
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparing two database snapshots
          </p>
        </div>
      </div>

      {/* Snapshot IDs */}
      {idA && idB && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-5 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Snapshot A
            </p>
            <p className="text-xs font-mono text-foreground">{idA.slice(0, 12)}...</p>
          </div>
          <span className="text-muted-foreground">&rarr;</span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Snapshot B
            </p>
            <p className="text-xs font-mono text-foreground">{idB.slice(0, 12)}...</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-steel" />
          <span className="ml-2 text-sm text-muted-foreground">Computing diff...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Summary stats */}
      {!loading && !error && (
        <>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-emerald-400 font-mono">+{totalAdded} added</span>
            <span className="text-red-400 font-mono">-{totalRemoved} removed</span>
            <span className="text-amber-400 font-mono">~{totalModified} modified</span>
            <span className="text-muted-foreground">
              across {tables.length} table{tables.length !== 1 ? "s" : ""}
            </span>
          </div>

          <DiffView mode="database" tables={tables} />
        </>
      )}
    </div>
  )
}

export default function SnapshotDiffPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-steel" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      }
    >
      <DiffPageContent />
    </Suspense>
  )
}
