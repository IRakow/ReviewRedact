"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, UserCheck, Shield, LogOut, Settings, FileText } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface SidebarProps {
  userName: string
  isAdmin: boolean
  userType: UserRole
  onLogout: () => void
}

const navItems = [
  {
    label: "Clients",
    href: "/dashboard",
    icon: Users,
    roles: ["owner", "reseller", "salesperson"] as UserRole[],
  },
  {
    label: "Salespeople",
    href: "/dashboard/settings",
    icon: UserCheck,
    roles: ["reseller"] as UserRole[],
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
    roles: ["reseller", "salesperson"] as UserRole[],
  },
  {
    label: "Owner Panel",
    href: "/owner",
    icon: Shield,
    roles: ["owner"] as UserRole[],
  },
]

function getRoleLabel(userType: UserRole): string {
  switch (userType) {
    case "owner":
      return "Owner"
    case "reseller":
      return "Reseller"
    case "salesperson":
      return "Sales Agent"
  }
}

function getSettingsHref(userType: UserRole): string | null {
  if (userType === "reseller") return "/dashboard/settings"
  if (userType === "salesperson") return "/dashboard/portal"
  return null
}

export function Sidebar({ userName, isAdmin, userType, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const settingsHref = getSettingsHref(userType)

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-steel/30 bg-steel/10 font-mono text-xs font-bold text-steel">
            RR
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground">
            ReviewRedact
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems
          .filter((item) => item.roles.includes(userType))
          .map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/clients")
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 h-5 w-0.5 rounded-r bg-steel" />
                )}
                <item.icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-steel" : "text-muted-foreground group-hover:text-steel/60"
                )} />
                {item.label}
              </Link>
            )
          })}
      </nav>

      {/* Footer — name + subtle settings wheel + logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {getRoleLabel(userType)}
            </p>
          </div>
          {/* Settings wheel — subtle, bottom corner by name */}
          {settingsHref && (
            <Link
              href={settingsHref}
              className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-muted-foreground"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
