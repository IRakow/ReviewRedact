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
  Printer,
  Mail,
  X,
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

function ContractPreview({
  pdfUrl,
  clientId,
  clientName,
  clientEmail,
  signingToken,
  onClose,
}: {
  pdfUrl: string
  clientId: string
  clientName: string
  clientEmail: string | null
  signingToken: string | null
  onClose: () => void
}) {
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  function handlePrint() {
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = pdfUrl
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }

  function handleDownload() {
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = `DRMC-${clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleEmail() {
    if (!clientEmail) {
      alert("No client email on file. Add the client's email first.")
      return
    }
    setEmailing(true)
    setEmailError(null)
    try {
      // Fetch the PDF blob and convert to base64
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      )

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          pdf_base64: base64,
          filename: `DRMC-${clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
          signing_token: signingToken,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send email")
      }

      setEmailSent(true)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setEmailing(false)
    }
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-steel" />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Generated Contract — {clientName}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="xs" onClick={handlePrint}>
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handleEmail}
            disabled={emailing || emailSent}
          >
            {emailing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Mail className="h-3 w-3 mr-1" />
            )}
            {emailSent ? "Sent!" : emailing ? "Sending..." : "Email to Client"}
          </Button>
          {emailError && (
            <span className="text-[10px] text-red-400">{emailError}</span>
          )}
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* PDF embed */}
      <div className="p-2">
        <iframe
          src={pdfUrl}
          className="h-[70vh] w-full rounded-sm border border-border bg-white"
          title="Contract Preview"
        />
      </div>
    </div>
  )
}

export function ReviewManager({ client, reviews }: ReviewManagerProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [scraping, setScraping] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [contractRate, setContractRate] = useState(1500)
  const [contractPdfUrl, setContractPdfUrl] = useState<string | null>(null)
  const [contractSigningToken, setContractSigningToken] = useState<string | null>(null)

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
          contract_rate_google: contractRate,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(body)
      }

      const sigToken = response.headers.get("X-Signing-Token") || null
      const blob = await response.blob()
      // Revoke old URL if exists
      if (contractPdfUrl) URL.revokeObjectURL(contractPdfUrl)
      const url = URL.createObjectURL(blob)
      setContractPdfUrl(url)
      setContractSigningToken(sigToken)
    } catch (err) {
      console.error("Contract generation failed:", err)
      alert(`Contract generation failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setGenerating(false)
    }
  }

  function handleCloseContract() {
    if (contractPdfUrl) URL.revokeObjectURL(contractPdfUrl)
    setContractPdfUrl(null)
    setContractSigningToken(null)
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
      {/* Contract preview (shown after generation) */}
      {contractPdfUrl && (
        <ContractPreview
          pdfUrl={contractPdfUrl}
          clientId={client.id}
          clientName={client.business_name}
          clientEmail={client.owner_email}
          signingToken={contractSigningToken}
          onClose={handleCloseContract}
        />
      )}

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

        {/* Contract rate input */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Rate/Review
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <input
              type="number"
              value={contractRate}
              onChange={(e) => setContractRate(Number(e.target.value))}
              className="w-24 rounded-sm border border-border bg-surface py-1.5 pl-5 pr-2 text-right font-mono text-xs text-foreground focus:border-steel focus:outline-none"
              min={1000}
              step={100}
            />
          </div>
        </div>

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
