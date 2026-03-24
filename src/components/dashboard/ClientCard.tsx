"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import { StarRating } from "./StarRating"
import { MapPin, MessageSquare } from "lucide-react"

interface ClientCardProps {
  id: string
  businessName: string
  ownerName: string
  address: string
  status: "pending" | "active" | "in_progress" | "completed" | "paused"
  reviewCount: number
  averageRating: number | null
  className?: string
}

export function ClientCard({
  id,
  businessName,
  ownerName,
  address,
  status,
  reviewCount,
  averageRating,
  className,
}: ClientCardProps) {
  return (
    <Link
      href={`/dashboard/clients/${id}`}
      className={cn(
        "group relative block rounded-md border border-border bg-surface p-5 transition-all duration-200",
        "hover:border-steel/30 hover:bg-surface-raised",
        className
      )}
    >
      {/* Corner accent */}
      <div className="absolute top-0 left-0 h-px w-8 bg-gradient-to-r from-steel/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute top-0 left-0 h-8 w-px bg-gradient-to-b from-steel/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-steel-light transition-colors">
            {businessName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{ownerName}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{address}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {reviewCount} reviews
          </span>
        </div>
        {averageRating !== null && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={averageRating} size="xs" />
            <span className="font-mono text-xs text-amber">
              {averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
