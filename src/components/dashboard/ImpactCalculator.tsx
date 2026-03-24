"use client"

import { cn } from "@/lib/utils"
import { StarRating } from "./StarRating"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"
import type { ReviewRow } from "./ReviewTable"

interface ImpactCalculatorProps {
  reviews: ReviewRow[]
  selectedIds: Set<string>
  onSelectByRating: (maxStars: number) => void
  className?: string
}

function computeAverage(reviews: ReviewRow[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.starRating, 0)
  return sum / reviews.length
}

export function ImpactCalculator({
  reviews,
  selectedIds,
  onSelectByRating,
  className,
}: ImpactCalculatorProps) {
  const activeReviews = reviews.filter((r) => r.status === "active")
  const currentAvg = computeAverage(activeReviews)
  const remainingAfterRemoval = activeReviews.filter((r) => !selectedIds.has(r.id))
  const projectedAvg = computeAverage(remainingAfterRemoval)
  const delta = projectedAvg - currentAvg
  const selectedCount = selectedIds.size

  // Star distribution for active reviews
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    total: activeReviews.filter((r) => r.starRating === stars).length,
    selected: activeReviews.filter((r) => r.starRating === stars && selectedIds.has(r.id)).length,
  }))

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-5 space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-steel" />
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Impact Calculator
        </h3>
      </div>

      {/* Rating comparison */}
      <div className="flex items-center gap-4">
        {/* Current */}
        <div className="flex-1 rounded-md border border-border bg-background p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {currentAvg.toFixed(2)}
          </p>
          <StarRating rating={currentAvg} size="xs" className="justify-center mt-1" />
        </div>

        {/* Arrow */}
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />

        {/* Projected */}
        <div className={cn(
          "flex-1 rounded-md border p-3 text-center",
          selectedCount > 0
            ? "border-steel/30 bg-steel/5"
            : "border-border bg-background"
        )}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Projected</p>
          <p className={cn(
            "font-mono text-2xl font-bold",
            selectedCount > 0 ? "text-steel-light" : "text-foreground"
          )}>
            {selectedCount > 0 ? projectedAvg.toFixed(2) : "—"}
          </p>
          {selectedCount > 0 && (
            <StarRating rating={projectedAvg} size="xs" className="justify-center mt-1" />
          )}
        </div>
      </div>

      {/* Delta */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 py-2 text-sm">
          <span className="font-mono font-bold text-emerald-400">
            +{delta.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-400/70">
            stars ({selectedCount} review{selectedCount !== 1 ? "s" : ""} removed)
          </span>
        </div>
      )}

      {/* Star breakdown */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Breakdown
        </p>
        {distribution.map(({ stars, total, selected }) => (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-right font-mono text-muted-foreground">
              {stars}<span className="text-amber">★</span>
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber/50 transition-all"
                style={{ width: total > 0 ? `${((total - selected) / Math.max(...distribution.map(d => d.total), 1)) * 100}%` : "0%" }}
              />
              {selected > 0 && (
                <div
                  className="absolute inset-y-0 rounded-full bg-red-500/40 transition-all"
                  style={{
                    left: `${((total - selected) / Math.max(...distribution.map(d => d.total), 1)) * 100}%`,
                    width: `${(selected / Math.max(...distribution.map(d => d.total), 1)) * 100}%`,
                  }}
                />
              )}
            </div>
            <span className="w-12 text-right font-mono text-muted-foreground">
              {total - selected}<span className="text-border">/{total}</span>
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
            return (
              <Button
                key={maxStars}
                variant="outline"
                size="xs"
                onClick={() => onSelectByRating(maxStars)}
                className="font-mono text-[10px]"
              >
                All ≤{maxStars}★ ({count})
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
