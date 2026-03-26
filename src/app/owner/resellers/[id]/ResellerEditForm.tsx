"use client"

import { useState, useTransition } from "react"
import { Save, KeyRound } from "lucide-react"
import { updateReseller, resetResellerPin } from "./actions"

const PLAN_LABELS: Record<string, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

export function ResellerEditForm({
  id,
  baseRateGoogle: initialGoogle,
  baseRateFacebook: initialFacebook,
  isActive: initialActive,
  commissionPlanType: initialPlan,
  commissionPlanConfig: initialConfig,
}: {
  id: string
  baseRateGoogle: number
  baseRateFacebook: number
  isActive: boolean
  commissionPlanType: string
  commissionPlanConfig: Record<string, number> | null
}) {
  const [baseRateGoogle, setBaseRateGoogle] = useState(initialGoogle)
  const [baseRateFacebook, setBaseRateFacebook] = useState(initialFacebook)
  const [isActive, setIsActive] = useState(initialActive)
  const [commissionPlanType, setCommissionPlanType] = useState(initialPlan)
  const [splitSpPct, setSplitSpPct] = useState(initialConfig?.split_sp_pct ?? 0)
  const [spMarginPct, setSpMarginPct] = useState(initialConfig?.sp_margin_pct ?? 0)
  const [spFlatFee, setSpFlatFee] = useState(initialConfig?.sp_flat_fee ?? 0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()
  const [resetResult, setResetResult] = useState("")
  const [resetting, setResetting] = useState(false)

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
    formData.set("base_rate_facebook", String(baseRateFacebook))
    formData.set("is_active", String(isActive))
    formData.set("commission_plan_type", commissionPlanType)
    formData.set("split_sp_pct", String(splitSpPct))
    formData.set("sp_margin_pct", String(spMarginPct))
    formData.set("sp_flat_fee", String(spFlatFee))

    startTransition(async () => {
      const result = await updateReseller(id, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Reseller updated")
        setTimeout(() => setSuccess(""), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Edit Reseller</h2>
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
            <label className={labelCls}>Base Rate Facebook ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={baseRateFacebook}
              onChange={(e) => setBaseRateFacebook(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

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
          <label className={labelCls}>Commission Plan</label>
          <select
            value={commissionPlanType}
            onChange={(e) => setCommissionPlanType(e.target.value)}
            className={inputCls}
          >
            {Object.entries(PLAN_LABELS).map(([value, label]) => (
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={async () => {
              if (!confirm("Reset this reseller's access code? A new code will be emailed to them.")) return
              setResetting(true)
              setResetResult("")
              const result = await resetResellerPin(id)
              if (result.error) {
                setResetResult(`Error: ${result.error}`)
              } else {
                setResetResult(`New code: ${result.pin_code}`)
              }
              setResetting(false)
            }}
            className="inline-flex items-center gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-30"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {resetting ? "Resetting..." : "Reset PIN"}
          </button>
        </div>

        {resetResult && (
          <p className={`text-xs font-medium uppercase tracking-wider font-mono ${resetResult.startsWith("Error") ? "text-red-400" : "text-amber-400"}`}>
            {resetResult}
          </p>
        )}
      </div>
    </form>
  )
}
