import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/")
  if (session.user_type === "owner") redirect("/owner")

  const supabase = createServerClient()
  const table = session.user_type === "reseller" ? "resellers" : "salespeople"

  const { data: user, error } = await supabase
    .from(table)
    .select("name, company, email, cell, address, tax_id_1099")
    .eq("id", session.user_id)
    .single()

  if (error || !user) {
    throw new Error("Failed to load profile")
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <ProfileForm
        name={user.name}
        company={user.company}
        email={user.email}
        cell={user.cell}
        address={user.address}
        taxId={user.tax_id_1099}
      />
    </div>
  )
}
