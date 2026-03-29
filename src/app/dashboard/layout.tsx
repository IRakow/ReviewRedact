import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SidebarWrapper } from "./SidebarWrapper"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarWrapper
        userName={session.name}
        isAdmin={session.user_type === "owner"}
        userType={session.user_type}
      />
      <main className="warm-vignette flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
