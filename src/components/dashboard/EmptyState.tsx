"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface/50 px-8 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium tracking-wide text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="default"
          size="sm"
          onClick={onAction}
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
