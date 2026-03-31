"use client"

import { Menu } from "lucide-react"

export function MobileHeader({
  title,
  onMenuToggle,
}: {
  title: string
  onMenuToggle: () => void
}) {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <button
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-sm border border-gold/30 bg-gold/5 font-mono text-[10px] font-bold text-gold">
          RR
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground">
          {title}
        </span>
      </div>
    </div>
  )
}
