"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClientAsOwner } from "./actions"

interface ResellerOption {
  id: string
  name: string
}

interface SpOption {
  id: string
  name: string
  reseller_id: string | null
}

export default function OwnerNewClientPage() {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [resellers, setResellers] = useState<ResellerOption[]>([])
  const [salespeople, setSalespeople] = useState<SpOption[]>([])
  const [selectedReseller, setSelectedReseller] = useState("")
  const [selectedSp, setSelectedSp] = useState("")

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/owner/team-options")
      if (res.ok) {
        const data = await res.json()
        setResellers(data.resellers ?? [])
        setSalespeople(data.salespeople ?? [])
      }
    }
    load()
  }, [])

  const filteredSalespeople = selectedReseller
    ? salespeople.filter((sp) => sp.reseller_id === selectedReseller)
    : salespeople.filter((sp) => !sp.reseller_id) // owner-direct only when no reseller selected

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    if (selectedReseller) formData.set("reseller_id", selectedReseller)
    if (selectedSp) formData.set("salesperson_id", selectedSp)

    startTransition(async () => {
      const result = await createClientAsOwner(formData)
      if (result?.error) {
        setError(result.error)
      }
      // On success, the action redirects to /owner/clients/[id]
    })
  }

  const inputCls =
    "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
  const labelCls =
    "block text-[10px] font-medium uppercase tracking-widest text-muted-foreground"

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/clients"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
            Add Client
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new client as owner
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Business Name *</label>
          <input name="business_name" type="text" required className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Owner Name *</label>
          <input name="owner_name" type="text" required className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Address *</label>
          <input name="address" type="text" required className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Google Maps URL *</label>
          <input name="google_url" type="url" required className={inputCls} placeholder="https://maps.google.com/..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Business Phone</label>
            <input name="business_phone" type="tel" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Owner Phone</label>
            <input name="owner_phone" type="tel" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Owner Email</label>
          <input name="owner_email" type="email" className={inputCls} />
        </div>

        {/* Assignment */}
        <div className="rounded-md border border-border bg-surface p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Assignment (optional)
          </p>

          <div className="space-y-1.5">
            <label className={labelCls}>Assign to Reseller</label>
            <select
              value={selectedReseller}
              onChange={(e) => {
                setSelectedReseller(e.target.value)
                setSelectedSp("")
              }}
              className={inputCls}
            >
              <option value="">Owner-Direct (no reseller)</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Assign to Salesperson</label>
            <select
              value={selectedSp}
              onChange={(e) => setSelectedSp(e.target.value)}
              className={inputCls}
            >
              <option value="">No salesperson</option>
              {filteredSalespeople.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
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
          {isPending ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  )
}
