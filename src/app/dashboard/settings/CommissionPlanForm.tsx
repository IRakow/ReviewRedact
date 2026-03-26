"use client"

import { useState } from "react"
import type { CommissionPlanType, CommissionPlanConfig } from "@/lib/types"

const PLAN_LABELS: Record<CommissionPlanType, string> = {
  fixed: "Fixed",
  base_split: "Base + Split",
  percentage: "Percentage",
  flat_fee: "Flat Fee",
}

const PLAN_DESCRIPTIONS: Record<CommissionPlanType, string> = {
  fixed: "SP earns the difference between their display price and your base rate",
  base_split: "SP earns a percentage of the overage above the BTS base rate",
  percentage: "SP earns a percentage of the margin above the BTS base",
  flat_fee: "SP earns a flat dollar amount per deal",
}

export function CommissionPlanForm({
  currentType,
  currentConfig,
  onSave,
}: {
  currentType: CommissionPlanType
  currentConfig: CommissionPlanConfig
  onSave: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}) {
  const [selectedType, setSelectedType] = useState<CommissionPlanType>(currentType)
  const [splitPct, setSplitPct] = useState(currentConfig.split_sp_pct ?? 50)
  const [marginPct, setMarginPct] = useState(currentConfig.sp_margin_pct ?? 50)
  const [flatFee, setFlatFee] = useState(currentConfig.sp_flat_fee ?? 100)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const config: CommissionPlanConfig = {}
    if (selectedType === "base_split") config.split_sp_pct = splitPct
    if (selectedType === "percentage") config.sp_margin_pct = marginPct
    if (selectedType === "flat_fee") config.sp_flat_fee = flatFee

    const fd = new FormData()
    fd.set("plan_type", selectedType)
    fd.set("config", JSON.stringify(config))

    const result = await onSave(fd)
    setSaving(false)

    if (result?.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Commission plan updated" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Plan type radio buttons */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(PLAN_LABELS) as CommissionPlanType[]).map((type) => (
          <label
            key={type}
            className={`flex cursor-pointer flex-col rounded-md border p-4 transition-all ${
              selectedType === type
                ? "border-steel/50 bg-steel/5"
                : "border-border bg-surface hover:border-border/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="plan_type"
                value={type}
                checked={selectedType === type}
                onChange={() => setSelectedType(type)}
                className="accent-steel"
              />
              <span className="text-sm font-medium text-foreground">{PLAN_LABELS[type]}</span>
            </div>
            <p className="mt-1 pl-5 text-[11px] text-muted-foreground">{PLAN_DESCRIPTIONS[type]}</p>
          </label>
        ))}
      </div>

      {/* Conditional config inputs */}
      {selectedType === "base_split" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">SP Overage Split %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={splitPct}
            onChange={(e) => setSplitPct(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
          />
          <p className="text-[11px] text-muted-foreground">
            Salesperson keeps {splitPct}% of the overage above the BTS base rate
          </p>
        </div>
      )}

      {selectedType === "percentage" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">SP Margin %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={marginPct}
            onChange={(e) => setMarginPct(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
          />
          <p className="text-[11px] text-muted-foreground">
            Salesperson earns {marginPct}% of the margin above BTS base
          </p>
        </div>
      )}

      {selectedType === "flat_fee" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">SP Flat Fee ($)</label>
          <input
            type="number"
            min={0}
            value={flatFee}
            onChange={(e) => setFlatFee(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
          />
          <p className="text-[11px] text-muted-foreground">
            Salesperson earns a flat ${flatFee} per deal
          </p>
        </div>
      )}

      {/* Feedback message */}
      {message && (
        <p className={`text-xs font-medium ${message.type === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {message.text}
        </p>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-steel hover:bg-steel/20 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Commission Plan"}
      </button>
    </form>
  )
}
