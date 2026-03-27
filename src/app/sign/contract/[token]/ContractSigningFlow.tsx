"use client"

import { useState, useTransition } from "react"
import { SignaturePad } from "@/components/sign/SignaturePad"
import { signContract } from "./actions"
import type { Client, Review } from "@/lib/types"

interface ContractSigningFlowProps {
  token: string
  client: Client
  reviews: Review[]
  contractRate: number
  reviewCount: number
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ContractSigningFlow({
  token,
  client,
  reviews,
  contractRate,
  reviewCount,
}: ContractSigningFlowProps) {
  const [signerName, setSignerName] = useState(client.owner_name || "")
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [signed, setSigned] = useState(false)
  const [isPending, startTransition] = useTransition()

  const totalFee = contractRate * reviewCount

  async function handleSign(data: {
    type: "draw" | "typed"
    image_data?: string
    typed_name?: string
    font?: string
  }) {
    if (!signerName.trim()) {
      setError("Please enter your full legal name")
      return
    }
    if (!agreed) {
      setError("You must agree to the terms before signing")
      return
    }

    setError("")

    startTransition(async () => {
      try {
        const result = await signContract(token, {
          signerName: signerName.trim(),
          signature: data,
        })

        if (result.error) {
          setError(result.error)
          return
        }

        setSigned(true)
      } catch {
        setError("Something went wrong — please try again")
      }
    })
  }

  if (signed) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white">Contract signed successfully</p>
        <p className="text-xs text-[#9ca3af]">
          A confirmation email with the signed contract has been sent to your email address.
        </p>
        <div className="pt-4">
          <a
            href={`/api/contracts/signed/${token}`}
            className="inline-flex items-center gap-2 rounded-sm border border-[#374151] bg-[#111827] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#d1d5db] transition-all hover:bg-[#1f2937] hover:border-[#4b5563]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Signed Contract
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract summary */}
      <div className="rounded-md border border-[#374151] bg-[#111827] p-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-[#9ca3af]">Rate per review</span>
          <span className="text-lg font-bold font-mono text-white">{formatCurrency(contractRate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-[#9ca3af]">Reviews selected</span>
          <span className="text-xs font-mono text-[#d1d5db]">{reviewCount}</span>
        </div>
        <div className="flex justify-between border-t border-[#374151] pt-2">
          <span className="text-xs uppercase tracking-wider text-[#9ca3af]">Total potential fee</span>
          <span className="text-sm font-bold font-mono text-white">{formatCurrency(totalFee)}</span>
        </div>
      </div>

      {/* Full contract text */}
      <div className="rounded-md border border-[#374151] bg-[#0d1117] max-h-[400px] overflow-y-auto">
        <div className="p-5 space-y-5 text-xs text-[#9ca3af] leading-relaxed">
          {/* Title */}
          <div className="text-center border-b border-[#374151] pb-4">
            <p className="text-sm font-bold text-white uppercase tracking-wide">
              Digital Reputation Management Contract
            </p>
            <p className="text-[10px] text-[#6b7280] mt-1">
              Date: {new Date().toLocaleDateString("en-US")}
            </p>
          </div>

          {/* Client Info */}
          <div className="space-y-1">
            <p><span className="text-[#d1d5db]">Client:</span> {client.business_name}</p>
            <p><span className="text-[#d1d5db]">Client Representative:</span> {client.owner_name}</p>
            {client.owner_email && <p><span className="text-[#d1d5db]">Email:</span> {client.owner_email}</p>}
            <p><span className="text-[#d1d5db]">Address:</span> {client.address}</p>
          </div>

          <p>
            This Digital Reputation Management Contract (this &ldquo;Contract&rdquo;) is entered into as of the
            date last signed below, by and between BTS Solutions, LLC (&ldquo;BTS&rdquo;) and the client
            identified above (&ldquo;Client&rdquo;).
          </p>

          {/* Section 1 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 1 - Scope of Work</p>
            <p>
              Client is a business / professional services enterprise / individual that is desirous of
              engaging BTS to remove inaccurate, incomplete and or unfair, derogatory content that
              appears in Google Reviews regarding the Client.
            </p>
            <p className="mt-2 font-semibold text-[#d1d5db]">
              Google Review Description &amp; Number: {reviews.length} Google Review{reviews.length !== 1 ? "s" : ""} selected for removal:
            </p>
            <div className="mt-1 space-y-1 pl-3">
              {reviews.map((r, i) => {
                const text = r.review_text
                  ? r.review_text.length > 80
                    ? r.review_text.substring(0, 80) + "..."
                    : r.review_text
                  : "(no text)"
                return (
                  <p key={r.id}>
                    {i + 1}. {r.reviewer_name} - {r.star_rating} star{r.star_rating !== 1 ? "s" : ""} - &ldquo;{text}&rdquo;
                  </p>
                )
              })}
            </div>
            <p className="mt-2">
              It is expressly understood by Client that in conjunction with the performance of the
              services contemplated within this scope of work, BTS shall utilize its proprietary
              technology platform, Review Redact. Client has been informed by BTS through its
              authorized representatives that the Google Reviews identified in this scope of work
              will likely be removed within 8-14 days from the date of Client&apos;s execution of
              this Contract.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 2 - BTS Fees and Payment Terms</p>
            <p>
              Client shall remit to BTS a fee in the amount of {formatCurrency(contractRate)} for
              each Google Review that is removed. The BTS Fee shall be due and payable by Client
              immediately upon removal of each such Google Review. Client shall not be liable to BTS
              for the payment of any fee or out of pocket expense incurred by BTS related to any
              Google Review that is not removed.
            </p>
            <p className="mt-1 font-semibold text-[#d1d5db]">
              Total potential fee ({reviewCount} reviews x {formatCurrency(contractRate)}): {formatCurrency(totalFee)}
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 3 - Compliance with Applicable Laws</p>
            <p>
              Both BTS and Client agree to comply with all applicable federal, state, and local laws,
              rules, and regulations in connection with the performance of their respective obligations
              under this Contract. BTS represents that its methods for seeking review removal comply
              with applicable terms of service and legal requirements. Nothing in this Contract shall
              be construed to require either party to take any action in violation of applicable law.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 4 - Termination</p>
            <p>
              Either party may terminate this Contract upon thirty (30) days written notice to the
              other party. BTS may terminate this Contract immediately if Client fails to make any
              payment when due. Upon termination, Client shall remain responsible for payment of fees
              for any Google Reviews that have been removed prior to the effective date of termination.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 5 - Obligation for Payment if Client Terminates</p>
            <p>
              In the event Client terminates this Contract prior to the completion of BTS&apos;s services,
              Client shall remain obligated to pay BTS for each Google Review that has been removed as
              of the date of termination. Client acknowledges that BTS incurs costs and expends resources
              upon execution of this Contract, and that this payment obligation is fair and reasonable.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 6 - Client&apos;s Representations</p>
            <p>
              Client represents and warrants that: (a) the Google Reviews identified in Section 1
              contain content that Client believes in good faith to be inaccurate, incomplete, unfair,
              or derogatory; (b) Client has the authority to enter into this Contract; (c) Client will
              provide BTS with all information and cooperation reasonably necessary for BTS to perform
              its services; and (d) Client will not take any action to interfere with BTS&apos;s efforts
              to remove the identified Google Reviews.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 7 - Option to Become Retainer Client</p>
            <p>
              Upon completion of the services described herein, Client shall have the option to engage
              BTS on a monthly retainer basis for ongoing digital reputation monitoring and management
              services. The terms of any such retainer arrangement shall be set forth in a separate
              agreement between the parties. BTS shall provide Client with information regarding its
              retainer programs upon request.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 8 - Total Agreement</p>
            <p>
              This Contract constitutes the entire agreement between the parties with respect to the
              subject matter hereof and supersedes all prior and contemporaneous agreements,
              understandings, negotiations, and discussions, whether oral or written, between the
              parties. No amendment, modification, or waiver of any provision of this Contract shall
              be effective unless in writing and signed by both parties.
            </p>
          </div>

          {/* Section 9 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 9 - Notice</p>
            <p>
              All notices, requests, demands, and other communications under this Contract shall be
              in writing and shall be deemed to have been duly given when delivered personally, sent
              by confirmed email, or sent by certified mail, return receipt requested, to the parties
              at their respective addresses on file.
            </p>
          </div>

          {/* Section 10 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 10 - Governing Law</p>
            <p>
              This Contract shall be governed by and construed in accordance with the laws of the
              State of Missouri, without regard to its conflict of law principles. The parties agree
              that any legal action or proceeding arising under this Contract shall be brought
              exclusively in the state or federal courts located in the State of Missouri.
            </p>
          </div>

          {/* Section 11 */}
          <div>
            <p className="font-semibold text-[#d1d5db] mb-1">Section 11 - Dispute Resolution / Jury Trial Waiver</p>
            <p>
              In the event of any dispute arising out of or relating to this Contract, the parties
              agree to first attempt to resolve the dispute through good faith negotiation. If the
              dispute cannot be resolved through negotiation within thirty (30) days, either party
              may pursue resolution through binding arbitration administered by the American
              Arbitration Association in accordance with its Commercial Arbitration Rules, with
              the arbitration to take place in the State of Missouri.
            </p>
            <p className="mt-2 font-semibold text-[#d1d5db] uppercase text-[10px]">
              EACH PARTY HEREBY WAIVES, TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ANY RIGHT
              IT MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY SUIT, ACTION, OR PROCEEDING ARISING
              OUT OF OR RELATING TO THIS CONTRACT.
            </p>
          </div>
        </div>
      </div>

      {/* Signing area */}
      <div className="rounded-md border border-[#374151] bg-[#111827] p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Sign Contract</h2>
          <p className="text-[10px] text-[#9ca3af] mt-1 uppercase tracking-wider">
            All fields required
          </p>
        </div>

        {/* Signer name */}
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] mb-1.5">
            Full Legal Name
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Enter your full legal name"
            disabled={isPending}
            className="w-full rounded-sm border border-[#374151] bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-white placeholder:text-[#374151] focus:border-[#6b7280]/50 focus:outline-none focus:ring-1 focus:ring-[#6b7280]/30 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Agreement checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isPending}
              className="sr-only"
            />
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${
                agreed
                  ? "border-emerald-500/50 bg-emerald-500/20"
                  : "border-[#374151] bg-[#0a0a0a] group-hover:border-[#6b7280]/50"
              }`}
            >
              {agreed && (
                <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs text-[#9ca3af] leading-relaxed">
            I have read and agree to all terms of this Digital Reputation Management Contract.
            I understand that this is a legally binding agreement.
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-xs font-medium uppercase tracking-wider text-red-400">{error}</p>
        )}

        {/* Signature Pad */}
        <SignaturePad onSign={handleSign} disabled={isPending || !agreed || !signerName.trim()} />
      </div>
    </div>
  )
}
