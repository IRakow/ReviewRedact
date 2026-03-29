import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ArrowLeft, Briefcase, DollarSign } from "lucide-react"
import { SalespersonEditForm } from "./SalespersonEditForm"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export default async function SalespersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  const supabase = createServerClient()

  // Fetch salesperson
  const { data: sp } = await supabase
    .from("salespeople")
    .select("*")
    .eq("id", id)
    .single()

  if (!sp) notFound()

  // Get parent reseller name if reseller-type
  let parentName = "Owner-Direct"
  if (sp.parent_type === "reseller" && sp.reseller_id) {
    const { data: reseller } = await supabase
      .from("resellers")
      .select("name")
      .eq("id", sp.reseller_id)
      .single()
    if (reseller) parentName = reseller.name
  }

  // Count clients
  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("salesperson_id", id)

  // Fetch clients for table
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name, owner_name, status, created_at")
    .eq("salesperson_id", id)
    .order("created_at", { ascending: false })

  const clientList = clients ?? []

  function getPlanLabel() {
    if (sp.pricing_plan === "owner_plan_a") return "Plan A ($750)"
    if (sp.pricing_plan === "owner_plan_b") return "Plan B ($1K+)"
    return "Reseller-Set"
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/salespeople"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground truncate">
              {sp.name}
            </h1>
            <StatusBadge status={sp.is_active ? "active" : "paused"} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {sp.email}
            {sp.cell ? ` — ${sp.cell}` : ""}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Clients" value={clientCount ?? 0} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard label="Google Rate" value={`$${sp.base_rate_google}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard
          label="Display Price"
          value={sp.display_price_google ? `$${sp.display_price_google}` : "N/A"}
        />
        <StatsCard label="Plan" value={getPlanLabel()} />
      </div>

      {/* Info section */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Salesperson Info</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 text-sm">
          <div>
            <span className="text-muted-foreground">Parent:</span>{" "}
            <span className="text-foreground">
              {sp.parent_type === "reseller" && sp.reseller_id ? (
                <Link href={`/owner/resellers/${sp.reseller_id}`} className="text-steel hover:text-steel-light">
                  {parentName}
                </Link>
              ) : (
                <span className="text-steel">Owner-Direct</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Company:</span>{" "}
            <span className="text-foreground">{sp.company ?? "Not set"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            <span className="text-foreground">{sp.address ?? "Not set"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tax ID (1099):</span>{" "}
            <span className="font-mono text-foreground">{sp.tax_id_1099 ?? "Not set"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Commission Plan:</span>{" "}
            <span className="text-foreground">
              {sp.commission_plan_type
                ? PLAN_LABELS[sp.commission_plan_type] ?? sp.commission_plan_type
                : "Global (from reseller)"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            <span className="text-foreground">
              {new Date(sp.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <SalespersonEditForm
        id={id}
        parentType={sp.parent_type}
        baseRateGoogle={sp.base_rate_google}
        displayPriceGoogle={sp.display_price_google}
        pricingPlan={sp.pricing_plan}
        isActive={sp.is_active}
        commissionPlanType={sp.commission_plan_type}
        commissionPlanConfig={sp.commission_plan_config}
      />

      {/* Clients table */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Clients ({clientList.length})
          </h2>
        </div>
        {clientList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No clients assigned
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientList.map((c) => (
                <tr key={c.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">{c.business_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.owner_name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/owner/clients/${c.id}`}
                      className="text-xs text-steel hover:text-steel-light"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
