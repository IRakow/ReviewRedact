"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ReviewTable, type ReviewRow } from "@/components/dashboard/ReviewTable"
import { ImpactCalculator } from "@/components/dashboard/ImpactCalculator"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { updateReviewStatus, takeSnapshot, triggerScrape } from "./actions"
import type { Client, Review } from "@/lib/types"
import {
  FileText,
  RefreshCw,
  Camera,
  Loader2,
  MessageSquare,
  Download,
} from "lucide-react"

interface ReviewManagerProps {
  client: Client
  reviews: Review[]
}

function toReviewRow(review: Review): ReviewRow {
  return {
    id: review.id,
    reviewerName: review.reviewer_name,
    starRating: review.star_rating,
    reviewText: review.review_text,
    reviewDate: review.review_date,
    status: review.status,
  }
}

export function ReviewManager({ client, reviews }: ReviewManagerProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [scraping, setScraping] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)
  const [generating, setGenerating] = useState(false)

  const reviewRows = reviews.map(toReviewRow)

  function handleToggleSelect(id: string) {
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

  function handleSelectAll(ids: string[]) {
    setSelectedIds(new Set(ids))
  }

  function handleSelectByRating(maxStars: number) {
    const ids = reviews
      .filter((r) => r.status === "active" && r.star_rating <= maxStars)
      .map((r) => r.id)
    setSelectedIds(new Set(ids))
  }

  function handleStatusChange(reviewId: string, status: ReviewRow["status"]) {
    startTransition(async () => {
      await updateReviewStatus(reviewId, status)
      router.refresh()
    })
  }

  async function handleScrape() {
    setScraping(true)
    try {
      await triggerScrape(client.id)
      router.refresh()
    } catch (err) {
      console.error("Scrape failed:", err)
    } finally {
      setScraping(false)
    }
  }

  async function handleSnapshot() {
    setSnapshotting(true)
    try {
      await takeSnapshot(client.id)
      router.refresh()
    } catch (err) {
      console.error("Snapshot failed:", err)
    } finally {
      setSnapshotting(false)
    }
  }

  async function handleGenerateContract() {
    if (selectedIds.size === 0) return
    setGenerating(true)
    try {
      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          selected_review_ids: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Contract generation failed: ${body}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contract-${client.business_name.replace(/\s+/g, "-").toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Contract generation failed:", err)
    } finally {
      setGenerating(false)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reviews
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrape}
            disabled={scraping}
          >
            {scraping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            {scraping ? "Scraping..." : "Scrape Reviews"}
          </Button>
        </div>
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No reviews found"
          description="Scrape this client's Google reviews to get started."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleScrape}
          disabled={scraping}
        >
          {scraping ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
          )}
          {scraping ? "Scraping..." : "Re-scrape"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSnapshot}
          disabled={snapshotting}
        >
          {snapshotting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Camera className="h-3.5 w-3.5 mr-1" />
          )}
          {snapshotting ? "Saving..." : "Take Snapshot"}
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          onClick={handleGenerateContract}
          disabled={selectedIds.size === 0 || generating}
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1" />
          )}
          {generating
            ? "Generating..."
            : `Generate Contract${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
        </Button>
      </div>

      {/* Main content: table + calculator */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-md border border-border bg-surface p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reviews ({reviews.length})
          </h2>
          <ReviewTable
            reviews={reviewRows}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onStatusChange={handleStatusChange}
          />
        </div>

        <ImpactCalculator
          reviews={reviewRows}
          selectedIds={selectedIds}
          onSelectByRating={handleSelectByRating}
        />
      </div>
    </div>
  )
}
