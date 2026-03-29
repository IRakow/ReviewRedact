import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Database, Clock, CalendarDays, HardDrive, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { listSnapshots, createSnapshot } from "./actions"
import { revalidatePath } from "next/cache"
import { DatabaseTimelineClient } from "./DatabaseTimelineClient"

async function createSnapshotAction() {
  "use server"
  await createSnapshot("Manual snapshot from Time Machine UI")
  revalidatePath("/owner/time-machine/database")
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DatabaseTimeMachinePage() {
  const session = await getSession()
  if (!session) redirect("/")

  const result = await listSnapshots()
  const snapshots = "data" in result ? result.data ?? [] : []
  const total = "total" in result ? result.total ?? 0 : 0

  const lastBackup = snapshots.length > 0
    ? new Date(snapshots[0].created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  const oldestBackup = snapshots.length > 0
    ? new Date(snapshots[snapshots.length - 1].created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

  const totalSize = snapshots.reduce((sum, s) => sum + (s.size_bytes ?? 0), 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/time-machine"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
              Database Time Machine
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full database snapshots stored in Google Cloud Storage
            </p>
          </div>
        </div>
        <form action={createSnapshotAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-steel/30 bg-steel/10 px-4 py-2 text-sm font-medium text-steel transition-colors hover:bg-steel/20"
          >
            <Database className="h-4 w-4" />
            Create Snapshot
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Total Snapshots"
          value={total}
          icon={<Database className="h-5 w-5" />}
          subtext="across all tiers"
        />
        <StatsCard
          label="Last Backup"
          value={lastBackup}
          icon={<Clock className="h-5 w-5" />}
          subtext="most recent"
        />
        <StatsCard
          label="Oldest Retained"
          value={oldestBackup}
          icon={<CalendarDays className="h-5 w-5" />}
          subtext="earliest snapshot"
        />
        <StatsCard
          label="Total Size"
          value={formatSize(totalSize)}
          icon={<HardDrive className="h-5 w-5" />}
          subtext="all snapshots"
        />
      </div>

      {/* Client component with timeline + compare */}
      <DatabaseTimelineClient
        snapshots={snapshots.map((s) => ({
          id: s.id,
          created_at: s.created_at,
          trigger_type: s.trigger_type ?? "manual",
          triggered_by: s.triggered_by ?? null,
          size_bytes: s.size_bytes ?? 0,
          table_counts: (s.table_counts ?? {}) as Record<string, number>,
          label: s.label ?? null,
        }))}
      />
    </div>
  )
}
