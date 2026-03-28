"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createDirectSalesperson } from "./actions"
import { ArrowLeft } from "lucide-react"

export default function NewDirectSalespersonPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [createdPin, setCreatedPin] = useState("")
  const [createdName, setCreatedName] = useState("")
  const [plan, setPlan] = useState<"owner_plan_a" | "owner_plan_b">("owner_plan_a")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    formData.set("pricing_plan", plan)

    startTransition(async () => {
      const result = await createDirectSalesperson(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.pin_code) {
        setCreatedPin(result.pin_code)
        setCreatedName((formData.get("name") as string) ?? "")
      }
    })
  }

  if (createdPin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-emerald-400">Direct Salesperson Created</h2>
          <p className="text-sm text-muted-foreground">
            Credentials have been emailed to the new salesperson.
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Access Code
            </p>
            <div className="rounded-sm border border-steel/30 bg-surface px-6 py-4 font-mono text-3xl tracking-[0.5em] text-foreground">
              {createdPin}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Username: <span className="text-foreground font-medium">{createdName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Plan: <span className="text-foreground">{plan === "owner_plan_a" ? "Plan A" : "Plan B"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            They must complete their profile and sign documents on first login.
          </p>
          <button
            onClick={() => router.push("/owner/salespeople")}
            className="rounded-sm border border-steel/30 bg-steel/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-steel hover:bg-steel/20"
          >
            Back to Salespeople
          </button>
        </div>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/salespeople" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Add Direct Salesperson
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the basics — they will complete onboarding on first login
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Full Name
          </label>
          <input name="name" type="text" required placeholder="First Last" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input name="email" type="email" required placeholder="email@example.com" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Cell Phone
          </label>
          <input name="cell" type="tel" required placeholder="(555) 555-5555" className={inputClass} />
        </div>

        {/* Pricing plan selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Pricing Plan
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlan("owner_plan_a")}
              className={`rounded-md border p-4 text-left transition-all ${
                plan === "owner_plan_a"
                  ? "border-steel/50 bg-steel/5"
                  : "border-border bg-surface hover:border-steel/30"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">Plan A</p>
              <p className="text-xs text-muted-foreground mt-1">
                $750 flat per removal. Max client charge: $1,000.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("owner_plan_b")}
              className={`rounded-md border p-4 text-left transition-all ${
                plan === "owner_plan_b"
                  ? "border-steel/50 bg-steel/5"
                  : "border-border bg-surface hover:border-steel/30"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">Plan B</p>
              <p className="text-xs text-muted-foreground mt-1">
                $1,000 base to BTS. Keep everything above.
              </p>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30"
        >
          {isPending ? "Creating..." : "Create Direct Salesperson"}
        </button>
      </form>
    </div>
  )
}
