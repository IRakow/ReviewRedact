import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { OwnerSidebar } from "./OwnerSidebar"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type !== "owner") redirect("/dashboard")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <OwnerSidebar ownerName={session.name} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
