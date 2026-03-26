import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { uploadJSON, deleteFolder } from "@/lib/gcs"
import { runCleanup } from "@/app/owner/time-machine/database/actions"

const ALL_TABLES = [
  "resellers", "salespeople", "clients", "reviews", "contracts",
  "invoices", "payments", "payouts", "documents", "notifications",
  "rate_overrides", "snapshots", "prospects",
] as const

/**
 * Scheduled database backup cron — runs daily at 3 AM.
 * Creates a full snapshot of all tables, determines retention tier,
 * and cleans up expired backups.
 */
export async function GET(request: Request) {
  // Safety check: verify CRON_SECRET (proxy already checks, but belt-and-suspenders)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient()
  const now = new Date()
  const timestamp = now.toISOString()
  const gcsPath = `backups/${timestamp}/`

  try {
    // 1. Read all tables in parallel
    const results = await Promise.all(
      ALL_TABLES.map(async (table) => {
        const { data, error } = await supabase.from(table).select("*")
        if (error) throw new Error(`Failed to read ${table}: ${error.message}`)
        return { table, rows: data ?? [] }
      })
    )

    // 2. Upload each table to GCS in parallel
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
    await uploadJSON(gcsPath + "metadata.json", {
      trigger_type: "scheduled",
      triggered_by: "cron",
      table_counts: tableCounts,
      timestamp,
    })

    // 3. Determine retention tier
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isNewMonth = tomorrow.getMonth() !== now.getMonth()
    // ISO week changes when tomorrow is Monday (getDay() === 1)
    const isNewISOWeek = tomorrow.getDay() === 1

    let retentionTier: "daily" | "weekly" | "monthly"
    let expiresAt: string | null

    if (isNewMonth) {
      retentionTier = "monthly"
      expiresAt = null // Monthly snapshots never expire
    } else if (isNewISOWeek) {
      retentionTier = "weekly"
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      retentionTier = "daily"
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    // 4. Insert db_backups record
    const { data: backup, error: insertError } = await supabase
      .from("db_backups")
      .insert({
        gcs_path: gcsPath,
        trigger_type: "scheduled",
        triggered_by: "cron",
        table_counts: tableCounts,
        size_bytes: sizeBytes,
        retention_tier: retentionTier,
        expires_at: expiresAt,
        notes: null,
      })
      .select("id")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5. Run cleanup of expired snapshots
    const cleanupResult = await runCleanup()

    return NextResponse.json({
      success: true,
      backup_id: backup.id,
      gcs_path: gcsPath,
      retention_tier: retentionTier,
      expires_at: expiresAt,
      table_counts: tableCounts,
      size_bytes: sizeBytes,
      cleanup: cleanupResult,
      timestamp,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[cron/backup] Failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
