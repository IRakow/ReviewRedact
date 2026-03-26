import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-steel/30 bg-steel/5 font-mono text-lg font-bold text-steel">
            RR
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Required Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please sign the following documents to access the system
          </p>
        </div>

        <SigningFlow
          initialStatus={status}
          userName={session.name}
          userType={session.user_type}
        />
      </div>
    </div>
  )
}
