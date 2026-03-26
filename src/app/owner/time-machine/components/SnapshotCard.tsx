"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Eye, GitCompare, RotateCcw, Download, Trash2 } from "lucide-react"

interface SnapshotCardProps {
  id: string
  createdAt: string
  triggerType: "auto" | "manual" | "pre_restore"
  totalRows: number
  sizeBytes: number
  onRestore?: (id: string) => void
  onExport?: (id: string) => void
  onDelete?: (id: string) => void
}

const triggerBadge: Record<string, { label: string; className: string }> = {
  auto: { label: "Auto", className: "bg-steel/15 text-steel-light border-steel/30" },
  manual: { label: "Manual", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pre_restore: { label: "Pre-Restore", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SnapshotCard({
  id,
  createdAt,
  triggerType,
  totalRows,
  sizeBytes,
  onRestore,
  onExport,
  onDelete,
}: SnapshotCardProps) {
  const badge = triggerBadge[triggerType] ?? triggerBadge.auto

  return (
    <div className="rounded-md border border-border bg-surface p-4 transition-colors hover:border-steel/20">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              badge.className
            )}
          >
            {badge.label}
          </span>
          <p
            className="text-xs text-foreground font-mono"
            title={new Date(createdAt).toLocaleString()}
          >
            {relativeTime(createdAt)}
          </p>
        </div>

        <div className="text-right space-y-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-foreground/80">{totalRows.toLocaleString()}</span> rows
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">{formatSize(sizeBytes)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1">
        <Link
          href={`/owner/time-machine/database/${id}`}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
        >
          <Eye className="h-3 w-3" /> Browse
        </Link>
        <Link
          href={`/owner/time-machine/database/diff?a=${id}&b=`}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
        >
          <GitCompare className="h-3 w-3" /> Compare
        </Link>
        {onRestore && (
          <button
            type="button"
            onClick={() => onRestore(id)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-amber-500/30 hover:text-amber-400"
          >
            <RotateCcw className="h-3 w-3" /> Restore
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={() => onExport(id)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
          >
            <Download className="h-3 w-3" /> Export
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
      </div>
    </div>
  )
}
