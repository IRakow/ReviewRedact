"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import type { UserRole } from "@/lib/types"

interface AdminSidebarWrapperProps {
  userName: string
  isAdmin: boolean
  userType: UserRole
}

export function AdminSidebarWrapper({ userName, isAdmin, userType }: AdminSidebarWrapperProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <Sidebar
      userName={userName}
      isAdmin={isAdmin}
      userType={userType}
      onLogout={handleLogout}
    />
  )
}
