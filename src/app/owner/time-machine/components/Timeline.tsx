"use client"

import { useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  timestamp: string
  title: string
  subtitle?: string
  badge?: { label: string; variant: "auto" | "manual" | "pre_restore" | "deploy" | "commit" }
  metadata?: Record<string, string | number>
}

interface TimelineProps {
  items: TimelineItem[]
  selectedId?: string
  onSelect: (id: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

const badgeStyles: Record<string, string> = {
  auto: "bg-steel/15 text-steel-light border-steel/30",
  manual: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pre_restore: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deploy: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  commit: "bg-steel/15 text-steel-light border-steel/30",
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function groupByDate(items: TimelineItem[]) {
  const groups: Map<string, TimelineItem[]> = new Map()
  for (const item of items) {
    const dateKey = formatDate(item.timestamp)
    const existing = groups.get(dateKey)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(dateKey, [item])
    }
  }
  return groups
}

export function Timeline({ items, selectedId, onSelect, onLoadMore, hasMore }: TimelineProps) {
  const observerRef = useRef<HTMLDivElement>(null)
  const grouped = groupByDate(items)

  const handleLoadMore = useCallback(() => {
    onLoadMore?.()
  }, [onLoadMore])

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No entries yet
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-steel/20" />

      <AnimatePresence mode="popLayout">
        {Array.from(grouped.entries()).map(([dateLabel, dateItems]) => (
          <div key={dateLabel}>
            {/* Sticky date header */}
            <div className="sticky top-0 z-10 mb-2 ml-8 inline-block rounded-sm border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {dateLabel}
            </div>

            {dateItems.map((item, idx) => {
              const isSelected = item.id === selectedId
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="relative mb-3 flex items-start gap-4 pl-0"
                >
                  {/* Dot */}
                  <div className="relative z-10 mt-3 flex-shrink-0">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full border-2 ml-[7px]",
                        isSelected
                          ? "border-steel bg-steel shadow-[0_0_8px_rgba(99,144,182,0.5)]"
                          : "border-steel/40 bg-background"
                      )}
                    />
                  </div>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex-1 rounded-md border p-3 text-left transition-all",
                      isSelected
                        ? "border-steel/40 bg-steel/5"
                        : "border-border bg-surface hover:border-steel/20 hover:bg-surface/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {item.badge && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                              badgeStyles[item.badge.variant] ?? badgeStyles.commit
                            )}
                          >
                            {item.badge.label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(item.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {Object.entries(item.metadata).map(([key, val]) => (
                          <span key={key} className="text-[10px] text-muted-foreground">
                            <span className="text-muted-foreground/60">{key}:</span>{" "}
                            <span className="font-mono text-foreground/80">{val}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div ref={observerRef} className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-steel/30 hover:text-foreground"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
