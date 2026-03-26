import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, ArrowLeft, Plus, UserCheck, UserX, Settings2 } from "lucide-react"
import { CommissionPlanForm } from "./CommissionPlanForm"
import { updateGlobalCommissionPlan } from "./actions"
import { ResetSpPinButton } from "./ResetSpPinButton"
import type { CommissionPlanType, CommissionPlanConfig } from "@/lib/types"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export default async function ResellerSettingsPage() {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type !== "reseller") redirect("/dashboard")

  const supabase = createServerClient()

  // Fetch reseller commission plan
  const { data: reseller } = await supabase
    .from("resellers")
    .select("commission_plan_type, commission_plan_config")
    .eq("id", session.user_id)
    .single()

  const planType: CommissionPlanType = reseller?.commission_plan_type ?? "fixed"
  const planConfig: CommissionPlanConfig = reseller?.commission_plan_config ?? {}

  // Fetch salespeople under this reseller
  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, name, email, cell, base_rate_google, display_price_google, is_active, commission_plan_type, commission_plan_config, created_at")
    .eq("reseller_id", session.user_id)
    .order("created_at", { ascending: false })

  const spList = salespeople ?? []
  const activeCount = spList.filter((s) => s.is_active).length

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your salespeople and rates
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          label="Salespeople"
          value={spList.length}
          icon={<Users className="h-5 w-5" />}
          subtext={`${activeCount} active`}
        />
        <StatsCard
          label="Base Rate"
          value={`$850`}
          icon={<DollarSign className="h-5 w-5" />}
          subtext="per GMB removal"
        />
      </div>

      {/* Commission Plan */}
      <div className="rounded-md border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Settings2 className="h-4 w-4 text-steel" />
          <h2 className="text-sm font-semibold text-foreground">Commission Plan</h2>
        </div>
        <div className="px-5 py-4">
          <p className="mb-4 text-xs text-muted-foreground">
            Set the default commission structure for all salespeople. Individual overrides can be set per salesperson.
          </p>
          <CommissionPlanForm
            currentType={planType}
            currentConfig={planConfig}
            onSave={updateGlobalCommissionPlan}
          />
        </div>
      </div>

      {/* Salespeople table */}
      <div className="rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Your Salespeople</h2>
          <Link href="/dashboard/settings/salespeople/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Salesperson
            </Button>
          </Link>
        </div>

        {spList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No salespeople yet</p>
            <Link href="/dashboard/settings/salespeople/new">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add your first salesperson
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Base Rate</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spList.map((sp) => (
                <tr key={sp.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {sp.is_active ? (
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground">{sp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{sp.email}</td>
                  <td className="px-5 py-3 font-mono text-foreground">${sp.base_rate_google}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-muted-foreground">
                      {sp.commission_plan_type
                        ? PLAN_LABELS[sp.commission_plan_type] ?? sp.commission_plan_type
                        : "Global"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sp.is_active ? "active" : "paused"} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ResetSpPinButton spId={sp.id} spName={sp.name} />
                      <Link
                        href={`/dashboard/settings/salespeople/${sp.id}`}
                        className="text-xs text-steel hover:text-steel-light transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
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
