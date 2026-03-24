"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { BASE_RATE_GOOGLE, BASE_RATE_FACEBOOK } from "@/lib/constants"
import { createReseller, updateReseller } from "@/app/admin/actions"
import type { Reseller } from "@/lib/types"
import { Copy, Check, Loader2 } from "lucide-react"

interface ResellerFormProps {
  initialData?: Reseller
  mode: "create" | "edit"
}

export function ResellerForm({ initialData, mode }: ResellerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdPin, setCreatedPin] = useState<string | null>(null)
  const [pinCopied, setPinCopied] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (mode === "create") {
        const result = await createReseller(formData)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.data) {
          setCreatedPin(result.data.pin_code)
        }
      } else if (initialData) {
        const result = await updateReseller(initialData.id, formData)
        if (result.error) {
          setError(result.error)
          return
        }
        router.push(`/admin/resellers/${initialData.id}`)
      }
    })
  }

  async function handleCopyPin() {
    if (!createdPin) return
    await navigator.clipboard.writeText(createdPin)
    setPinCopied(true)
    setTimeout(() => setPinCopied(false), 2000)
  }

  function handlePinDialogClose() {
    setCreatedPin(null)
    router.push("/admin")
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">
              Name *
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name ?? ""}
              placeholder="Full name"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
              Email *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialData?.email ?? ""}
              placeholder="email@example.com"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cell" className="text-xs uppercase tracking-widest text-muted-foreground">
              Cell *
            </Label>
            <Input
              id="cell"
              name="cell"
              type="tel"
              required
              defaultValue={initialData?.cell ?? ""}
              placeholder="(555) 123-4567"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-xs uppercase tracking-widest text-muted-foreground">
              Company Name
            </Label>
            <Input
              id="company"
              name="company"
              defaultValue={initialData?.company ?? ""}
              placeholder="Company name"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="text-xs uppercase tracking-widest text-muted-foreground">
              Address
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData?.address ?? ""}
              placeholder="Full address"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id_1099" className="text-xs uppercase tracking-widest text-muted-foreground">
              1099 Tax ID
            </Label>
            <Input
              id="tax_id_1099"
              name="tax_id_1099"
              defaultValue={initialData?.tax_id_1099 ?? ""}
              placeholder="XX-XXXXXXX"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            {/* Spacer for grid alignment */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_rate_google" className="text-xs uppercase tracking-widest text-muted-foreground">
              Base Rate Google ($)
            </Label>
            <Input
              id="base_rate_google"
              name="base_rate_google"
              type="number"
              min={0}
              step={1}
              defaultValue={initialData?.base_rate_google ?? BASE_RATE_GOOGLE}
              className="bg-surface border-border font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_rate_facebook" className="text-xs uppercase tracking-widest text-muted-foreground">
              Base Rate Facebook ($)
            </Label>
            <Input
              id="base_rate_facebook"
              name="base_rate_facebook"
              type="number"
              min={0}
              step={1}
              defaultValue={initialData?.base_rate_facebook ?? BASE_RATE_FACEBOOK}
              className="bg-surface border-border font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Register Reseller" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>

      <Dialog open={createdPin !== null} onOpenChange={(open) => { if (!open) handlePinDialogClose() }}>
        <DialogContent className="sm:max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Reseller Registered</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share this PIN code with the reseller. They will use it to log in. This is the only time it will be displayed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-md border border-steel/30 bg-steel/5 px-8 py-4">
              <p className="font-mono text-4xl font-bold tracking-[0.3em] text-steel">
                {createdPin}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPin}
              className="gap-2"
            >
              {pinCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy PIN
                </>
              )}
            </Button>
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={handlePinDialogClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
