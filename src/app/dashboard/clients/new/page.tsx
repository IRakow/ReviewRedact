"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewClientPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await createClient(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Add New Client
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enter the client business details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building2 className="h-4 w-4 text-steel" />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Business Information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">
                Name of Client Business <span className="text-blood">*</span>
              </Label>
              <Input
                id="business_name"
                name="business_name"
                required
                placeholder="e.g. Acme Plumbing LLC"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_name">
                Name of Client Owner <span className="text-blood">*</span>
              </Label>
              <Input
                id="owner_name"
                name="owner_name"
                required
                placeholder="e.g. John Smith"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Physical Address of Business <span className="text-blood">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                required
                placeholder="e.g. 123 Main St, Suite 100, Dallas, TX 75201"
                className="bg-background"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Telephone Number</Label>
                <Input
                  id="business_phone"
                  name="business_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_phone">Client Owner Telephone Number</Label>
                <Input
                  id="owner_phone"
                  name="owner_phone"
                  type="tel"
                  placeholder="(555) 987-6543"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_email">Email Address of Client Owner</Label>
              <Input
                id="owner_email"
                name="owner_email"
                type="email"
                placeholder="john@acmeplumbing.com"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_url">
                Google Business URL <span className="text-blood">*</span>
              </Label>
              <Input
                id="google_url"
                name="google_url"
                type="url"
                required
                placeholder="https://www.google.com/maps/place/..."
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-blood/30 bg-blood/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard">
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Creating...
              </>
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
