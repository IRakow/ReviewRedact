import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { StarRating } from "@/components/dashboard/StarRating"
import { StarDistribution } from "@/components/dashboard/StarDistribution"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ReviewManager } from "./ReviewManager"
import type { Client, Review, Snapshot, ClientNote } from "@/lib/types"
import { ClientNotes } from "@/components/dashboard/ClientNotes"
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Star,
  MessageSquare,
  BarChart3,
} from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Verify ownership
  const hasAccess =
    session.user_type === "owner" ||
    (session.user_type === "reseller" && client.reseller_id === session.user_id) ||
    (session.user_type === "salesperson" && client.salesperson_id === session.user_id)

  if (!hasAccess) {
    notFound()
  }

  // Fetch reviews sorted by star_rating ASC (worst first)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("client_id", id)
    .order("star_rating", { ascending: true })

  const allReviews: Review[] = (reviews ?? []) as Review[]

  // Fetch latest snapshot
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(1)

  const latestSnapshot: Snapshot | null =
    snapshots && snapshots.length > 0 ? (snapshots[0] as Snapshot) : null

  // Compute rating stats from active reviews
  const activeReviews = allReviews.filter((r) => r.status === "active")
  const totalActive = activeReviews.length
  const totalStars = activeReviews.reduce((sum, r) => sum + r.star_rating, 0)
  const averageRating = totalActive > 0 ? totalStars / totalActive : null

  // Star distribution
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: activeReviews.filter((r) => r.star_rating === stars).length,
  }))

  // Fetch notes with visibility filtering
  const { data: allNotesData } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  const allNotes: ClientNote[] = (allNotesData ?? []) as ClientNote[]

  // Visibility rules:
  // - Owner sees all (handled in owner page)
  // - Reseller sees: own notes + their salespeople's notes + owner notes
  // - Salesperson sees: own notes + their reseller's notes + owner notes
  let visibleNotes: ClientNote[]
  if (session.user_type === "reseller") {
    // Get salespeople IDs under this reseller
    const { data: spRows } = await supabase
      .from("salespeople")
      .select("id")
      .eq("reseller_id", session.user_id)
    const spIds = new Set((spRows ?? []).map((sp: { id: string }) => sp.id))

    visibleNotes = allNotes.filter(
      (n) =>
        n.author_type === "owner" ||
        n.author_id === session.user_id ||
        spIds.has(n.author_id)
    )
  } else if (session.user_type === "salesperson") {
    visibleNotes = allNotes.filter(
      (n) =>
        n.author_type === "owner" ||
        n.author_id === session.user_id ||
        (n.author_type === "reseller" && session.parent_reseller_id && n.author_id === session.parent_reseller_id)
    )
  } else {
    // owner fallback (shouldn't hit this page normally)
    visibleNotes = allNotes
  }

  const typedClient = client as Client

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Back nav + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="heading-accent truncate text-xl font-semibold tracking-tight text-foreground">
              {typedClient.business_name}
            </h1>
            <StatusBadge status={typedClient.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {typedClient.address}
            </span>
            {typedClient.owner_name && (
              <span>Owner: {typedClient.owner_name}</span>
            )}
            {typedClient.business_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {typedClient.business_phone}
              </span>
            )}
            {typedClient.owner_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {typedClient.owner_email}
              </span>
            )}
          </div>

          <div className="mt-2">
            <a
              href={typedClient.google_url}
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

      {/* Rating summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Average Rating"
          value={averageRating !== null ? averageRating.toFixed(2) : "N/A"}
          icon={<Star className="h-5 w-5" />}
          subtext={
            latestSnapshot?.average_rating !== null && latestSnapshot?.average_rating !== undefined
              ? `Snapshot: ${latestSnapshot.average_rating.toFixed(2)}`
              : undefined
          }
        />
        <StatsCard
          label="Total Reviews"
          value={allReviews.length}
          icon={<MessageSquare className="h-5 w-5" />}
          subtext={`${totalActive} active`}
        />
        <StatsCard
          label="In Progress"
          value={allReviews.filter((r) => r.status === "in_progress").length}
          icon={<BarChart3 className="h-5 w-5" />}
          subtext={`${allReviews.filter((r) => r.status === "removed" || r.status === "waiting_for_payment" || r.status === "paid").length} removed`}
        />
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Star Distribution
          </p>
          <StarDistribution distribution={distribution} total={totalActive} />
        </div>
      </div>

      {/* Review manager (interactive) */}
      <ReviewManager client={typedClient} reviews={allReviews} />

      {/* Notes */}
      <ClientNotes
        clientId={id}
        notes={visibleNotes}
        currentUserId={session.user_id}
        currentUserType={session.user_type as "owner" | "reseller" | "salesperson"}
        currentUserName={session.name}
      />
    </div>
  )
}
