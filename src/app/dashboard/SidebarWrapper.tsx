"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

interface SidebarWrapperProps {
  resellerName: string
  isAdmin: boolean
}

export function SidebarWrapper({ resellerName, isAdmin }: SidebarWrapperProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  return (
    <Sidebar
      resellerName={resellerName}
      isAdmin={isAdmin}
      onLogout={handleLogout}
    />
  )
}
