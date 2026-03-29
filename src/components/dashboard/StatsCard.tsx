"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function StatsCard({
  label,
  value,
  icon,
  subtext,
  trend,
  className,
}: {
  label: string
  value: string | number
  icon?: ReactNode
  subtext?: string
  trend?: { value: string; positive: boolean }
  className?: string
}) {
  return (
    <div
      className={cn(
        "noise-overlay relative overflow-hidden rounded-md border border-border bg-surface p-5 transition-colors hover:border-steel/20",
        className
      )}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {(subtext || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.positive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {trend.positive ? "+" : ""}{trend.value}
                </span>
              )}
              {subtext && (
                <span className="text-xs text-muted-foreground">{subtext}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      {/* Corner accent — gold tip */}
      <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-gold/50 via-gold/20 to-transparent" />
      <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent" />
    </div>
  )
}
