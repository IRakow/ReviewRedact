"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import type { UserRole } from "@/lib/types"

interface AdminSidebarWrapperProps {
  resellerName: string
  isAdmin: boolean
  userType: UserRole
}

export function AdminSidebarWrapper({ resellerName, isAdmin, userType }: AdminSidebarWrapperProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <Sidebar
      resellerName={resellerName}
      isAdmin={isAdmin}
      userType={userType}
      onLogout={handleLogout}
    />
  )
}
