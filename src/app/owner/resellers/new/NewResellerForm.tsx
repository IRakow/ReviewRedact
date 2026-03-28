"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createReseller } from "./actions"
import { ArrowLeft } from "lucide-react"
import type { CommissionPlanType } from "@/lib/types"

const PLAN_OPTIONS: { value: CommissionPlanType; label: string; description: string }[] = [
  { value: "fixed", label: "Fixed", description: "Reseller charges their own rate. BTS base is fixed." },
  { value: "base_split", label: "Base Split", description: "Reseller and salesperson split overage above BTS base by percentage." },
  { value: "percentage", label: "Percentage", description: "Salesperson gets a percentage of margin above BTS base." },
  { value: "flat_fee", label: "Flat Fee", description: "Salesperson gets a flat dollar amount per deal." },
]

export default function NewResellerForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [createdPin, setCreatedPin] = useState("")
  const [planType, setPlanType] = useState<CommissionPlanType>("fixed")
  const [splitPct, setSplitPct] = useState(50)
  const [marginPct, setMarginPct] = useState(50)
  const [flatFee, setFlatFee] = useState(100)
  const [isPending, startTransition] = useTransition()

  function buildCommissionConfig(): string {
    switch (planType) {
      case "base_split":
        return JSON.stringify({ split_sp_pct: splitPct })
      case "percentage":
        return JSON.stringify({ sp_margin_pct: marginPct })
      case "flat_fee":
        return JSON.stringify({ sp_flat_fee: flatFee })
      default:
        return "{}"
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    formData.set("commission_plan_type", planType)
    formData.set("commission_plan_config", buildCommissionConfig())

    startTransition(async () => {
      const result = await createReseller(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.pin_code) {
        setCreatedPin(result.pin_code)
      }
    })
  }

  if (createdPin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-emerald-400">Reseller Created</h2>
          <p className="text-sm text-muted-foreground">
            Share this PIN with the new reseller.
          </p>
          <div className="rounded-sm border border-steel/30 bg-surface px-6 py-4 font-mono text-3xl tracking-[0.5em] text-foreground">
            {createdPin}
          </div>
          <p className="text-xs text-muted-foreground">
            Commission plan: <span className="text-foreground capitalize">{planType.replace("_", " ")}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            They must sign the W-9 and Contractor Agreement on first login.
          </p>
          <button
            onClick={() => router.push("/owner/resellers")}
            className="rounded-sm border border-steel/30 bg-steel/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-steel hover:bg-steel/20"
          >
            Back to Resellers
          </button>
        </div>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/resellers" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Add Reseller
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a new reseller partner
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Full Name *
          </label>
          <input name="name" type="text" required className={inputClass} />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Email *
          </label>
          <input name="email" type="email" required className={inputClass} />
        </div>

        {/* Cell Phone */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Cell Phone *
          </label>
          <input name="cell" type="tel" required className={inputClass} />
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Company
          </label>
          <input name="company" type="text" className={inputClass} />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Address
          </label>
          <input name="address" type="text" className={inputClass} />
        </div>

        {/* Base Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Base Rate Google
            </label>
            <input name="base_rate_google" type="number" defaultValue={850} min={0} step={1} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Base Rate Facebook
            </label>
            <input name="base_rate_facebook" type="number" defaultValue={500} min={0} step={1} className={inputClass} />
          </div>
        </div>

        {/* Commission Plan Type */}
        <div className="space-y-2">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Commission Plan Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlanType(opt.value)}
                className={`rounded-md border p-4 text-left transition-all ${
                  planType === opt.value
                    ? "border-steel/50 bg-steel/5"
                    : "border-border bg-surface hover:border-steel/30"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Conditional commission config inputs */}
        {planType === "base_split" && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Salesperson Split % (of overage)
            </label>
            <input
              type="number"
              value={splitPct}
              onChange={(e) => setSplitPct(Number(e.target.value))}
              min={0}
              max={100}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">
              Salesperson gets {splitPct}% of the amount above BTS base. Reseller keeps {100 - splitPct}%.
            </p>
          </div>
        )}

        {planType === "percentage" && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Salesperson Margin % (of margin above base)
            </label>
            <input
              type="number"
              value={marginPct}
              onChange={(e) => setMarginPct(Number(e.target.value))}
              min={0}
              max={100}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">
              Salesperson gets {marginPct}% of margin above BTS base rate.
            </p>
          </div>
        )}

        {planType === "flat_fee" && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Salesperson Flat Fee ($)
            </label>
            <input
              type="number"
              value={flatFee}
              onChange={(e) => setFlatFee(Number(e.target.value))}
              min={0}
              step={1}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">
              Salesperson gets ${flatFee} flat per deal.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30"
        >
          {isPending ? "Creating..." : "Create Reseller"}
        </button>
      </form>
    </div>
  )
}
