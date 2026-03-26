"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"
import { updateSalesperson } from "./actions"

const COMMISSION_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export function SalespersonEditForm({
  id,
  parentType,
  baseRateGoogle: initialGoogle,
  displayPriceGoogle: initialDisplay,
  pricingPlan: initialPlan,
  isActive: initialActive,
  commissionPlanType: initialCommission,
  commissionPlanConfig: initialConfig,
}: {
  id: string
  parentType: string
  baseRateGoogle: number
  displayPriceGoogle: number | null
  pricingPlan: string | null
  isActive: boolean
  commissionPlanType: string | null
  commissionPlanConfig: Record<string, number> | null
}) {
  const [baseRateGoogle, setBaseRateGoogle] = useState(initialGoogle)
  const [displayPriceGoogle, setDisplayPriceGoogle] = useState(initialDisplay ?? 0)
  const [pricingPlan, setPricingPlan] = useState(initialPlan ?? "")
  const [isActive, setIsActive] = useState(initialActive)
  const [commissionPlanType, setCommissionPlanType] = useState(initialCommission ?? "")
  const [splitSpPct, setSplitSpPct] = useState(initialConfig?.split_sp_pct ?? 0)
  const [spMarginPct, setSpMarginPct] = useState(initialConfig?.sp_margin_pct ?? 0)
  const [spFlatFee, setSpFlatFee] = useState(initialConfig?.sp_flat_fee ?? 0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  const inputCls =
    "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
  const labelCls =
    "block text-[10px] font-medium uppercase tracking-widest text-muted-foreground"

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")

    const formData = new FormData()
    formData.set("base_rate_google", String(baseRateGoogle))
    formData.set("display_price_google", String(displayPriceGoogle))
    formData.set("is_active", String(isActive))
    if (pricingPlan) formData.set("pricing_plan", pricingPlan)
    if (commissionPlanType) formData.set("commission_plan_type", commissionPlanType)
    formData.set("split_sp_pct", String(splitSpPct))
    formData.set("sp_margin_pct", String(spMarginPct))
    formData.set("sp_flat_fee", String(spFlatFee))

    startTransition(async () => {
      const result = await updateSalesperson(id, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Salesperson updated")
        setTimeout(() => setSuccess(""), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Edit Salesperson</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Base Rate Google ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={baseRateGoogle}
              onChange={(e) => setBaseRateGoogle(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Display Price Google ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={displayPriceGoogle}
              onChange={(e) => setDisplayPriceGoogle(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        {parentType === "owner" && (
          <div className="space-y-1.5">
            <label className={labelCls}>Pricing Plan</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPricingPlan("owner_plan_a")}
                className={`rounded-sm border px-4 py-2 text-xs font-medium transition-all ${
                  pricingPlan === "owner_plan_a"
                    ? "border-steel/50 bg-steel/10 text-steel"
                    : "border-border bg-surface text-muted-foreground hover:border-steel/30"
                }`}
              >
                Plan A ($750)
              </button>
              <button
                type="button"
                onClick={() => setPricingPlan("owner_plan_b")}
                className={`rounded-sm border px-4 py-2 text-xs font-medium transition-all ${
                  pricingPlan === "owner_plan_b"
                    ? "border-steel/50 bg-steel/10 text-steel"
                    : "border-border bg-surface text-muted-foreground hover:border-steel/30"
                }`}
              >
                Plan B ($1K+)
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={labelCls}>Status</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`rounded-sm border px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-surface text-muted-foreground hover:border-steel/30"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`rounded-sm border px-4 py-2 text-xs font-medium transition-all ${
                !isActive
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-border bg-surface text-muted-foreground hover:border-steel/30"
              }`}
            >
              Paused
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Commission Plan Override</label>
          <select
            value={commissionPlanType}
            onChange={(e) => setCommissionPlanType(e.target.value)}
            className={inputCls}
          >
            <option value="">Global (from reseller)</option>
            {Object.entries(COMMISSION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {commissionPlanType === "base_split" && (
          <div className="space-y-1.5">
            <label className={labelCls}>SP Split % (of overage)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={splitSpPct}
              onChange={(e) => setSplitSpPct(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        )}

        {commissionPlanType === "percentage" && (
          <div className="space-y-1.5">
            <label className={labelCls}>SP Margin % (above BTS base)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={spMarginPct}
              onChange={(e) => setSpMarginPct(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        )}

        {commissionPlanType === "flat_fee" && (
          <div className="space-y-1.5">
            <label className={labelCls}>SP Flat Fee ($)</label>
            <input
              type="number"
              min={0}
              value={spFlatFee}
              onChange={(e) => setSpFlatFee(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        )}

        {error && (
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">{success}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30"
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
