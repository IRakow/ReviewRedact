"use client"

import { cn } from "@/lib/utils"

type StatusType =
  | "active"
  | "pending"
  | "in_progress"
  | "removed"
  | "waiting_for_payment"
  | "paid"
  | "completed"
  | "failed"
  | "paused"
  | "draft"
  | "sent"
  | "signed"
  | "overdue"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-steel/15 text-steel-light border-steel/30 glow-steel",
  },
  pending: {
    label: "Pending",
    className: "bg-amber/15 text-amber border-amber/30 glow-amber",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-steel/15 text-steel-light border-steel/30 glow-steel",
  },
  removed: {
    label: "Removed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-green",
  },
  waiting_for_payment: {
    label: "Awaiting Payment",
    className: "bg-amber/15 text-amber border-amber/30 glow-amber",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-green",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-green",
  },
  failed: {
    label: "Failed",
    className: "bg-blood/15 text-red-400 border-blood/30 glow-red",
  },
  paused: {
    label: "Paused",
    className: "bg-muted text-muted-foreground border-border",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  sent: {
    label: "Sent",
    className: "bg-steel/15 text-steel-light border-steel/30 glow-steel",
  },
  signed: {
    label: "Signed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-green",
  },
  overdue: {
    label: "Overdue",
    className: "bg-blood/15 text-red-400 border-blood/30 glow-red",
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: StatusType
  className?: string
}) {
  const config = statusConfig[status] ?? statusConfig.active

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        config.className,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {config.label}
    </span>
  )
}
