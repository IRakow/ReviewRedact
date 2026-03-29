"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateDisplayPrice } from "./actions"
import { ArrowLeft } from "lucide-react"

export default function PricingPage() {
  const router = useRouter()
  const [price, setPrice] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const numPrice = Number(price)
    if (!numPrice || numPrice < 0) {
      setError("Enter a valid price")
      return
    }

    startTransition(async () => {
      const result = await updateDisplayPrice(numPrice)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push("/dashboard/portal")
    })
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/portal" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
            Update Display Price
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the price shown to your clients per removal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Price Per Removal ($)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
            placeholder="1600"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel hover:bg-steel/20 disabled:opacity-30"
        >
          {isPending ? "Saving..." : "Save Price"}
        </button>
      </form>
    </div>
  )
}
