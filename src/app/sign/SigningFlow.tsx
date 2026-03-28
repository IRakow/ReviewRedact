"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SignaturePad } from "@/components/sign/SignaturePad"
import { W9Content, ContractorAgreementContent } from "@/components/sign/DocumentContent"
import { signDocument, refreshSessionAfterSigning, saveOnboardingProfile } from "./actions"
import type { DocumentType, UserRole } from "@/lib/types"
import { Check, FileText, Loader2, User } from "lucide-react"

interface SigningFlowProps {
  initialStatus: {
    w9_1099: "pending" | "signed"
    contractor_agreement: "pending" | "signed"
  }
  userName: string
  userType: UserRole
  profileComplete?: boolean
}

const DOC_LABELS: Record<DocumentType, { title: string; description: string }> = {
  w9_1099: {
    title: "W-9 / 1099 Tax Form",
    description: "Required by the IRS for independent contractor payments. Your information will be kept confidential.",
  },
  contractor_agreement: {
    title: "Independent Contractor Agreement",
    description: "Outlines the terms of your engagement with Business Threat Solutions, LLC.",
  },
}

export function SigningFlow({ initialStatus, userName, userType, profileComplete: initialProfileComplete }: SigningFlowProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [profileComplete, setProfileComplete] = useState(initialProfileComplete ?? false)
  const [activeDoc, setActiveDoc] = useState<DocumentType | null>(
    initialStatus.w9_1099 === "pending"
      ? "w9_1099"
      : initialStatus.contractor_agreement === "pending"
        ? "contractor_agreement"
        : null
  )
  const [error, setError] = useState("")
  const [taxId, setTaxId] = useState("")
  const [isPending, startTransition] = useTransition()

  // Profile form state
  const [legalName, setLegalName] = useState(userName)
  const [company, setCompany] = useState("")
  const [address, setAddress] = useState("")
  const [profileError, setProfileError] = useState("")

  const allSigned = status.w9_1099 === "signed" && status.contractor_agreement === "signed"

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileError("")

    if (!legalName.trim()) {
      setProfileError("Legal name is required")
      return
    }
    if (!address.trim()) {
      setProfileError("Address is required for 1099 reporting")
      return
    }

    startTransition(async () => {
      const result = await saveOnboardingProfile({
        legal_name: legalName.trim(),
        company: company.trim() || null,
        address: address.trim(),
      })

      if (result.error) {
        setProfileError(result.error)
        return
      }

      setProfileComplete(true)
    })
  }

  async function handleSign(data: {
    type: "draw" | "typed"
    image_data?: string
    typed_name?: string
    font?: string
  }) {
    if (!activeDoc) return
    setError("")

    startTransition(async () => {
      try {
        const result = await signDocument(activeDoc, data, navigator.userAgent, activeDoc === "w9_1099" ? taxId : undefined)

        if (result.error) {
          setError(result.error)
          return
        }

        // Update local status
        const newStatus = { ...status, [activeDoc]: "signed" as const }
        setStatus(newStatus)

        // Move to next unsigned doc or finish
        if (activeDoc === "w9_1099" && newStatus.contractor_agreement === "pending") {
          setActiveDoc("contractor_agreement")
        } else if (activeDoc === "contractor_agreement" && newStatus.w9_1099 === "pending") {
          setActiveDoc("w9_1099")
        } else {
          // All signed — refresh session and redirect
          setActiveDoc(null)
          try {
            await refreshSessionAfterSigning()
          } catch {
            // Session refresh failed but documents are signed; redirect anyway
          }
          router.push("/dashboard")
          router.refresh()
        }
      } catch (err) {
        setError("Something went wrong — please try again")
        console.error("Signing error:", err)
      }
    })
  }

  const inputClass =
    "w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30"

  // Step 1: Complete Your Profile (before any document signing)
  if (!profileComplete) {
    return (
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-steel/15 text-steel text-xs font-bold">
            1
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Complete Your Profile</p>
            <p className="text-xs text-muted-foreground">Required before signing documents</p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-4 w-4 text-steel" />
            <h2 className="text-sm font-semibold text-foreground">Your Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Full Legal Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground">
                Confirm your legal name as it should appear on tax documents.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Company Name <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your business name, if applicable"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Mailing Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Street, City, State, ZIP"
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground">
                Required by the IRS for 1099 reporting.
              </p>
            </div>

            {profileError && (
              <p className="text-xs font-medium uppercase tracking-wider text-red-400">{profileError}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30"
            >
              {isPending ? "Saving..." : "Continue to Documents"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile step — completed */}
      <button
        type="button"
        disabled
        className="w-full text-left rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-sm border border-emerald-500/50 bg-emerald-500/20 text-emerald-400">
            <Check className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-400">Profile Complete</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your information has been saved</p>
          </div>
        </div>
      </button>

      {/* Document checklist */}
      <div className="space-y-3">
        {(["w9_1099", "contractor_agreement"] as DocumentType[]).map((docType) => {
          const isSigned = status[docType] === "signed"
          const isActive = activeDoc === docType
          const label = DOC_LABELS[docType]

          return (
            <button
              key={docType}
              type="button"
              onClick={() => !isSigned && setActiveDoc(docType)}
              disabled={isSigned}
              className={`w-full text-left rounded-md border p-4 transition-all ${
                isActive
                  ? "border-steel/50 bg-steel/5"
                  : isSigned
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-surface hover:border-steel/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-sm border ${
                    isSigned
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : isActive
                        ? "border-steel/50 bg-steel/10 text-steel"
                        : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {isSigned ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSigned ? "text-emerald-400" : "text-foreground"}`}>
                    {label.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isSigned ? "Signed" : label.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Active document signing area */}
      {activeDoc && !allSigned && (
        <div className="rounded-md border border-border bg-surface p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {DOC_LABELS[activeDoc].title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              By signing below, I, <span className="text-foreground">{userName}</span>,
              acknowledge that I have read and agree to the terms of this document.
            </p>
          </div>

          {/* Full legal document */}
          <div className="rounded-sm border border-border bg-background p-4 max-h-64 overflow-y-auto">
            {activeDoc === "w9_1099" ? <W9Content /> : <ContractorAgreementContent />}
          </div>

          {/* Tax ID field — required for W-9 only */}
          {activeDoc === "w9_1099" && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Taxpayer Identification Number (SSN or EIN) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="XX-XXXXXXX or XXX-XX-XXXX"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-border focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/30 transition-colors"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Required by the IRS for 1099 reporting. This will be kept confidential.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs font-medium uppercase tracking-wider text-red-400">
              {error}
            </p>
          )}

          {/* Signature pad */}
          <SignaturePad onSign={handleSign} disabled={isPending || (activeDoc === "w9_1099" && !taxId.trim())} />
        </div>
      )}

      {/* All signed state */}
      {allSigned && (
        <div className="text-center py-8 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">All documents signed</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Redirecting to dashboard...
          </p>
        </div>
      )}
    </div>
  )
}
