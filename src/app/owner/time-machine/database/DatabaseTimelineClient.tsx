"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Timeline } from "../components/Timeline"
import { CompareSelector } from "../components/CompareSelector"

interface SnapshotSummary {
  id: string
  created_at: string
  trigger_type: string
  triggered_by: string | null
  size_bytes: number
  table_counts: Record<string, number>
  label: string | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DatabaseTimelineClient({ snapshots }: { snapshots: SnapshotSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const router = useRouter()

  const timelineItems = snapshots.map((s) => {
    const totalRows = Object.values(s.table_counts).reduce((sum, n) => sum + n, 0)
    return {
      id: s.id,
      timestamp: s.created_at,
      title: s.label ?? `${s.trigger_type === "auto" ? "Automated" : s.trigger_type === "pre_restore" ? "Pre-Restore" : "Manual"} Backup`,
      subtitle: s.triggered_by ?? undefined,
      badge: {
        label: s.trigger_type,
        variant: s.trigger_type as "auto" | "manual" | "pre_restore",
      },
      metadata: {
        rows: totalRows,
        size: formatSize(s.size_bytes),
        tables: Object.keys(s.table_counts).length,
      },
    }
  })

  function handleSelect(id: string) {
    setSelectedId(id)
    router.push(`/owner/time-machine/database/${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="rounded-md border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Snapshot History</h2>
        <Timeline
          items={timelineItems}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Compare */}
      <CompareSelector
        snapshots={snapshots.map((s) => ({
          id: s.id,
          created_at: s.created_at,
          trigger_type: s.trigger_type,
        }))}
        onCompare={() => {}}
      />
    </div>
  )
}
