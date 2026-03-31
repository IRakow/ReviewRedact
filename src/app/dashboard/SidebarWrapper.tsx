"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MobileHeader } from "@/components/dashboard/MobileHeader"
import type { UserRole } from "@/lib/types"

interface SidebarWrapperProps {
  userName: string
  isAdmin: boolean
  userType: UserRole
}

export function SidebarWrapper({ userName, isAdmin, userType }: SidebarWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <>
      <MobileHeader
        title="ReviewRedact"
        onMenuToggle={() => setMobileOpen(true)}
      />
      <Sidebar
        userName={userName}
        isAdmin={isAdmin}
        userType={userType}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
    </>
  )
}
