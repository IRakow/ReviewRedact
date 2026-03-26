"use client"

import { useState, useTransition } from "react"
import { submitPayment } from "./actions"

interface PaymentFormProps {
  invoiceId: string
  amount: number
  token: string
}

export function PaymentForm({ invoiceId, amount, token }: PaymentFormProps) {
  const [method, setMethod] = useState<"credit_card" | "ach">("credit_card")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    formData.set("method", method)
    formData.set("invoice_id", invoiceId)
    formData.set("token", token)

    startTransition(async () => {
      const result = await submitPayment(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white">Payment Submitted</p>
        <p className="text-xs text-[#9ca3af]">Your payment is being processed. You'll receive a confirmation email shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Method toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("credit_card")}
          className={`flex-1 rounded-sm border py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            method === "credit_card"
              ? "border-[#6b7280]/50 bg-[#6b7280]/15 text-[#d1d5db]"
              : "border-[#374151] bg-[#111827] text-[#6b7280] hover:border-[#6b7280]/30"
          }`}
        >
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("ach")}
          className={`flex-1 rounded-sm border py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            method === "ach"
              ? "border-[#6b7280]/50 bg-[#6b7280]/15 text-[#d1d5db]"
              : "border-[#374151] bg-[#111827] text-[#6b7280] hover:border-[#6b7280]/30"
          }`}
        >
          ACH / Bank Transfer
        </button>
      </div>

      {method === "credit_card" ? (
        <div className="space-y-3">
          <input name="card_number" type="text" placeholder="Card Number" required maxLength={19}
            className="w-full rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
          <div className="grid grid-cols-3 gap-3">
            <input name="expiry" type="text" placeholder="MM/YY" required maxLength={5}
              className="rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
            <input name="cvv" type="text" placeholder="CVV" required maxLength={4}
              className="rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
            <input name="zip" type="text" placeholder="ZIP" required maxLength={10}
              className="rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input name="routing_number" type="text" placeholder="Routing Number" required maxLength={9}
            className="w-full rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
          <input name="account_number" type="text" placeholder="Account Number" required
            className="w-full rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 font-mono text-sm text-white placeholder:text-[#6b7280] focus:border-[#6b7280]/50 focus:outline-none" />
          <select name="account_type" defaultValue="checking"
            className="w-full rounded-sm border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-white focus:border-[#6b7280]/50 focus:outline-none">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-sm border border-[#6b7280]/30 bg-[#6b7280]/10 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-[#d1d5db] transition-all hover:bg-[#6b7280]/20 hover:border-[#6b7280]/50 disabled:opacity-30"
      >
        {isPending ? "Processing..." : `Pay $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
      </button>
    </form>
  )
}
