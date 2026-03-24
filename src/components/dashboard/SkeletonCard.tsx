"use client"

import { cn } from "@/lib/utils"

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-3 rounded-sm skeleton-shimmer", className)}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-5 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <SkeletonLine className="w-32 h-4" />
        <SkeletonLine className="w-16 h-5 rounded-sm" />
      </div>
      <SkeletonLine className="w-48" />
      <div className="flex items-center gap-3">
        <SkeletonLine className="w-20" />
        <SkeletonLine className="w-12" />
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={i} className={cn("h-3", i === 0 ? "w-40" : "w-20")} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3 border-b border-border/50">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonLine
              key={colIdx}
              className={cn("h-3", colIdx === 0 ? "w-36" : "w-16")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border border-border bg-surface p-5 space-y-3">
          <SkeletonLine className="w-20 h-2" />
          <SkeletonLine className="w-16 h-7" />
          <SkeletonLine className="w-24 h-2" />
        </div>
      ))}
    </div>
  )
}
