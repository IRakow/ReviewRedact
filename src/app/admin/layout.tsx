import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AdminSidebarWrapper } from "./AdminSidebarWrapper"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type !== "owner") redirect("/dashboard")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebarWrapper
        resellerName={session.name}
        isAdmin={true}
        userType={session.user_type}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
