"use client"

import { useState } from "react"
import { OwnerSidebar } from "./OwnerSidebar"
import { MobileHeader } from "@/components/dashboard/MobileHeader"

export function OwnerSidebarWrapper({ ownerName }: { ownerName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <MobileHeader
        title="Owner Panel"
        onMenuToggle={() => setMobileOpen(true)}
      />
      <OwnerSidebar
        ownerName={ownerName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
    </>
  )
}
