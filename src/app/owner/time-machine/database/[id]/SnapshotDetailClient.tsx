"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableBrowser } from "../../components/TableBrowser"
import { restoreFromSnapshot, deleteSnapshot, exportSnapshot } from "../actions"

interface SnapshotDetailClientProps {
  snapshotId: string
  tables: Record<string, Record<string, unknown>[]>
}

export function SnapshotDetailClient({ snapshotId, tables }: SnapshotDetailClientProps) {
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreFromSnapshot(snapshotId)
      if (result && "error" in result && result.error) {
        setError(result.error)
      } else {
        setConfirmAction(null)
        router.push("/owner/time-machine/database")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSnapshot(snapshotId)
      if (result && "error" in result && result.error) {
        setError(result.error)
      } else {
        router.push("/owner/time-machine/database")
      }
    })
  }

  async function handleExport() {
    const result = await exportSnapshot(snapshotId)
    if ("error" in result && result.error) {
      setError(result.error)
      return
    }
    if ("urls" in result && result.urls) {
      // Open first URL in new tab as a starting point
      const firstUrl = Object.values(result.urls)[0]
      if (firstUrl) window.open(firstUrl, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setConfirmAction("restore")}
          disabled={isPending}
          className="text-xs"
          variant="outline"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Restore All
        </Button>
        <Button
          onClick={handleExport}
          disabled={isPending}
          className="text-xs"
          variant="outline"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export JSON
        </Button>
        <Button
          onClick={() => setConfirmAction("delete")}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300"
          variant="outline"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {/* Confirmation */}
      {confirmAction && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-400">
            {confirmAction === "restore"
              ? "Restore this snapshot? A safety backup will be created first."
              : "Delete this snapshot permanently?"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={confirmAction === "restore" ? handleRestore : handleDelete}
              disabled={isPending}
              className="text-xs"
            >
              {isPending ? "Processing..." : `Confirm ${confirmAction === "restore" ? "Restore" : "Delete"}`}
            </Button>
            <Button
              onClick={() => setConfirmAction(null)}
              variant="outline"
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Table browser */}
      <TableBrowser tables={tables} />
    </div>
  )
}
