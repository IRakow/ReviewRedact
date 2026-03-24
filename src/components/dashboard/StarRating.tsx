"use client"

import { cn } from "@/lib/utils"

function StarIcon({ filled, partial }: { filled: boolean; partial?: number }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0", filled ? "text-amber" : "text-border")}
      viewBox="0 0 20 20"
      fill="none"
    >
      <defs>
        {partial !== undefined && (
          <linearGradient id={`star-partial-${partial}`}>
            <stop offset={`${partial * 100}%`} stopColor="currentColor" />
            <stop offset={`${partial * 100}%`} stopColor="#262626" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        fill={
          partial !== undefined
            ? `url(#star-partial-${partial})`
            : filled
              ? "currentColor"
              : "#262626"
        }
        stroke={filled || partial !== undefined ? "currentColor" : "#333"}
        strokeWidth="0.5"
      />
    </svg>
  )
}

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  showValue = false,
  className,
}: {
  rating: number
  maxStars?: number
  size?: "xs" | "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}) {
  const sizeClasses = {
    xs: "[&_svg]:h-3 [&_svg]:w-3",
    sm: "[&_svg]:h-4 [&_svg]:w-4",
    md: "[&_svg]:h-5 [&_svg]:w-5",
    lg: "[&_svg]:h-6 [&_svg]:w-6",
  }

  const stars = Array.from({ length: maxStars }, (_, i) => {
    const starValue = i + 1
    if (rating >= starValue) {
      return <StarIcon key={i} filled />
    }
    if (rating > starValue - 1) {
      return <StarIcon key={i} filled={false} partial={rating - (starValue - 1)} />
    }
    return <StarIcon key={i} filled={false} />
  })

  return (
    <div className={cn("flex items-center gap-0.5", sizeClasses[size], className)}>
      {stars}
      {showValue && (
        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
