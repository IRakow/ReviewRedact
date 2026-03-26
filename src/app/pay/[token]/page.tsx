import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { PaymentForm } from "./PaymentForm"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServerClient()

  // Look up invoice by payment token
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total_amount, status, due_at, client_id")
    .eq("payment_token", token)
    .single()

  if (!invoice) notFound()

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, owner_name")
    .eq("id", invoice.client_id)
    .single()

  const isPaid = invoice.status === "paid"
  const isOverdue = invoice.status === "overdue"

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#6b7280]/30 bg-[#6b7280]/5 font-mono text-lg font-bold text-[#9ca3af]">
            RR
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {isPaid ? "Payment Complete" : "Pay Invoice"}
          </h1>
          <p className="mt-1 text-sm text-[#9ca3af]">
            {client?.business_name ?? "Business"} — {client?.owner_name ?? ""}
          </p>
        </div>

        {/* Invoice summary */}
        <div className="rounded-md border border-[#374151] bg-[#111827] p-6 mb-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-[#9ca3af]">Amount Due</span>
            <span className="text-2xl font-bold font-mono text-white">
              ${Number(invoice.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[#9ca3af]">Invoice #</span>
            <span className="text-xs font-mono text-[#d1d5db]">INV-{invoice.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[#9ca3af]">Due</span>
            <span className={`text-xs font-mono ${isOverdue ? "text-red-400" : "text-[#d1d5db]"}`}>
              {invoice.due_at
                ? new Date(invoice.due_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : "Upon receipt"}
              {isOverdue && " (OVERDUE)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[#9ca3af]">Status</span>
            <span className={`text-xs font-semibold uppercase ${isPaid ? "text-emerald-400" : isOverdue ? "text-red-400" : "text-amber-400"}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {isPaid ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Thank you for your payment</p>
            <p className="text-xs text-[#9ca3af]">A receipt has been sent to your email.</p>
          </div>
        ) : (
          <PaymentForm
            invoiceId={invoice.id}
            amount={Number(invoice.total_amount)}
            token={token}
          />
        )}

        <p className="mt-8 text-center text-[10px] text-[#6b7280]">
          Powered by Business Threat Solutions, LLC — Secure Payment
        </p>
      </div>
    </div>
  )
}
