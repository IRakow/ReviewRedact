"use client"

import { cn } from "@/lib/utils"

interface StarDistributionProps {
  distribution: { stars: number; count: number }[]
  total: number
  className?: string
}

export function StarDistribution({
  distribution,
  total,
  className,
}: StarDistributionProps) {
  const sorted = [...distribution].sort((a, b) => b.stars - a.stars)

  return (
    <div className={cn("space-y-1.5", className)}>
      {sorted.map(({ stars, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={stars} className="flex items-center gap-2.5 text-xs">
            <span className="w-3 font-mono text-muted-foreground text-right">
              {stars}
            </span>
            <svg className="h-3 w-3 shrink-0 text-amber" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill="currentColor"
              />
            </svg>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber/70 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-muted-foreground">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
