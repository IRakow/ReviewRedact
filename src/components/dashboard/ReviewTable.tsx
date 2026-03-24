"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { StarRating } from "./StarRating"
import { StatusBadge } from "./StatusBadge"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface ReviewRow {
  id: string
  reviewerName: string
  starRating: number
  reviewText: string | null
  reviewDate: string | null
  status: "active" | "pending_removal" | "removed" | "failed"
}

interface ReviewTableProps {
  reviews: ReviewRow[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onStatusChange: (id: string, status: ReviewRow["status"]) => void
  className?: string
}

function ExpandableText({ text, maxLength = 120 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= maxLength) {
    return <span>{text}</span>
  }
  return (
    <span>
      {expanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        className="ml-1 text-steel hover:text-steel-light text-[10px] uppercase tracking-wider"
      >
        {expanded ? "less" : "more"}
      </button>
    </span>
  )
}

export function ReviewTable({
  reviews,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onStatusChange,
  className,
}: ReviewTableProps) {
  const selectableIds = reviews.filter((r) => r.status === "active").map((r) => r.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <th className="w-10 pb-3 pl-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {
                  if (allSelected) {
                    onSelectAll([])
                  } else {
                    onSelectAll(selectableIds)
                  }
                }}
                className="h-3.5 w-3.5 rounded-sm border-border bg-surface accent-steel"
              />
            </th>
            <th className="pb-3 text-left">Reviewer</th>
            <th className="pb-3 text-left">Rating</th>
            <th className="pb-3 text-left">Review</th>
            <th className="pb-3 text-left">Date</th>
            <th className="pb-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr
              key={review.id}
              className={cn(
                "border-b border-border/40 transition-colors",
                selectedIds.has(review.id)
                  ? "bg-steel/5"
                  : "hover:bg-surface-raised/50"
              )}
            >
              <td className="py-3 pl-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(review.id)}
                  onChange={() => onToggleSelect(review.id)}
                  disabled={review.status !== "active"}
                  className="h-3.5 w-3.5 rounded-sm border-border bg-surface accent-steel disabled:opacity-30"
                />
              </td>
              <td className="py-3 pr-3">
                <span className="text-sm font-medium text-foreground">
                  {review.reviewerName}
                </span>
              </td>
              <td className="py-3 pr-3">
                <StarRating rating={review.starRating} size="xs" />
              </td>
              <td className="py-3 pr-3 max-w-xs">
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {review.reviewText ? (
                    <ExpandableText text={review.reviewText} />
                  ) : (
                    <span className="italic text-border">No text</span>
                  )}
                </span>
              </td>
              <td className="py-3 pr-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {review.reviewDate ?? "—"}
                </span>
              </td>
              <td className="py-3">
                <select
                  value={review.status}
                  onChange={(e) => onStatusChange(review.id, e.target.value as ReviewRow["status"])}
                  className="rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-foreground focus:border-steel focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="pending_removal">Pending Removal</option>
                  <option value="removed">Removed</option>
                  <option value="failed">Failed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
