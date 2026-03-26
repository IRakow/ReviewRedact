"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { uploadJSON, downloadJSON, deleteFolder, getSignedUrl } from "@/lib/gcs"
import { revalidatePath } from "next/cache"

const ALL_TABLES = [
  "resellers", "salespeople", "clients", "reviews", "contracts",
  "invoices", "payments", "payouts", "documents", "notifications",
  "rate_overrides", "snapshots", "prospects",
] as const

type TableName = (typeof ALL_TABLES)[number]

// ─── Create Snapshot ────────────────────────────────────────────────────────

export async function createSnapshot(notes?: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const timestamp = new Date().toISOString()
  const gcsPath = `backups/${timestamp}/`

  // Read all 13 tables in parallel
  const results = await Promise.all(
    ALL_TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select("*")
      if (error) throw new Error(`Failed to read ${table}: ${error.message}`)
      return { table, rows: data ?? [] }
    })
  )

  // Upload each table to GCS in parallel
  await Promise.all(
    results.map(({ table, rows }) => uploadJSON(gcsPath + table + ".json", rows))
  )

  // Build table_counts and calculate size_bytes
  const tableCounts: Record<string, number> = {}
  let sizeBytes = 0
  for (const { table, rows } of results) {
    tableCounts[table] = rows.length
    sizeBytes += JSON.stringify(rows).length
  }

  // Upload metadata to GCS
  const metadata = {
    trigger_type: "manual",
    triggered_by: session.name,
    table_counts: tableCounts,
    timestamp,
  }
  await uploadJSON(gcsPath + "metadata.json", metadata)

  // Insert record into db_backups
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: backup, error } = await supabase
    .from("db_backups")
    .insert({
      gcs_path: gcsPath,
      trigger_type: "manual",
      triggered_by: session.name,
      table_counts: tableCounts,
      size_bytes: sizeBytes,
      retention_tier: "daily",
      expires_at: expiresAt,
      notes: notes ?? null,
    })
    .select("id, gcs_path")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/owner/time-machine")
  return {
    id: backup.id,
    gcs_path: backup.gcs_path,
    table_counts: tableCounts,
    size_bytes: sizeBytes,
  }
}

// ─── List Snapshots ─────────────────────────────────────────────────────────

export async function listSnapshots(page = 1, limit = 20) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("db_backups")
    .select(
      "id, gcs_path, trigger_type, triggered_by, label, table_counts, size_bytes, retention_tier, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { error: error.message }
  return { data, total: count, page, limit }
}

// ─── Get Snapshot ───────────────────────────────────────────────────────────

export async function getSnapshot(id: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: backup, error } = await supabase
    .from("db_backups")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !backup) return { error: error?.message ?? "Snapshot not found" }

  // Download all tables from GCS in parallel
  const tableData: Record<string, unknown[]> = {}

  const results = await Promise.all(
    ALL_TABLES.map(async (table) => {
      try {
        const rows = await downloadJSON<unknown[]>(backup.gcs_path + table + ".json")
        return { table, rows }
      } catch {
        return { table, rows: [] }
      }
    })
  )

  for (const { table, rows } of results) {
    tableData[table] = rows
  }

  return { backup, tables: tableData }
}

// ─── Diff Snapshots ─────────────────────────────────────────────────────────

export async function diffSnapshots(idA: string, idB: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const [snapshotA, snapshotB] = await Promise.all([
    getSnapshot(idA),
    getSnapshot(idB),
  ])

  if ("error" in snapshotA && snapshotA.error) return { error: `Snapshot A: ${snapshotA.error}` }
  if ("error" in snapshotB && snapshotB.error) return { error: `Snapshot B: ${snapshotB.error}` }

  if (!snapshotA.tables || !snapshotB.tables) return { error: "Failed to load snapshot data" }

  const diffs: Record<string, { added: unknown[]; removed: unknown[]; modified: { before: unknown; after: unknown }[]; counts: { added: number; removed: number; modified: number } }> = {}

  for (const table of ALL_TABLES) {
    const rowsA = (snapshotA.tables[table] ?? []) as Array<Record<string, unknown>>
    const rowsB = (snapshotB.tables[table] ?? []) as Array<Record<string, unknown>>

    const mapA = new Map(rowsA.map((r) => [r.id as string, r]))
    const mapB = new Map(rowsB.map((r) => [r.id as string, r]))

    const added: unknown[] = []
    const removed: unknown[] = []
    const modified: { before: unknown; after: unknown }[] = []

    // Added: in B but not in A
    for (const [id, row] of mapB) {
      if (!mapA.has(id)) {
        added.push(row)
      }
    }

    // Removed: in A but not in B
    for (const [id, row] of mapA) {
      if (!mapB.has(id)) {
        removed.push(row)
      }
    }

    // Modified: same id but different content
    for (const [id, rowA] of mapA) {
      const rowB = mapB.get(id)
      if (rowB && JSON.stringify(rowA) !== JSON.stringify(rowB)) {
        modified.push({ before: rowA, after: rowB })
      }
    }

    diffs[table] = {
      added,
      removed,
      modified,
      counts: { added: added.length, removed: removed.length, modified: modified.length },
    }
  }

  return { diffs }
}

// ─── Restore From Snapshot ──────────────────────────────────────────────────

export async function restoreFromSnapshot(snapshotId: string, tables?: string[]) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  // Safety net: create a pre-restore snapshot first
  const safetySnapshot = await createSnapshot("Pre-restore safety backup")
  if ("error" in safetySnapshot && safetySnapshot.error) {
    return { error: `Failed to create safety snapshot: ${safetySnapshot.error}` }
  }

  // Fetch the target snapshot data from GCS
  const snapshot = await getSnapshot(snapshotId)
  if ("error" in snapshot && snapshot.error) return { error: snapshot.error }
  if (!snapshot.tables) return { error: "Failed to load snapshot data" }

  const supabase = createServerClient()
  const tablesToRestore = tables
    ? ALL_TABLES.filter((t) => tables.includes(t))
    : [...ALL_TABLES]

  const restored: Record<string, number> = {}

  for (const table of tablesToRestore) {
    const rows = snapshot.tables[table] as Array<Record<string, unknown>>

    // Delete all existing rows (use impossible UUID match to satisfy .neq requirement)
    await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    // Insert snapshot rows in batches if needed
    if (rows && rows.length > 0) {
      await supabase.from(table).insert(rows)
    }

    restored[table] = rows?.length ?? 0
  }

  revalidatePath("/owner/time-machine")
  return { success: true, restored, safety_snapshot_id: (safetySnapshot as { id: string }).id }
}

// ─── Export Snapshot ────────────────────────────────────────────────────────

export async function exportSnapshot(snapshotId: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: backup, error } = await supabase
    .from("db_backups")
    .select("gcs_path")
    .eq("id", snapshotId)
    .single()

  if (error || !backup) return { error: error?.message ?? "Snapshot not found" }

  // Generate signed URLs for each table file
  const urls: Record<string, string> = {}

  const results = await Promise.all(
    ALL_TABLES.map(async (table) => {
      const url = await getSignedUrl(backup.gcs_path + table + ".json")
      return { table, url }
    })
  )

  for (const { table, url } of results) {
    urls[table] = url
  }

  return { urls }
}

// ─── Delete Snapshot ────────────────────────────────────────────────────────

export async function deleteSnapshot(snapshotId: string) {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  const supabase = createServerClient()

  const { data: backup, error } = await supabase
    .from("db_backups")
    .select("gcs_path, retention_tier")
    .eq("id", snapshotId)
    .single()

  if (error || !backup) return { error: error?.message ?? "Snapshot not found" }

  if (backup.retention_tier === "monthly") {
    return { error: "Cannot delete monthly retention snapshots" }
  }

  // Delete GCS folder
  await deleteFolder(backup.gcs_path)

  // Delete database record
  const { error: deleteError } = await supabase
    .from("db_backups")
    .delete()
    .eq("id", snapshotId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath("/owner/time-machine")
  return { success: true }
}

// ─── Cleanup Expired Snapshots ──────────────────────────────────────────────

export async function cleanupExpiredSnapshots() {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    return { error: "Unauthorized" }
  }

  return runCleanup()
}

/** Shared cleanup logic callable from both the server action and the cron route */
export async function runCleanup() {
  const supabase = createServerClient()

  const { data: expired, error } = await supabase
    .from("db_backups")
    .select("id, gcs_path")
    .lt("expires_at", new Date().toISOString())
    .not("expires_at", "is", null)

  if (error || !expired) return { error: error?.message ?? "No expired snapshots", deleted: 0 }

  for (const backup of expired) {
    await deleteFolder(backup.gcs_path)
    await supabase.from("db_backups").delete().eq("id", backup.id)
  }

  return { deleted: expired.length }
}
