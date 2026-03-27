import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ContractSigningFlow } from "./ContractSigningFlow"
import type { Client, Review } from "@/lib/types"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ContractSigningPage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServerClient()

  // Look up contract by signing_token
  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("signing_token", token)
    .single()

  if (!contract) notFound()

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", contract.client_id)
    .single()

  if (!client) notFound()

  // Get selected reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .in("id", contract.selected_review_ids || [])

  const isSigned = contract.status === "signed"

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#6b7280]/30 bg-[#6b7280]/5 font-mono text-lg font-bold text-[#9ca3af]">
            RR
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] mb-1">
            Business Threat Solutions, LLC
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {isSigned ? "Contract Signed" : "Digital Reputation Management Contract"}
          </h1>
          <p className="mt-1 text-sm text-[#9ca3af]">
            {client.business_name} — {client.owner_name}
          </p>
        </div>

        {isSigned ? (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">This contract has been signed</p>
            <p className="text-xs text-[#9ca3af]">
              Signed by {contract.signer_name || client.owner_name} on{" "}
              {contract.signed_at
                ? new Date(contract.signed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
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
        ) : (
          <ContractSigningFlow
            token={token}
            client={client as Client}
            reviews={(reviews || []) as Review[]}
            contractRate={contract.contract_rate_google ?? 0}
            reviewCount={contract.google_review_count ?? 0}
          />
        )}

        <p className="mt-8 text-center text-[10px] text-[#6b7280]">
          Powered by Business Threat Solutions, LLC — Secure Contract Signing
        </p>
      </div>
    </div>
  )
}
