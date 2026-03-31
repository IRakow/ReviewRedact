import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { OwnerSidebarWrapper } from "./OwnerSidebarWrapper"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type !== "owner") redirect("/dashboard")

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      <OwnerSidebarWrapper ownerName={session.name} />
      <main className="warm-vignette flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
