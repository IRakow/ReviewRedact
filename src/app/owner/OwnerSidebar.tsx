"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  FileText,
  CreditCard,
  FolderOpen,
  BarChart3,
  LogOut,
  Sliders,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { label: "Resellers", href: "/owner/resellers", icon: Users },
  { label: "Salespeople", href: "/owner/salespeople", icon: UserCheck },
  { label: "Clients", href: "/owner/clients", icon: Building2 },
  { label: "Invoices", href: "/owner/invoices", icon: FileText },
  { label: "Payments", href: "/owner/payments", icon: CreditCard },
  { label: "Documents", href: "/owner/documents", icon: FolderOpen },
  { label: "Reports", href: "/owner/reports", icon: BarChart3 },
  { label: "Rate Overrides", href: "/owner/overrides", icon: Sliders },
]

export function OwnerSidebar({ ownerName }: { ownerName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-steel/30 bg-steel/10 font-mono text-xs font-bold text-steel">
            RR
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground">
            Owner Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive = item.href === "/owner"
            ? pathname === "/owner"
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {ownerName}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Owner
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
