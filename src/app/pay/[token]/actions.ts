"use server"

import { createServerClient } from "@/lib/supabase/server"
import { processPayment } from "@/lib/payments"
import { notify } from "@/lib/notifications"

export async function submitPayment(formData: FormData) {
  const invoiceId = formData.get("invoice_id") as string
  const token = formData.get("token") as string
  const method = formData.get("method") as "credit_card" | "ach"

  if (!invoiceId || !token || !method) {
    return { error: "Missing required fields" }
  }

  const supabase = createServerClient()

  // Verify invoice exists and matches token
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total_amount, status, client_id, reseller_id, salesperson_id, review_ids")
    .eq("id", invoiceId)
    .eq("payment_token", token)
    .single()

  if (!invoice) {
    return { error: "Invoice not found" }
  }

  if (invoice.status === "paid") {
    return { error: "This invoice has already been paid" }
  }

  const amount = Number(invoice.total_amount)

  // Process payment
  const paymentParams: Parameters<typeof processPayment>[0] = {
    method,
    amount,
    invoiceId: invoice.id,
  }

  if (method === "credit_card") {
    paymentParams.creditCard = {
      cardNumber: formData.get("card_number") as string,
      expiry: formData.get("expiry") as string,
      cvv: formData.get("cvv") as string,
      zip: formData.get("zip") as string,
    }
  } else {
    paymentParams.ach = {
      routingNumber: formData.get("routing_number") as string,
      accountNumber: formData.get("account_number") as string,
      accountType: (formData.get("account_type") as "checking" | "savings") ?? "checking",
    }
  }

  const result = await processPayment(paymentParams)

  if (!result.success) {
    return { error: result.error ?? "Payment failed. Please try again." }
  }

  // Record payment
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      invoice_id: invoice.id,
      amount,
      method,
      processor_ref: result.transactionId,
      status: "completed",
    })
    .select("id")
    .single()

  // Update invoice status
  await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: method,
      payment_reference: result.transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id)

  // Update review statuses to "paid"
  const reviewIds = invoice.review_ids as string[]
  if (reviewIds.length > 0) {
    await supabase
      .from("reviews")
      .update({ status: "paid" })
      .in("id", reviewIds)
  }

  // Create payout records
  if (payment) {
    // Get the invoice splits to create payouts
    const { data: fullInvoice } = await supabase
      .from("invoices")
      .select("reseller_id, salesperson_id, reseller_amount, salesperson_amount")
      .eq("id", invoice.id)
      .single()

    if (fullInvoice) {
      const payoutRows = []

      if (fullInvoice.reseller_id && Number(fullInvoice.reseller_amount) > 0) {
        payoutRows.push({
          invoice_id: invoice.id,
          payment_id: payment.id,
          recipient_type: "reseller",
          recipient_id: fullInvoice.reseller_id,
          amount: fullInvoice.reseller_amount,
          status: "pending",
        })
      }

      if (fullInvoice.salesperson_id && Number(fullInvoice.salesperson_amount) > 0) {
        payoutRows.push({
          invoice_id: invoice.id,
          payment_id: payment.id,
          recipient_type: "salesperson",
          recipient_id: fullInvoice.salesperson_id,
          amount: fullInvoice.salesperson_amount,
          status: "pending",
        })
      }

      if (payoutRows.length > 0) {
        await supabase.from("payouts").insert(payoutRows)
      }
    }
  }

  // Send notifications — payment received to reseller + salesperson
  const { data: client } = await supabase
    .from("clients")
    .select("business_name")
    .eq("id", invoice.client_id)
    .single()

  let resellerEmail: string | undefined
  let salespersonEmail: string | undefined

  if (invoice.reseller_id) {
    const { data: r } = await supabase.from("resellers").select("email").eq("id", invoice.reseller_id).single()
    resellerEmail = r?.email
  }
  if (invoice.salesperson_id) {
    const { data: s } = await supabase.from("salespeople").select("email").eq("id", invoice.salesperson_id).single()
    salespersonEmail = s?.email
  }

  await notify({
    event: "payment_received",
    metadata: {
      clientBusinessName: client?.business_name ?? "Client",
      amount,
      resellerEmail,
      salespersonEmail,
      resellerId: invoice.reseller_id,
      salespersonId: invoice.salesperson_id,
    },
  })

  return { success: true }
}
