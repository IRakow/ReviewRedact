"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { logAudit, getRecordForAudit } from "@/lib/audit"

// ─── Helpers ────────────────────────────────────────────────────────────────

async function requireOwner() {
  const session = await getSession()
  if (!session || session.user_type !== "owner") {
    throw new Error("Unauthorized")
  }
  return session
}

// ─── Financial Overview ─────────────────────────────────────────────────────

export async function getFinancialOverview() {
  await requireOwner()
  const supabase = createServerClient()

  const [
    { data: paidInvoices },
    { data: pendingCosts },
    { data: paidCosts },
    { data: pendingPayouts },
    { data: paidPayouts },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, total_amount, reseller_amount, salesperson_amount")
      .eq("status", "paid"),
    supabase
      .from("removal_costs")
      .select("id, cost_per_removal")
      .eq("status", "pending"),
    supabase
      .from("removal_costs")
      .select("id, cost_per_removal")
      .eq("status", "paid"),
    supabase
      .from("payouts")
      .select("id, amount")
      .eq("status", "pending"),
    supabase
      .from("payouts")
      .select("id, amount")
      .eq("status", "paid"),
  ])

  const revenue = (paidInvoices ?? []).reduce(
    (s, i) => s + Number(i.total_amount),
    0
  )

  const filingFeesOwed = (pendingCosts ?? []).reduce(
    (s, c) => s + Number(c.cost_per_removal),
    0
  )

  const filingFeesPaid = (paidCosts ?? []).reduce(
    (s, c) => s + Number(c.cost_per_removal),
    0
  )

  const commissionsOwed = (pendingPayouts ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  )

  const commissionsPaid = (paidPayouts ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  )

  const netProfit = revenue - filingFeesPaid - commissionsPaid

  return {
    revenue,
    filingFeesOwed,
    filingFeesPaid,
    commissionsOwed,
    commissionsPaid,
    netProfit,
    pendingCostCount: pendingCosts?.length ?? 0,
  }
}

// ─── Money Flow Table ───────────────────────────────────────────────────────

export interface MoneyFlowRow {
  invoiceId: string
  clientName: string
  paidAt: string | null
  paymentMethod: string | null
  revenue: number
  filingFee: number
  resellerCut: number
  spCut: number
  btsNet: number
  allPaid: boolean
  reviewCount: number
}

export async function getMoneyFlow(
  page = 1,
  limit = 25
): Promise<{ rows: MoneyFlowRow[]; total: number }> {
  await requireOwner()
  const supabase = createServerClient()

  const offset = (page - 1) * limit

  const { data: invoices, count } = await supabase
    .from("invoices")
    .select(
      "id, client_id, total_amount, reseller_amount, salesperson_amount, status, paid_at, payment_method, review_ids, created_at",
      { count: "exact" }
    )
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (!invoices || invoices.length === 0) {
    return { rows: [], total: 0 }
  }

  // Get client names
  const clientIds = [...new Set(invoices.map((i) => i.client_id))]
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name")
    .in("id", clientIds)

  const clientMap = new Map(
    (clients ?? []).map((c) => [c.id, c.business_name])
  )

  // Get filing fee rate
  const filingRate = await getFilingFeeRate()

  // Check removal_costs and payouts status per invoice
  const invoiceIds = invoices.map((i) => i.id)
  const { data: costs } = await supabase
    .from("removal_costs")
    .select("invoice_id, status")
    .in("invoice_id", invoiceIds)

  const { data: payouts } = await supabase
    .from("payouts")
    .select("invoice_id, status")
    .in("invoice_id", invoiceIds)

  const rows: MoneyFlowRow[] = invoices.map((inv) => {
    const reviewCount = Array.isArray(inv.review_ids)
      ? inv.review_ids.length
      : 0
    const filingFee = filingRate * reviewCount
    const revenue = Number(inv.total_amount)
    const resellerCut = Number(inv.reseller_amount)
    const spCut = Number(inv.salesperson_amount)
    const btsNet = revenue - filingFee - resellerCut - spCut

    const invCosts = (costs ?? []).filter((c) => c.invoice_id === inv.id)
    const invPayouts = (payouts ?? []).filter((p) => p.invoice_id === inv.id)

    const allCostsPaid =
      invCosts.length === 0 || invCosts.every((c) => c.status === "paid")
    const allPayoutsPaid =
      invPayouts.length === 0 || invPayouts.every((p) => p.status === "paid")

    return {
      invoiceId: inv.id,
      clientName: clientMap.get(inv.client_id) ?? "Unknown",
      paidAt: inv.paid_at,
      paymentMethod: inv.payment_method,
      revenue,
      filingFee,
      resellerCut,
      spCut,
      btsNet,
      allPaid: allCostsPaid && allPayoutsPaid,
      reviewCount,
    }
  })

  return { rows, total: count ?? 0 }
}

// ─── Filing Fees ────────────────────────────────────────────────────────────

export interface FilingFeeRow {
  id: string
  reviewId: string
  reviewerName: string
  clientName: string
  amount: number
  status: string
  paidAt: string | null
  paymentReference: string | null
  providerName: string
  createdAt: string
}

export async function getFilingFees(
  filter: "all" | "pending" | "paid" = "all"
): Promise<FilingFeeRow[]> {
  await requireOwner()
  const supabase = createServerClient()

  let query = supabase
    .from("removal_costs")
    .select("id, review_id, invoice_id, provider_name, cost_per_removal, status, paid_at, payment_reference, created_at")
    .order("created_at", { ascending: false })

  if (filter === "pending") query = query.eq("status", "pending")
  if (filter === "paid") query = query.eq("status", "paid")

  const { data: costs } = await query

  if (!costs || costs.length === 0) return []

  // Get review + client info
  const reviewIds = costs.map((c) => c.review_id)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_name, client_id")
    .in("id", reviewIds)

  const clientIds = [
    ...new Set((reviews ?? []).map((r) => r.client_id)),
  ]
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name")
    .in("id", clientIds.length > 0 ? clientIds : ["__none__"])

  const reviewMap = new Map(
    (reviews ?? []).map((r) => [r.id, r])
  )
  const clientMap = new Map(
    (clients ?? []).map((c) => [c.id, c.business_name])
  )

  return costs.map((c) => {
    const review = reviewMap.get(c.review_id)
    return {
      id: c.id,
      reviewId: c.review_id,
      reviewerName: review?.reviewer_name ?? "Unknown",
      clientName: review
        ? clientMap.get(review.client_id) ?? "Unknown"
        : "Unknown",
      amount: Number(c.cost_per_removal),
      status: c.status,
      paidAt: c.paid_at,
      paymentReference: c.payment_reference,
      providerName: c.provider_name,
      createdAt: c.created_at,
    }
  })
}

export async function markFilingFeePaid(
  costId: string,
  paymentReference?: string
) {
  await requireOwner()
  const old = await getRecordForAudit("removal_costs", costId)
  const supabase = createServerClient()

  const newValues = {
    status: "paid",
    paid_at: new Date().toISOString(),
    payment_reference: paymentReference ?? null,
  }

  const { error } = await supabase
    .from("removal_costs")
    .update(newValues)
    .eq("id", costId)

  if (error) throw new Error(error.message)

  await logAudit({ tableName: "removal_costs", recordId: costId, action: "update", oldValues: old, newValues })

  return { success: true }
}

export async function bulkMarkFilingFeesPaid(costIds: string[]) {
  await requireOwner()
  const supabase = createServerClient()

  const { error } = await supabase
    .from("removal_costs")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .in("id", costIds)

  if (error) throw new Error(error.message)
  return { success: true }
}

// ─── Commissions / Payouts ──────────────────────────────────────────────────

export interface CommissionRow {
  id: string
  recipientName: string
  recipientType: "reseller" | "salesperson"
  invoiceId: string
  clientName: string
  amount: number
  status: string
  paidAt: string | null
  createdAt: string
}

export async function getCommissions(
  recipientType: "reseller" | "salesperson"
): Promise<CommissionRow[]> {
  await requireOwner()
  const supabase = createServerClient()

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, invoice_id, recipient_type, recipient_id, amount, status, paid_at, created_at")
    .eq("recipient_type", recipientType)
    .order("created_at", { ascending: false })

  if (!payouts || payouts.length === 0) return []

  // Get recipient names
  const recipientIds = [...new Set(payouts.map((p) => p.recipient_id))]
  const table =
    recipientType === "reseller" ? "resellers" : "salespeople"

  const { data: recipients } = await supabase
    .from(table)
    .select("id, name")
    .in("id", recipientIds)

  const nameMap = new Map(
    (recipients ?? []).map((r) => [r.id, r.name])
  )

  // Get client names via invoices
  const invoiceIds = [...new Set(payouts.map((p) => p.invoice_id))]
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, client_id")
    .in("id", invoiceIds)

  const clientIds = [
    ...new Set((invoices ?? []).map((i) => i.client_id)),
  ]
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name")
    .in("id", clientIds.length > 0 ? clientIds : ["__none__"])

  const invoiceClientMap = new Map(
    (invoices ?? []).map((i) => [i.id, i.client_id])
  )
  const clientMap = new Map(
    (clients ?? []).map((c) => [c.id, c.business_name])
  )

  return payouts.map((p) => {
    const clientId = invoiceClientMap.get(p.invoice_id)
    return {
      id: p.id,
      recipientName: nameMap.get(p.recipient_id) ?? "Unknown",
      recipientType: p.recipient_type,
      invoiceId: p.invoice_id,
      clientName: clientId
        ? clientMap.get(clientId) ?? "Unknown"
        : "Unknown",
      amount: Number(p.amount),
      status: p.status,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    }
  })
}

export async function markPayoutPaid(
  payoutId: string,
  paymentReference?: string
) {
  await requireOwner()
  const old = await getRecordForAudit("payouts", payoutId)
  const supabase = createServerClient()

  const newValues = {
    status: "paid",
    paid_at: new Date().toISOString(),
    notes: paymentReference ? `Ref: ${paymentReference}` : null,
  }

  const { error } = await supabase
    .from("payouts")
    .update(newValues)
    .eq("id", payoutId)

  if (error) throw new Error(error.message)

  await logAudit({ tableName: "payouts", recordId: payoutId, action: "update", oldValues: old, newValues })

  return { success: true }
}

// ─── Filing Fee Rate ────────────────────────────────────────────────────────

export async function getFilingFeeRate(): Promise<number> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "filing_fee_per_removal")
    .single()

  if (data?.value && typeof data.value === "object" && "amount" in data.value) {
    return Number(data.value.amount)
  }

  return 275 // fallback default
}

export async function updateFilingFeeRate(newRate: number) {
  const session = await requireOwner()
  const supabase = createServerClient()

  if (newRate < 0 || newRate > 10000) {
    throw new Error("Invalid filing fee rate")
  }

  // Fetch old value for audit
  const { data: oldSetting } = await supabase
    .from("system_settings")
    .select("*")
    .eq("key", "filing_fee_per_removal")
    .maybeSingle()

  const { error } = await supabase
    .from("system_settings")
    .upsert({
      key: "filing_fee_per_removal",
      value: { amount: newRate },
      updated_by: session.name,
      updated_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)

  await logAudit({
    tableName: "system_settings",
    recordId: "filing_fee_per_removal",
    action: oldSetting ? "update" : "create",
    oldValues: oldSetting ? (oldSetting as Record<string, unknown>) : null,
    newValues: { key: "filing_fee_per_removal", value: { amount: newRate } },
  })

  return { success: true }
}

export async function getFilingFeeHistory(): Promise<
  Array<{ updatedBy: string; updatedAt: string; amount: number }>
> {
  await requireOwner()
  const supabase = createServerClient()

  const { data } = await supabase
    .from("system_settings")
    .select("value, updated_by, updated_at")
    .eq("key", "filing_fee_per_removal")
    .single()

  if (!data) return []

  // Single row — return current state as history entry
  return [
    {
      updatedBy: data.updated_by ?? "System",
      updatedAt: data.updated_at,
      amount:
        typeof data.value === "object" && data.value && "amount" in data.value
          ? Number(data.value.amount)
          : 275,
    },
  ]
}

// ─── Create Removal Costs (called when reviews marked removed) ──────────────

export async function createRemovalCosts(
  reviewIds: string[],
  invoiceId: string
) {
  const supabase = createServerClient()
  const rate = await getFilingFeeRate()

  const rows = reviewIds.map((reviewId) => ({
    review_id: reviewId,
    invoice_id: invoiceId,
    cost_per_removal: rate,
    status: "pending" as const,
  }))

  const { error } = await supabase.from("removal_costs").insert(rows)

  if (error) throw new Error(error.message)
  return { success: true }
}

// ─── Payment Reconciliation ─────────────────────────────────────────────────

export interface ReconciliationRow {
  invoiceId: string
  clientName: string
  totalAmount: number
  status: string
  paymentToken: string | null
  paymentMethod: string | null
  paidAt: string | null
  createdAt: string
}

export async function getReconciliation(): Promise<ReconciliationRow[]> {
  await requireOwner()
  const supabase = createServerClient()

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, client_id, total_amount, status, payment_token, payment_method, paid_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  if (!invoices || invoices.length === 0) return []

  const clientIds = [...new Set(invoices.map((i) => i.client_id))]
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name")
    .in("id", clientIds)

  const clientMap = new Map(
    (clients ?? []).map((c) => [c.id, c.business_name])
  )

  return invoices.map((inv) => ({
    invoiceId: inv.id,
    clientName: clientMap.get(inv.client_id) ?? "Unknown",
    totalAmount: Number(inv.total_amount),
    status: inv.status,
    paymentToken: inv.payment_token,
    paymentMethod: inv.payment_method,
    paidAt: inv.paid_at,
    createdAt: inv.created_at,
  }))
}
