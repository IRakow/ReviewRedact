"use client"

import { cn } from "@/lib/utils"
import { StarRating } from "./StarRating"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, Trash2 } from "lucide-react"
import type { ReviewRow } from "./ReviewTable"

interface ImpactCalculatorProps {
  reviews: ReviewRow[]
  selectedIds: Set<string>
  onSelectByRating: (maxStars: number) => void
  className?: string
}

export function ImpactCalculator({
  reviews,
  selectedIds,
  onSelectByRating,
  className,
}: ImpactCalculatorProps) {
  const activeReviews = reviews.filter((r) => r.status === "active")

  // Current state
  const currentCount = activeReviews.length
  const currentTotalStars = activeReviews.reduce((sum, r) => sum + r.starRating, 0)
  const currentAvg = currentCount > 0 ? currentTotalStars / currentCount : 0

  // After removal — selected reviews are COMPLETELY DELETED (review + stars gone)
  const remaining = activeReviews.filter((r) => !selectedIds.has(r.id))
  const projectedCount = remaining.length
  const projectedTotalStars = remaining.reduce((sum, r) => sum + r.starRating, 0)
  const projectedAvg = projectedCount > 0 ? projectedTotalStars / projectedCount : 0

  const delta = projectedAvg - currentAvg
  const selectedCount = selectedIds.size
  const removedStars = currentTotalStars - projectedTotalStars

  // Star distribution
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    total: activeReviews.filter((r) => r.starRating === stars).length,
    selected: activeReviews.filter((r) => r.starRating === stars && selectedIds.has(r.id)).length,
  }))
  const maxInDist = Math.max(...distribution.map((d) => d.total), 1)

  return (
    <div className={cn("rounded-md border border-border bg-surface p-5 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-steel" />
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Impact Calculator
        </h3>
      </div>

      {/* Rating comparison */}
      <div className="flex items-center gap-3">
        {/* Current */}
        <div className="flex-1 rounded-md border border-border bg-background p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {currentAvg.toFixed(2)}
          </p>
          <StarRating rating={currentAvg} size="xs" className="justify-center mt-1" />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {currentCount} reviews
          </p>
        </div>

        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />

        {/* Projected */}
        <div className={cn(
          "flex-1 rounded-md border p-3 text-center",
          selectedCount > 0 ? "border-steel/30 bg-steel/5" : "border-border bg-background"
        )}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">After Removal</p>
          <p className={cn(
            "font-mono text-2xl font-bold",
            selectedCount > 0 ? "text-steel-light" : "text-foreground"
          )}>
            {selectedCount > 0 ? projectedAvg.toFixed(2) : "—"}
          </p>
          {selectedCount > 0 && (
            <>
              <StarRating rating={projectedAvg} size="xs" className="justify-center mt-1" />
              <p className="mt-1 font-mono text-[10px] text-steel-light">
                {projectedCount} reviews
              </p>
            </>
          )}
        </div>
      </div>

      {/* Impact summary */}
      {selectedCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 py-2.5">
            <span className="font-mono text-lg font-bold text-emerald-400">
              +{delta.toFixed(2)}
            </span>
            <span className="text-xs text-emerald-400/70">star increase</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Trash2 className="h-3 w-3 text-red-400" />
              <span>{selectedCount} review{selectedCount !== 1 ? "s" : ""} removed</span>
            </div>
            <div className="font-mono text-muted-foreground">
              <span className="text-foreground">{currentCount}</span>
              {" → "}
              <span className="text-steel-light">{projectedCount}</span>
              {" reviews"}
            </div>
          </div>
        </div>
      )}

      {/* Star breakdown — shows what stays and what goes */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Star Breakdown
        </p>
        {distribution.map(({ stars, total, selected }) => (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-right font-mono text-muted-foreground">
              {stars}<span className="text-amber">★</span>
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
              {/* Remaining bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber/60 transition-all duration-300"
                style={{ width: `${((total - selected) / maxInDist) * 100}%` }}
              />
              {/* Removed portion (red) */}
              {selected > 0 && (
                <div
                  className="absolute inset-y-0 rounded-full bg-red-500/50 transition-all duration-300"
                  style={{
                    left: `${((total - selected) / maxInDist) * 100}%`,
                    width: `${(selected / maxInDist) * 100}%`,
                  }}
                />
              )}
            </div>
            <span className="w-16 text-right font-mono text-muted-foreground">
              {selected > 0 ? (
                <>
                  <span className="text-foreground">{total - selected}</span>
                  <span className="text-red-400/60"> (-{selected})</span>
                </>
              ) : (
                <span>{total}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Quick scenario buttons */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Quick Select
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4].map((maxStars) => {
            const count = activeReviews.filter((r) => r.starRating <= maxStars).length
            if (count === 0) return null

            // Preview what the avg would be
            const afterRemoval = activeReviews.filter((r) => r.starRating > maxStars)
            const previewAvg = afterRemoval.length > 0
              ? afterRemoval.reduce((s, r) => s + r.starRating, 0) / afterRemoval.length
              : 0

            return (
              <Button
                key={maxStars}
                variant="outline"
                size="xs"
                onClick={() => onSelectByRating(maxStars)}
                className="font-mono text-[10px]"
              >
                All ≤{maxStars}★ ({count}) → {previewAvg.toFixed(1)}★
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
