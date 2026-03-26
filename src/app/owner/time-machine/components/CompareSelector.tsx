"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Snapshot {
  id: string
  created_at: string
  trigger_type: string
}

interface CompareSelectorProps {
  snapshots: Snapshot[]
  onCompare: (idA: string, idB: string) => void
}

function formatSnapshotLabel(s: Snapshot) {
  const date = new Date(s.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${date} (${s.trigger_type})`
}

export function CompareSelector({ snapshots, onCompare }: CompareSelectorProps) {
  const [idA, setIdA] = useState("")
  const [idB, setIdB] = useState("")
  const router = useRouter()

  const canCompare = idA && idB && idA !== idB

  function handleCompare() {
    if (!canCompare) return
    onCompare(idA, idB)
    router.push(`/owner/time-machine/database/diff?a=${idA}&b=${idB}`)
  }

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="h-4 w-4 text-steel" />
        <h3 className="text-sm font-semibold text-foreground">Compare Snapshots</h3>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Snapshot A (older)
          </label>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className={cn(
              "flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground",
              "focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30",
              "transition-colors"
            )}
          >
            <option value="">Select snapshot...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatSnapshotLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Snapshot B (newer)
          </label>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className={cn(
              "flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground",
              "focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30",
              "transition-colors"
            )}
          >
            <option value="">Select snapshot...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatSnapshotLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleCompare}
          disabled={!canCompare}
          className="h-8 text-xs"
        >
          <GitCompare className="mr-1.5 h-3.5 w-3.5" />
          Compare
        </Button>
      </div>

      {idA && idB && idA === idB && (
        <p className="mt-2 text-[10px] text-amber-400">
          Select two different snapshots to compare
        </p>
      )}
    </div>
  )
}
