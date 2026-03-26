"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import type { UserRole } from "@/lib/types"

interface SidebarWrapperProps {
  userName: string
  isAdmin: boolean
  userType: UserRole
}

export function SidebarWrapper({ userName, isAdmin, userType }: SidebarWrapperProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
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
