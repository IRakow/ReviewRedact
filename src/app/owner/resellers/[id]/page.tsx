import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ArrowLeft, Users, Briefcase } from "lucide-react"
import { ResellerEditForm } from "./ResellerEditForm"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export default async function ResellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  const supabase = createServerClient()

  // Fetch reseller
  const { data: reseller } = await supabase
    .from("resellers")
    .select("*")
    .eq("id", id)
    .eq("role", "reseller")
    .single()

  if (!reseller) notFound()

  // Fetch salespeople under this reseller
  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, name, email, is_active")
    .eq("reseller_id", id)
    .order("name")

  const spList = salespeople ?? []

  // Count clients
  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("reseller_id", id)

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/resellers"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
              {reseller.name}
            </h1>
            <StatusBadge status={reseller.is_active ? "active" : "paused"} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {reseller.company ? `${reseller.company} — ` : ""}
            {reseller.email}
            {reseller.cell ? ` — ${reseller.cell}` : ""}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Salespeople" value={spList.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard label="Clients" value={clientCount ?? 0} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard label="Google Rate" value={`$${reseller.base_rate_google}`} />
        <StatsCard label="Facebook Rate" value={`$${reseller.base_rate_facebook}`} />
      </div>

      {/* Info section */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Reseller Info</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 text-sm">
          <div>
            <span className="text-muted-foreground">Address:</span>{" "}
            <span className="text-foreground">{reseller.address ?? "Not set"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tax ID (1099):</span>{" "}
            <span className="font-mono text-foreground">{reseller.tax_id_1099 ?? "Not set"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Commission Plan:</span>{" "}
            <span className="text-foreground">
              {PLAN_LABELS[reseller.commission_plan_type] ?? reseller.commission_plan_type}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            <span className="text-foreground">
              {new Date(reseller.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form (client component) */}
      <ResellerEditForm
        id={id}
        baseRateGoogle={reseller.base_rate_google}
        baseRateFacebook={reseller.base_rate_facebook}
        isActive={reseller.is_active}
        commissionPlanType={reseller.commission_plan_type ?? "fixed"}
        commissionPlanConfig={reseller.commission_plan_config}
      />

      {/* Salespeople table */}
      <div className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Salespeople ({spList.length})
          </h2>
        </div>
        {spList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No salespeople under this reseller
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spList.map((sp) => (
                <tr key={sp.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">{sp.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{sp.email}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sp.is_active ? "active" : "paused"} />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/owner/salespeople/${sp.id}`}
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
