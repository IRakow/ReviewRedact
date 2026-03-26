import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSnapshot, deleteSnapshot } from "../actions"
import { SnapshotDetailClient } from "./SnapshotDetailClient"

export default async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/")

  const { id } = await params
  const result = await getSnapshot(id)

  if ("error" in result && result.error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/owner/time-machine/database"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Snapshot Not Found
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  const backup = result.backup!
  const tables = (result.tables ?? {}) as Record<string, Record<string, unknown>[]>

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
            Snapshot Detail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {new Date(backup.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-surface px-5 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Trigger
          </p>
          <p className="text-xs font-medium text-foreground capitalize">
            {backup.trigger_type}
          </p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Triggered By
          </p>
          <p className="text-xs font-medium text-foreground">
            {backup.triggered_by ?? "System"}
          </p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Retention
          </p>
          <p className="text-xs font-medium text-foreground capitalize">
            {backup.retention_tier ?? "daily"}
          </p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Size
          </p>
          <p className="text-xs font-medium text-foreground font-mono">
            {backup.size_bytes < 1024 * 1024
              ? `${(backup.size_bytes / 1024).toFixed(1)} KB`
              : `${(backup.size_bytes / (1024 * 1024)).toFixed(1)} MB`}
          </p>
        </div>
      </div>

      {/* Client component for actions + table browser */}
      <SnapshotDetailClient
        snapshotId={id}
        tables={tables}
      />
    </div>
  )
}
