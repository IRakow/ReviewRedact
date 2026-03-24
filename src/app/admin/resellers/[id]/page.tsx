import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { ClientCard } from "@/components/dashboard/ClientCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { ArrowLeft, Users, MessageSquare, Trash2, Mail, Phone, Building2, MapPin, Hash, Calendar, DollarSign } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResellerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: reseller, error } = await supabase
    .from("resellers")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !reseller) notFound()

  // Fetch clients with review counts and average ratings
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("reseller_id", id)
    .order("created_at", { ascending: false })

  const clientList = clients ?? []
  const clientIds = clientList.map((c) => c.id)

  // Fetch review data for all clients
  let reviewsByClient: Record<string, { total: number; removed: number }> = {}
  let ratingsByClient: Record<string, number | null> = {}

  if (clientIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("client_id, status")
      .in("client_id", clientIds)

    if (reviews) {
      reviewsByClient = reviews.reduce<Record<string, { total: number; removed: number }>>((acc, r) => {
        if (!acc[r.client_id]) acc[r.client_id] = { total: 0, removed: 0 }
        acc[r.client_id].total++
        if (r.status === "removed") acc[r.client_id].removed++
        return acc
      }, {})
    }

    // Fetch latest snapshots for average ratings
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("client_id, average_rating")
      .in("client_id", clientIds)
      .eq("platform", "google")
      .order("created_at", { ascending: false })

    if (snapshots) {
      const seen = new Set<string>()
      for (const snap of snapshots) {
        if (!seen.has(snap.client_id)) {
          seen.add(snap.client_id)
          ratingsByClient[snap.client_id] = snap.average_rating
        }
      }
    }
  }

  const totalClients = clientList.length
  const totalReviews = Object.values(reviewsByClient).reduce((sum, r) => sum + r.total, 0)
  const totalRemoved = Object.values(reviewsByClient).reduce((sum, r) => sum + r.removed, 0)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Back link */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-steel transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Admin
      </Link>

      {/* Reseller Info Header */}
      <div className="rounded-md border border-border bg-surface p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {reseller.name}
              </h1>
              <StatusBadge status={reseller.is_active ? "active" : "paused"} />
            </div>
            {reseller.company && (
              <p className="text-sm text-muted-foreground">{reseller.company}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0 text-steel/60" />
            <span>{reseller.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-steel/60" />
            <span>{reseller.cell}</span>
          </div>
          {reseller.address && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-steel/60" />
              <span>{reseller.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Hash className="h-4 w-4 shrink-0 text-steel/60" />
            <span>
              PIN:{" "}
              <span className="font-mono font-semibold text-steel tracking-wider">
                {reseller.pin_code}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0 text-steel/60" />
            <span>
              Google: <span className="font-mono text-foreground">${reseller.base_rate_google.toLocaleString()}</span>
              {" / "}
              Facebook: <span className="font-mono text-foreground">${reseller.base_rate_facebook.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-steel/60" />
            <span>
              Joined{" "}
              {new Date(reseller.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Total Clients"
          value={totalClients}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          label="Total Reviews"
          value={totalReviews}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatsCard
          label="Reviews Removed"
          value={totalRemoved}
          icon={<Trash2 className="h-5 w-5" />}
        />
      </div>

      {/* Client List */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Clients
        </h2>
        {clientList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientList.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id}
                businessName={client.business_name}
                ownerName={client.owner_name}
                address={client.address}
                status={client.status}
                reviewCount={reviewsByClient[client.id]?.total ?? 0}
                averageRating={ratingsByClient[client.id] ?? null}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No clients yet"
            description="This reseller hasn't added any clients."
          />
        )}
      </div>
    </div>
  )
}
