"use client"

import { useState } from "react"
import { updateProfile } from "./actions"
import { Lock } from "lucide-react"

interface ProfileFormProps {
  name: string
  company: string | null
  email: string
  cell: string
  address: string | null
  taxId: string | null
}

function maskTaxId(taxId: string | null): string {
  if (!taxId) return "Not provided"
  const cleaned = taxId.replace(/\D/g, "")
  if (cleaned.length < 4) return "***"
  const last4 = cleaned.slice(-4)
  return `***-**-${last4}`
}

export function ProfileForm({ name, company, email, cell, address, taxId }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" })
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Read-only: Name */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          disabled
          className="w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Contact an owner to change your name
        </p>
      </div>

      {/* Editable: Company */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Business Name / Company
        </label>
        <input
          name="company"
          type="text"
          defaultValue={company ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
          placeholder="Your company name"
        />
      </div>

      {/* Editable: Email */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Email
        </label>
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      {/* Editable: Cell Phone */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Cell Phone
        </label>
        <input
          name="cell"
          type="tel"
          defaultValue={cell}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Editable: Address */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Address
        </label>
        <input
          name="address"
          type="text"
          defaultValue={address ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
          placeholder="123 Main St, City, ST 12345"
        />
      </div>

      {/* Read-only: Tax ID (masked) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Tax ID (SSN / EIN)
        </label>
        <div className="flex items-center gap-2 w-full rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
          <span className="text-sm font-mono text-muted-foreground">
            {maskTaxId(taxId)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          Tax ID was captured during W-9 signing and cannot be changed here
        </p>
      </div>

      {/* Message */}
      {message && (
        <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-steel/30 bg-steel/10 px-6 py-2.5 min-h-[44px] text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-steel/30 border-t-steel" />
            Saving
          </span>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  )
}
