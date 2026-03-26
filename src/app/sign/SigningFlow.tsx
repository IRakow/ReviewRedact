"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SignaturePad } from "@/components/sign/SignaturePad"
import { signDocument, refreshSessionAfterSigning } from "./actions"
import type { DocumentType, UserRole } from "@/lib/types"
import { Check, FileText, Loader2 } from "lucide-react"

interface SigningFlowProps {
  initialStatus: {
    w9_1099: "pending" | "signed"
    contractor_agreement: "pending" | "signed"
  }
  userName: string
  userType: UserRole
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

export function SigningFlow({ initialStatus, userName, userType }: SigningFlowProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [activeDoc, setActiveDoc] = useState<DocumentType | null>(
    initialStatus.w9_1099 === "pending"
      ? "w9_1099"
      : initialStatus.contractor_agreement === "pending"
        ? "contractor_agreement"
        : null
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const allSigned = status.w9_1099 === "signed" && status.contractor_agreement === "signed"

  async function handleSign(data: {
    type: "draw" | "typed"
    image_data?: string
    typed_name?: string
    font?: string
  }) {
    if (!activeDoc) return
    setError("")

    startTransition(async () => {
      const result = await signDocument(activeDoc, data)

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
        await refreshSessionAfterSigning()
        router.push("/dashboard")
      }
    })
  }

  return (
    <div className="space-y-6">
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

          {/* Agreement text summary */}
          <div className="rounded-sm border border-border bg-background p-4 max-h-48 overflow-y-auto">
            {activeDoc === "w9_1099" ? (
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">W-9 Request for Taxpayer Identification Number</p>
                <p>Under penalties of perjury, I certify that:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>The number shown on this form is my correct taxpayer identification number</li>
                  <li>I am not subject to backup withholding</li>
                  <li>I am a U.S. citizen or other U.S. person</li>
                  <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct</li>
                </ol>
                <p className="text-[10px] mt-3">The Internal Revenue Service does not require your consent to any provision of this document other than the certifications required to avoid backup withholding.</p>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Independent Contractor Agreement</p>
                <p>This Agreement is entered into between Business Threat Solutions, LLC (&ldquo;Company&rdquo;) and the undersigned independent contractor (&ldquo;Contractor&rdquo;).</p>
                <p>Key terms:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Contractor status: You are an independent contractor, not an employee</li>
                  <li>Non-disclosure: All client information is strictly confidential</li>
                  <li>Non-compete: You agree not to directly solicit Company clients</li>
                  <li>Payment: Per the rate schedule agreed upon in your onboarding</li>
                  <li>Term: This agreement remains in effect until terminated by either party</li>
                </ul>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs font-medium uppercase tracking-wider text-red-400">
              {error}
            </p>
          )}

          {/* Signature pad */}
          <SignaturePad onSign={handleSign} disabled={isPending} />
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
