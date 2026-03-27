"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  scrapeForDirectSale,
  createDirectSale,
  generateDirectSaleContract,
} from "./actions"
import {
  Search,
  Star,
  TrendingUp,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  DollarSign,
  FileText,
  Mail,
  Download,
  CheckCircle,
  ExternalLink,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

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

type Step = 1 | 2 | 3 | 4

const STEP_LABELS: Record<Step, string> = {
  1: "Business Info",
  2: "Select Reviews",
  3: "Set Price",
  4: "Contract",
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DirectSaleFlow() {
  // Step tracking
  const [step, setStep] = useState<Step>(1)

  // Step 1 — Business info
  const [businessName, setBusinessName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [googleUrl, setGoogleUrl] = useState("")

  // Step 2 — Reviews
  const [reviews, setReviews] = useState<ProspectReview[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [scraping, setScraping] = useState(false)

  // Step 3 — Pricing
  const [totalPrice, setTotalPrice] = useState("")
  const [pricingMode, setPricingMode] = useState<"total" | "per_review">("total")
  const [notes, setNotes] = useState("")

  // Step 4 — Contract
  const [saving, setSaving] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Errors
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Sorted reviews (worst first)
  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => a.star_rating - b.star_rating),
    [reviews],
  )

  // Impact calculator
  const impact: Impact | null = useMemo(() => {
    if (reviews.length === 0) return null

    const totalStars = reviews.reduce((sum, r) => sum + r.star_rating, 0)
    const originalRating =
      Math.round((totalStars / reviews.length) * 100) / 100

    if (selectedIds.size === 0) {
      return { originalRating, projectedRating: originalRating, change: 0, removedCount: 0 }
    }

    const remaining = reviews.filter((r) => !selectedIds.has(r.id))
    if (remaining.length === 0) {
      return { originalRating, projectedRating: 0, change: -originalRating, removedCount: selectedIds.size }
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

  // Computed price values
  const priceNum = parseFloat(totalPrice) || 0
  const effectiveTotal =
    pricingMode === "per_review" ? priceNum * selectedIds.size : priceNum
  const effectivePerReview =
    pricingMode === "total"
      ? selectedIds.size > 0
        ? priceNum / selectedIds.size
        : 0
      : priceNum

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleScrape() {
    if (!googleUrl.trim()) return
    setScraping(true)
    setError(null)
    setWarning(null)
    setReviews([])
    setSelectedIds(new Set())

    try {
      const result = await scrapeForDirectSale(googleUrl.trim())
      setReviews(result.reviews)
      if (result.warning) setWarning(result.warning)

      // Auto-select 1-2 star reviews
      const badIds = new Set(
        result.reviews.filter((r) => r.star_rating <= 2).map((r) => r.id),
      )
      setSelectedIds(badIds)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape reviews")
    } finally {
      setScraping(false)
    }
  }

  function toggleReview(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreateAndGenerate() {
    if (selectedIds.size === 0) return
    setSaving(true)
    setError(null)

    try {
      // 1. Create client + contract
      const result = await createDirectSale({
        businessName,
        contactName,
        email,
        phone: phone || undefined,
        address: address || undefined,
        googleUrl,
        reviewSnapshot: reviews.map((r) => ({
          reviewer_name: r.reviewer_name,
          star_rating: r.star_rating,
          review_text: r.review_text,
          review_date: r.review_date,
        })),
        selectedReviewIds: Array.from(selectedIds),
        totalPrice: effectiveTotal,
        pricePerReview: effectivePerReview,
        notes: notes || undefined,
      })

      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }

      setClientId(result.clientId)
      setContractId(result.contractId)

      // 2. Generate PDF
      setGeneratingPdf(true)
      const pdfResult = await generateDirectSaleContract(result.contractId)
      if (pdfResult.error) {
        setError(pdfResult.error)
      } else {
        setPdfBase64(pdfResult.pdf || null)
        setPdfFilename(pdfResult.filename || null)
      }
      setGeneratingPdf(false)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sale")
    } finally {
      setSaving(false)
    }
  }

  async function handleEmailContract() {
    if (!clientId || !pdfBase64 || !pdfFilename) return
    setEmailing(true)
    setError(null)

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          pdf_base64: pdfBase64,
          filename: pdfFilename,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to send email")
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setEmailing(false)
    }
  }

  function handleDownloadPdf() {
    if (!pdfBase64 || !pdfFilename) return
    const blob = new Blob(
      [Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = pdfFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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
              s <= rating ? starColor(rating) : "text-muted-foreground/30",
            )}
            fill={s <= rating ? "currentColor" : "none"}
          />
        ))}
      </div>
    )
  }

  const inputCls =
    "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
  const labelCls =
    "block text-[10px] font-medium uppercase tracking-widest text-muted-foreground"

  // ─── Step Indicator ───────────────────────────────────────────────────────

  function StepIndicator() {
    return (
      <div className="flex items-center gap-1 mb-6">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              type="button"
              disabled={s > step}
              onClick={() => {
                if (s < step) setStep(s)
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                s === step
                  ? "bg-steel/15 text-steel border border-steel/30"
                  : s < step
                    ? "bg-surface text-foreground border border-border cursor-pointer hover:bg-surface-raised"
                    : "bg-surface/50 text-muted-foreground/50 border border-border/50 cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  s === step
                    ? "bg-steel text-white"
                    : s < step
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground/50",
                )}
              >
                {s < step ? <Check className="h-3 w-3" /> : s}
              </span>
              {STEP_LABELS[s]}
            </button>
            {i < 3 && (
              <div
                className={cn(
                  "mx-1 h-px w-4",
                  s < step ? "bg-emerald-500/40" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <StepIndicator />

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3">
          <p className="text-xs font-medium text-red-400">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── STEP 1: Business Info + URL ─────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-md border border-border bg-surface p-5 space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Business & Contact Info
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={labelCls}>Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={inputCls}
                    placeholder="Joe's Plumbing"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Contact Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={inputCls}
                    placeholder="Joe Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="joe@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                  placeholder="123 Main St, City, ST 12345"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Google Business URL *</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    className={cn(inputCls, "flex-1")}
                    placeholder="https://www.google.com/maps/place/..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleScrape()
                    }}
                  />
                  <Button
                    onClick={handleScrape}
                    disabled={
                      scraping ||
                      !googleUrl.trim() ||
                      !businessName.trim() ||
                      !contactName.trim() ||
                      !email.trim()
                    }
                    size="sm"
                    className="shrink-0"
                  >
                    {scraping ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1" />
                    )}
                    Analyze Reviews
                  </Button>
                </div>
                {warning && (
                  <p className="text-xs text-amber-400">{warning}</p>
                )}
              </div>
            </div>

            {/* Loading skeleton */}
            {scraping && (
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
          </motion.div>
        )}

        {/* ─── STEP 2: Review Selection + Impact ──────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex gap-6">
              {/* Left — Review List */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Reviews ({reviews.length}) — {selectedIds.size} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-[11px] text-steel hover:text-steel-light transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </button>
                </div>

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
                          : "border-border bg-surface hover:bg-surface-raised",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                          isSelected
                            ? "border-steel bg-steel text-white"
                            : "border-border bg-background",
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
                                : "text-foreground",
                            )}
                          >
                            {impact.projectedRating.toFixed(1)}
                          </span>
                          {renderStars(Math.round(impact.projectedRating))}
                        </div>
                      </div>

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
                                : "text-muted-foreground",
                          )}
                        >
                          {impact.change > 0 && (
                            <TrendingUp className="h-3.5 w-3.5" />
                          )}
                          {impact.change > 0 ? "+" : ""}
                          {impact.change.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                        <span className="text-xs text-muted-foreground">
                          Reviews to Remove
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {impact.removedCount}
                        </span>
                      </div>

                      {/* Continue to pricing */}
                      <Button
                        onClick={() => setStep(3)}
                        disabled={selectedIds.size === 0}
                        className="w-full"
                        size="sm"
                      >
                        Set Price
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3: Pricing ────────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Pricing — {selectedIds.size} review{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-[11px] text-steel hover:text-steel-light transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Price input */}
              <div className="rounded-md border border-border bg-surface p-5 space-y-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                    Your Price
                  </p>

                  {/* Toggle */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setPricingMode("total")}
                      className={cn(
                        "rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                        pricingMode === "total"
                          ? "border-steel/30 bg-steel/15 text-steel"
                          : "border-border bg-background text-muted-foreground hover:bg-surface",
                      )}
                    >
                      Total
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode("per_review")}
                      className={cn(
                        "rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                        pricingMode === "per_review"
                          ? "border-steel/30 bg-steel/15 text-steel"
                          : "border-border bg-background text-muted-foreground hover:bg-surface",
                      )}
                    >
                      Per Review
                    </button>
                  </div>

                  {/* Big price input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="w-full rounded-md border border-border bg-background py-4 pl-10 pr-4 text-3xl font-mono font-bold text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
                      placeholder="0"
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {pricingMode === "total"
                      ? `$${effectivePerReview.toFixed(2)} per review`
                      : `$${effectiveTotal.toFixed(2)} total for ${selectedIds.size} reviews`}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Friend discount, family rate, special deal..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"
                  />
                </div>
              </div>

              {/* Summary card */}
              <div className="rounded-md border border-border bg-surface p-5 space-y-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Deal Summary
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Business
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {businessName || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Contact
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {contactName || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Reviews to Remove
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedIds.size}
                    </span>
                  </div>

                  {impact && (
                    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        Rating Impact
                      </span>
                      <span className="text-sm font-semibold">
                        <span className="text-foreground">
                          {impact.originalRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground mx-1">
                          {" "}
                          {"->"}{" "}
                        </span>
                        <span
                          className={cn(
                            impact.change > 0
                              ? "text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {impact.projectedRating.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between rounded-md border border-steel/30 bg-steel/5 px-3 py-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-steel">
                      Total Price
                    </span>
                    <span className="text-xl font-mono font-bold text-steel">
                      ${effectiveTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                    <span className="text-xs text-emerald-400">
                      BTS keeps (100%)
                    </span>
                    <span className="text-sm font-mono font-semibold text-emerald-400">
                      ${effectiveTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCreateAndGenerate}
                  disabled={saving || generatingPdf || effectiveTotal < 0 || selectedIds.size === 0}
                  className="w-full"
                  size="sm"
                >
                  {saving || generatingPdf ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-1" />
                  )}
                  {saving
                    ? "Creating..."
                    : generatingPdf
                      ? "Generating PDF..."
                      : "Generate Contract & Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 4: Contract / PDF ─────────────────────────────────────── */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Success banner */}
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Sale created successfully
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Client record saved, reviews imported, and contract generated.
              </p>
            </div>

            {/* PDF Preview + Actions */}
            <div className="rounded-md border border-border bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Contract PDF
                </p>
                {pdfFilename && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {pdfFilename}
                  </span>
                )}
              </div>

              {/* PDF embed preview */}
              {pdfBase64 && (
                <div className="rounded-md border border-border overflow-hidden bg-background">
                  <iframe
                    src={`data:application/pdf;base64,${pdfBase64}`}
                    className="w-full h-[500px]"
                    title="Contract Preview"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleDownloadPdf}
                  disabled={!pdfBase64}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>

                <Button
                  onClick={handleEmailContract}
                  disabled={emailing || emailSent || !pdfBase64 || !email}
                  size="sm"
                >
                  {emailing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : emailSent ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Mail className="h-4 w-4 mr-1" />
                  )}
                  {emailing
                    ? "Sending..."
                    : emailSent
                      ? `Sent to ${email}`
                      : `Email to ${email}`}
                </Button>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex items-center gap-4">
              <Link
                href={clientId ? `/owner/clients/${clientId}` : "/owner/clients"}
                className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
              >
                View Client
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/owner/direct-sale"
                onClick={(e) => {
                  e.preventDefault()
                  // Reset entire flow
                  setStep(1)
                  setBusinessName("")
                  setContactName("")
                  setEmail("")
                  setPhone("")
                  setAddress("")
                  setGoogleUrl("")
                  setReviews([])
                  setSelectedIds(new Set())
                  setTotalPrice("")
                  setPricingMode("total")
                  setNotes("")
                  setClientId(null)
                  setContractId(null)
                  setPdfBase64(null)
                  setPdfFilename(null)
                  setEmailSent(false)
                  setError(null)
                  setWarning(null)
                }}
                className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
              >
                <Zap className="h-3 w-3" />
                New Direct Sale
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
