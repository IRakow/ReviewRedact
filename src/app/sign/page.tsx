import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { SigningFlow } from "./SigningFlow"
import { getDocumentStatus } from "./actions"

export default async function SignPage() {
  const session = await getSession()
  if (!session) redirect("/")

  // Owners don't need to sign
  if (session.user_type === "owner") {
    redirect("/owner")
  }

  const status = await getDocumentStatus()

  // If both are signed, redirect to dashboard
  if (status.w9_1099 === "signed" && status.contractor_agreement === "signed") {
    redirect("/dashboard")
  }

  // Check if the user has already completed their profile (has address on file)
  const supabase = createServerClient()
  const table = session.user_type === "reseller" ? "resellers" : "salespeople"
  const { data: profile } = await supabase
    .from(table)
    .select("address")
    .eq("id", session.user_id)
    .single()

  const profileComplete = !!profile?.address

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-steel/30 bg-steel/5 font-mono text-lg font-bold text-steel">
            RR
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Onboarding
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your profile and sign the required documents
          </p>
        </div>

        <SigningFlow
          initialStatus={status}
          userName={session.name}
          userType={session.user_type}
          profileComplete={profileComplete}
        />
      </div>
    </div>
  )
}
