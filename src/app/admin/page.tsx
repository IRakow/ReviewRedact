import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { ResellerTable } from "@/components/admin/ResellerTable"
import { Button } from "@/components/ui/button"
import { Users, Building2, MessageSquare, Trash2, TrendingUp, UserPlus, Shield } from "lucide-react"

export default async function AdminOverviewPage() {
  const supabase = createServerClient()

  const [
    { data: resellers },
    { count: totalClients },
    { count: totalReviews },
    { count: removedReviews },
  ] = await Promise.all([
    supabase
      .from("resellers")
      .select("id, name, company, email, is_active, created_at, role")
      .eq("role", "reseller")
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "removed"),
  ])

  const resellerList = resellers ?? []
  const clientCount = totalClients ?? 0
  const reviewCount = totalReviews ?? 0
  const removedCount = removedReviews ?? 0
  const successRate = reviewCount > 0 ? ((removedCount / reviewCount) * 100).toFixed(1) : "0.0"

  const activeResellers = resellerList.filter((r) => r.is_active).length
  const inactiveResellers = resellerList.filter((r) => !r.is_active).length

  // Fetch client counts per reseller
  const resellerIds = resellerList.map((r) => r.id)
  let clientCounts: Record<string, number> = {}

  if (resellerIds.length > 0) {
    const { data: clientsByReseller } = await supabase
      .from("clients")
      .select("reseller_id")
      .in("reseller_id", resellerIds)

    if (clientsByReseller) {
      clientCounts = clientsByReseller.reduce<Record<string, number>>((acc, c) => {
        acc[c.reseller_id] = (acc[c.reseller_id] || 0) + 1
        return acc
      }, {})
    }
  }

  const tableResellers = resellerList.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    email: r.email,
    client_count: clientCounts[r.id] || 0,
    is_active: r.is_active,
    created_at: r.created_at,
  }))

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-steel" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Admin Overview
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage resellers, monitor platform performance
          </p>
        </div>
        <Link href="/admin/resellers/new">
          <Button size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Register Reseller
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard
          label="Total Resellers"
          value={resellerList.length}
          icon={<Users className="h-5 w-5" />}
          subtext={`${activeResellers} active, ${inactiveResellers} inactive`}
        />
        <StatsCard
          label="Total Clients"
          value={clientCount}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatsCard
          label="Total Reviews"
          value={reviewCount}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatsCard
          label="Reviews Removed"
          value={removedCount}
          icon={<Trash2 className="h-5 w-5" />}
        />
        <StatsCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Reseller Table */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Resellers
        </h2>
        {tableResellers.length > 0 ? (
          <ResellerTable resellers={tableResellers} />
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No resellers yet"
            description="Register your first reseller to get started. They'll receive a unique PIN code for login."
          />
        )}
      </div>
    </div>
  )
}
