"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { scrapeForProspect, saveProspect } from "./actions"
import {
  Search,
  Star,
  TrendingUp,
  Check,
  ArrowRight,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react"

interface ProspectReview {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
}

interface Impact {
  originalRating: number
  projectedRating: number
  change: number
  removedCount: number
}

export function ProspectFlow() {
  const [url, setUrl] = useState("")
  const [reviews, setReviews] = useState<ProspectReview[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Contact form fields
  const [contactName, setContactName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")

  // Sort reviews worst-first
  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => a.star_rating - b.star_rating),
    [reviews]
  )

  // Compute impact live
  const impact: Impact | null = useMemo(() => {
    if (reviews.length === 0) return null

    const totalStars = reviews.reduce((sum, r) => sum + r.star_rating, 0)
    const originalRating =
      Math.round((totalStars / reviews.length) * 100) / 100

    if (selectedIds.size === 0) {
      return {
        originalRating,
        projectedRating: originalRating,
        change: 0,
        removedCount: 0,
      }
    }

    const remaining = reviews.filter((r) => !selectedIds.has(r.id))
    if (remaining.length === 0) {
      return {
        originalRating,
        projectedRating: 0,
        change: -originalRating,
        removedCount: selectedIds.size,
      }
    }

    const remainingStars = remaining.reduce((sum, r) => sum + r.star_rating, 0)
    const projectedRating =
      Math.round((remainingStars / remaining.length) * 100) / 100

    return {
      originalRating,
      projectedRating,
      change: Math.round((projectedRating - originalRating) * 100) / 100,
      removedCount: selectedIds.size,
    }
  }, [reviews, selectedIds])

  async function handleAnalyze() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setWarning(null)
    setReviews([])
    setSelectedIds(new Set())
    setShowSaveForm(false)
    setSaved(false)
    setSavedId(null)

    try {
      const result = await scrapeForProspect(url.trim())
      setReviews(result.reviews)
      if (result.warning) setWarning(result.warning)

      // Auto-select 1-2 star reviews
      const badReviewIds = new Set(
        result.reviews
          .filter((r) => r.star_rating <= 2)
          .map((r) => r.id)
      )
      setSelectedIds(badReviewIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze reviews")
    } finally {
      setLoading(false)
    }
  }

  function toggleReview(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const result = await saveProspect({
        googleUrl: url,
        contactName: contactName || undefined,
        companyName: companyName || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        reviewSnapshot: reviews.map((r) => ({
          reviewer_name: r.reviewer_name,
          star_rating: r.star_rating,
          review_text: r.review_text,
          review_date: r.review_date,
        })),
        selectedReviewIds: Array.from(selectedIds),
        originalRating: impact?.originalRating ?? 0,
        projectedRating: impact?.projectedRating ?? 0,
      })
      setSaved(true)
      setSavedId(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lead")
    } finally {
      setSaving(false)
    }
  }

  function starColor(rating: number): string {
    if (rating <= 2) return "text-red-400"
    if (rating === 3) return "text-amber-400"
    return "text-emerald-400"
  }

  function renderStars(rating: number, className?: string) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              "h-3.5 w-3.5",
              s <= rating ? starColor(rating) : "text-muted-foreground/30"
            )}
            fill={s <= rating ? "currentColor" : "none"}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — URL Input */}
      <div className="rounded-md border border-border bg-surface p-5">
        <label className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Google Business URL
        </label>
        <div className="flex gap-3">
          <Input
            type="url"
            placeholder="https://www.google.com/maps/place/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnalyze()
            }}
          />
          <Button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-1" />
            )}
            Analyze Reviews
          </Button>
        </div>
        {warning && (
          <p className="mt-2 text-xs text-amber-400">{warning}</p>
        )}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Step 2 — Reviews + Impact */}
      {reviews.length > 0 && !loading && (
        <div className="flex gap-6">
          {/* Left — Review List */}
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Reviews ({reviews.length})
            </p>
            {sortedReviews.map((review) => {
              const isSelected = selectedIds.has(review.id)
              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => toggleReview(review.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                    isSelected
                      ? "border-steel/40 bg-steel/5"
                      : "border-border bg-surface hover:bg-surface-raised"
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                      isSelected
                        ? "border-steel bg-steel text-white"
                        : "border-border bg-background"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {renderStars(review.star_rating)}
                      <span className="text-xs font-medium text-foreground">
                        {review.reviewer_name}
                      </span>
                      {review.review_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {review.review_date}
                        </span>
                      )}
                    </div>
                    {review.review_text && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right — Impact Calculator */}
          <div className="w-80 shrink-0">
            <div className="sticky top-8 rounded-md border border-border bg-surface p-5 space-y-5">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Impact Analysis
              </p>

              {impact && (
                <>
                  {/* Current Rating */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Current Rating
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {impact.originalRating.toFixed(1)}
                      </span>
                      {renderStars(Math.round(impact.originalRating))}
                    </div>
                  </div>

                  {/* After Removal */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      After Removal
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-2xl font-bold",
                          impact.change > 0
                            ? "text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {impact.projectedRating.toFixed(1)}
                      </span>
                      {renderStars(Math.round(impact.projectedRating))}
                    </div>
                  </div>

                  {/* Improvement */}
                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Improvement
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-sm font-semibold",
                        impact.change > 0
                          ? "text-emerald-400"
                          : impact.change < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      )}
                    >
                      {impact.change > 0 && (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                      {impact.change > 0 ? "+" : ""}
                      {impact.change.toFixed(1)}
                    </span>
                  </div>

                  {/* Reviews to Remove */}
                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Reviews to Remove
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {impact.removedCount}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Save Form */}
      {reviews.length > 0 && !loading && !saved && (
        <div className="rounded-md border border-border bg-surface p-5">
          {!showSaveForm ? (
            <Button
              onClick={() => setShowSaveForm(true)}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save as Lead
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Lead Details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Contact Name
                  </label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Company Name
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ABC Plumbing"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Call notes, follow-up details..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-steel"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Lead
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {saved && savedId && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Lead saved successfully</span>
          </div>
          <Link
            href="/dashboard/prospects"
            className="mt-2 inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
          >
            View all leads
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
