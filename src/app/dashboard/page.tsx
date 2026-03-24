import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ClientSearch } from "./ClientSearch"
import { Plus } from "lucide-react"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  // Fetch clients based on role
  const clientsQuery = supabase
    .from("clients")
    .select("id, business_name, owner_name, address, status")
    .order("created_at", { ascending: false })

  if (session.role !== "admin") {
    clientsQuery.eq("reseller_id", session.reseller_id)
  }

  const { data: clients, error: clientsError } = await clientsQuery

  if (clientsError) {
    throw new Error(`Failed to fetch clients: ${clientsError.message}`)
  }

  // Fetch review counts and average ratings per client
  const clientIds = (clients ?? []).map((c) => c.id)

  let reviewAggregates: Record<string, { count: number; avg: number | null }> = {}

  if (clientIds.length > 0) {
    // Get review counts grouped by client
    const { data: reviews } = await supabase
      .from("reviews")
      .select("client_id, star_rating")
      .in("client_id", clientIds)
      .eq("status", "active")

    if (reviews) {
      const grouped: Record<string, number[]> = {}
      for (const review of reviews) {
        if (!grouped[review.client_id]) {
          grouped[review.client_id] = []
        }
        grouped[review.client_id].push(review.star_rating)
      }
      for (const [clientId, ratings] of Object.entries(grouped)) {
        const sum = ratings.reduce((a, b) => a + b, 0)
        reviewAggregates[clientId] = {
          count: ratings.length,
          avg: ratings.length > 0 ? sum / ratings.length : null,
        }
      }
    }

    // Also check latest snapshots for clients without reviews
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("client_id, average_rating, total_reviews")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false })

    if (snapshots) {
      const seen = new Set<string>()
      for (const snapshot of snapshots) {
        if (seen.has(snapshot.client_id)) continue
        seen.add(snapshot.client_id)
        // Only use snapshot data if we don't already have review data
        if (!reviewAggregates[snapshot.client_id]) {
          reviewAggregates[snapshot.client_id] = {
            count: snapshot.total_reviews ?? 0,
            avg: snapshot.average_rating,
          }
        }
      }
    }
  }

  const clientData = (clients ?? []).map((c) => ({
    id: c.id,
    business_name: c.business_name,
    owner_name: c.owner_name,
    address: c.address,
    status: c.status as "pending" | "active" | "in_progress" | "completed" | "paused",
    review_count: reviewAggregates[c.id]?.count ?? 0,
    average_rating: reviewAggregates[c.id]?.avg ?? null,
  }))

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Clients
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client reviews and contracts
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </Button>
        </Link>
      </div>

      <ClientSearch clients={clientData} />
    </div>
  )
}
