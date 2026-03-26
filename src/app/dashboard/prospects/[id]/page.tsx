import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { ProspectDetailClient } from "./ProspectDetailClient"
import type { Prospect } from "@/lib/types"
import {
  ArrowLeft,
  Phone,
  Building2,
  User,
  ExternalLink,
  Star,
  TrendingUp,
} from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !prospect) {
    notFound()
  }

  // Verify access
  if (session.user_type === "salesperson" && prospect.created_by_id !== session.user_id) {
    notFound()
  }
  if (session.user_type === "reseller") {
    // Check if prospect was created by this reseller or their salespeople
    const { data: salespeople } = await supabase
      .from("salespeople")
      .select("id")
      .eq("reseller_id", session.user_id)

    const spIds = (salespeople ?? []).map((sp) => sp.id)
    const allowedIds = [session.user_id, ...spIds]

    if (!allowedIds.includes(prospect.created_by_id)) {
      notFound()
    }
  }
  // owner sees all

  const p = prospect as Prospect
  const reviewSnapshot = p.review_snapshot ?? []
  const selectedIds = new Set(p.selected_review_ids ?? [])

  function statusType(s: string): "active" | "pending" | "completed" | "paused" {
    if (s === "converted") return "completed"
    if (s === "lost") return "paused"
    return "active"
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/prospects"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {p.contact_name || p.company_name || "Unnamed Lead"}
            </h1>
            <StatusBadge status={statusType(p.status)} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {p.company_name && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {p.company_name}
              </span>
            )}
            {p.contact_name && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {p.contact_name}
              </span>
            )}
            {p.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {p.phone}
              </span>
            )}
          </div>

          <div className="mt-2">
            <a
              href={p.google_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
            >
              View on Google
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      {p.original_rating != null && p.projected_rating != null && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Original Rating
            </p>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">
                {p.original_rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Projected Rating
            </p>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">
                {p.projected_rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Improvement
            </p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">
                +{(p.projected_rating - p.original_rating).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Client component for interactive parts */}
      <ProspectDetailClient
        prospect={p}
        reviewSnapshot={reviewSnapshot}
        selectedIds={Array.from(selectedIds)}
      />
    </div>
  )
}
