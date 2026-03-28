import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { StarDistribution } from "@/components/dashboard/StarDistribution"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ReviewManager } from "@/app/dashboard/clients/[id]/ReviewManager"
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
  User,
} from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OwnerClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  const supabase = createServerClient()

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (clientError || !client) notFound()

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

  // Get reseller/salesperson names
  let resellerName = "Owner-Direct"
  if (client.reseller_id) {
    const { data: reseller } = await supabase
      .from("resellers")
      .select("name, role")
      .eq("id", client.reseller_id)
      .single()
    if (reseller && reseller.role === "reseller") {
      resellerName = reseller.name
    }
  }

  let salespersonName: string | null = null
  if (client.salesperson_id) {
    const { data: sp } = await supabase
      .from("salespeople")
      .select("name")
      .eq("id", client.salesperson_id)
      .single()
    if (sp) salespersonName = sp.name
  }

  // Fetch contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, status, google_review_count, contract_rate_google, generated_at, signed_at")
    .eq("client_id", id)
    .order("generated_at", { ascending: false })

  const contractList = contracts ?? []

  // Fetch notes — owner sees all
  const { data: notesData } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  const clientNotes: ClientNote[] = (notesData ?? []) as ClientNote[]

  const typedClient = client as Client

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Back nav + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/owner/clients"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
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
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {typedClient.owner_name}
              </span>
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

          <div className="mt-2 flex items-center gap-4">
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

      {/* Owner-specific assignment info */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Assignment</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 text-sm lg:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Reseller:</span>{" "}
            {client.reseller_id && resellerName !== "Owner-Direct" ? (
              <Link
                href={`/owner/resellers/${client.reseller_id}`}
                className="text-steel hover:text-steel-light"
              >
                {resellerName}
              </Link>
            ) : (
              <span className="text-steel">Owner-Direct</span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Salesperson:</span>{" "}
            {client.salesperson_id && salespersonName ? (
              <Link
                href={`/owner/salespeople/${client.salesperson_id}`}
                className="text-steel hover:text-steel-light"
              >
                {salespersonName}
              </Link>
            ) : (
              <span className="text-foreground">None</span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Client ID:</span>{" "}
            <span className="font-mono text-xs text-foreground">{typedClient.id.slice(0, 8)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            <span className="text-foreground">{new Date(typedClient.created_at).toLocaleDateString()}</span>
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

      {/* Contracts table */}
      {contractList.length > 0 && (
        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Contracts ({contractList.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Reviews</th>
                <th className="px-5 py-3 text-left">Rate</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contractList.map((c) => (
                <tr key={c.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{c.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-foreground">{c.google_review_count}</td>
                  <td className="px-5 py-3 font-mono text-foreground">
                    {c.contract_rate_google ? `$${c.contract_rate_google}` : "N/A"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status as "draft" | "sent" | "signed" | "active" | "completed"} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(c.generated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review manager (interactive) */}
      <ReviewManager client={typedClient} reviews={allReviews} />

      {/* Notes */}
      <ClientNotes
        clientId={id}
        notes={clientNotes}
        currentUserId={session.user_id}
        currentUserType="owner"
        currentUserName={session.name}
      />
    </div>
  )
}
