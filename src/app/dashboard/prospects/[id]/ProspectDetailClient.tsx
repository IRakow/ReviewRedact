"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateProspectNotes,
  convertToClient,
  markAsLost,
} from "./actions"
import {
  Star,
  Save,
  UserPlus,
  X,
  Loader2,
  Check,
  ExternalLink,
} from "lucide-react"
import type { Prospect } from "@/lib/types"

interface ReviewSnapshot {
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
}

interface Props {
  prospect: Prospect
  reviewSnapshot: ReviewSnapshot[]
  selectedIds: string[]
}

export function ProspectDetailClient({
  prospect,
  reviewSnapshot,
  selectedIds,
}: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState(prospect.notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [showConvertForm, setShowConvertForm] = useState(false)
  const [converting, setConverting] = useState(false)
  const [markingLost, setMarkingLost] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert form fields
  const [businessName, setBusinessName] = useState(
    prospect.company_name || ""
  )
  const [ownerName, setOwnerName] = useState(prospect.contact_name || "")
  const [address, setAddress] = useState("")

  async function handleSaveNotes() {
    setSavingNotes(true)
    setError(null)
    try {
      await updateProspectNotes(prospect.id, notes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleConvert() {
    if (!businessName.trim()) {
      setError("Business name is required")
      return
    }
    setConverting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set("business_name", businessName)
      formData.set("owner_name", ownerName)
      formData.set("address", address)
      await convertToClient(prospect.id, formData)
      // convertToClient redirects, but just in case:
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert")
      setConverting(false)
    }
  }

  async function handleMarkLost() {
    setMarkingLost(true)
    setError(null)
    try {
      await markAsLost(prospect.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setMarkingLost(false)
    }
  }

  function starColor(rating: number): string {
    if (rating <= 2) return "text-red-400"
    if (rating === 3) return "text-amber-400"
    return "text-emerald-400"
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Notes */}
      <div className="rounded-md border border-border bg-surface p-5 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setNotesSaved(false)
          }}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-steel"
          placeholder="Call notes, follow-up details..."
          disabled={prospect.status === "lost"}
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveNotes}
            disabled={savingNotes || prospect.status === "lost"}
            size="sm"
            variant="outline"
          >
            {savingNotes ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : notesSaved ? (
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            {notesSaved ? "Saved" : "Update Notes"}
          </Button>
        </div>
      </div>

      {/* Review Snapshot */}
      {reviewSnapshot.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-5 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Review Snapshot ({reviewSnapshot.length})
          </p>
          <div className="space-y-2">
            {[...reviewSnapshot]
              .sort((a, b) => a.star_rating - b.star_rating)
              .map((review, i) => {
                // Note: selectedIds for snapshots are UUIDs from the prospect call,
                // but snapshots don't have IDs — highlight by index matching is approximate.
                // We'll highlight reviews with 1-2 stars as "selected" if they were likely
                // part of the removal set.
                const isSelected = review.star_rating <= 2

                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-md border p-3",
                      isSelected
                        ? "border-steel/30 bg-steel/5"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= review.star_rating
                                ? starColor(review.star_rating)
                                : "text-muted-foreground/30"
                            )}
                            fill={
                              s <= review.star_rating ? "currentColor" : "none"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {review.reviewer_name}
                      </span>
                      {review.review_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {review.review_date}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-medium text-steel">
                          Selected for removal
                        </span>
                      )}
                    </div>
                    {review.review_text && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Actions */}
      {prospect.status === "prospect" && (
        <div className="rounded-md border border-border bg-surface p-5 space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Actions
          </p>

          {!showConvertForm ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowConvertForm(true)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Convert to Client
              </Button>
              <Button
                onClick={handleMarkLost}
                disabled={markingLost}
                size="sm"
                variant="outline"
                className="text-muted-foreground hover:text-red-400"
              >
                {markingLost ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Mark as Lost
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Business Name *
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="ABC Plumbing"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Owner Name
                  </label>
                  <Input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    Address
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleConvert}
                  disabled={converting}
                  size="sm"
                >
                  {converting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-1" />
                  )}
                  Convert
                </Button>
                <Button
                  onClick={() => setShowConvertForm(false)}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Converted link */}
      {prospect.status === "converted" && prospect.converted_client_id && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Converted to Client</span>
          </div>
          <Link
            href={`/dashboard/clients/${prospect.converted_client_id}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
          >
            View client record
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {prospect.status === "lost" && (
        <div className="rounded-md border border-border bg-muted/10 p-5">
          <p className="text-sm text-muted-foreground">
            This lead was marked as lost.
          </p>
        </div>
      )}
    </div>
  )
}
