"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

interface AdminSidebarWrapperProps {
  resellerName: string
  isAdmin: boolean
}

export function AdminSidebarWrapper({ resellerName, isAdmin }: AdminSidebarWrapperProps) {
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
