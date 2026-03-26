import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ArrowLeft, Users, DollarSign, CheckCircle } from "lucide-react"

export default async function SalespersonPortalPage() {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type !== "salesperson") redirect("/dashboard")

  const supabase = createServerClient()

  // Fetch salesperson details
  const { data: sp } = await supabase
    .from("salespeople")
    .select("base_rate_google, display_price_google, pricing_plan, parent_type")
    .eq("id", session.user_id)
    .single()

  // Client count
  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("salesperson_id", session.user_id)

  // Reviews removed count
  const { data: removedReviews } = await supabase
    .from("reviews")
    .select("id, clients!inner(salesperson_id)")
    .eq("clients.salesperson_id", session.user_id)
    .in("status", ["removed", "waiting_for_payment", "paid"])

  const removedCount = removedReviews?.length ?? 0

  const planLabel = sp?.pricing_plan === "owner_plan_a"
    ? "Plan A ($750 base, $1K max)"
    : sp?.pricing_plan === "owner_plan_b"
      ? "Plan B ($1K base, keep above)"
      : `$${sp?.base_rate_google ?? 1000} base`

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            My Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your stats and settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="My Clients"
          value={clientCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          subtext="total assigned"
        />
        <StatsCard
          label="Reviews Removed"
          value={removedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          subtext="completed"
        />
        <StatsCard
          label="My Plan"
          value={planLabel}
          icon={<DollarSign className="h-5 w-5" />}
          subtext={sp?.parent_type === "owner" ? "Owner-direct" : "Reseller team"}
        />
      </div>

      {/* Display price setting */}
      <div className="rounded-md border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Display Price</h2>
        <p className="text-xs text-muted-foreground">
          This is the price shown to clients on your reviews page.
          Current: <span className="text-foreground font-mono">${sp?.display_price_google ?? 1600}</span>/removal
        </p>
        <Link
          href="/dashboard/portal/pricing"
          className="inline-block rounded-sm border border-steel/30 bg-steel/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-steel hover:bg-steel/20"
        >
          Update Pricing
        </Link>
      </div>
    </div>
  )
}
