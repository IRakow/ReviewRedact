// ─── User Types ──────────────────────────────────────────────────────────────

export type UserRole = "owner" | "reseller" | "salesperson"

export interface Reseller {
  id: string
  name: string
  email: string
  cell: string
  pin_code: string
  company: string | null
  address: string | null
  tax_id_1099: string | null
  base_rate_google: number
  base_rate_facebook: number
  role: "owner" | "reseller"
  commission_plan_type: CommissionPlanType
  commission_plan_config: CommissionPlanConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PricingPlan = "reseller_set" | "owner_plan_a" | "owner_plan_b"

export type CommissionPlanType = "fixed" | "base_split" | "percentage" | "flat_fee"

export interface CommissionPlanConfig {
  split_sp_pct?: number    // base_split: SP gets this % of overage (0-100)
  sp_margin_pct?: number   // percentage: SP gets this % of margin above BTS base (0-100)
  sp_flat_fee?: number     // flat_fee: SP gets this flat $ per deal
}
export type ParentType = "reseller" | "owner"

export interface Salesperson {
  id: string
  reseller_id: string | null
  name: string
  email: string
  cell: string
  pin_code: string
  company: string | null
  address: string | null
  tax_id_1099: string | null
  parent_type: ParentType
  pricing_plan: PricingPlan | null
  base_rate_google: number
  display_price_google: number | null
  commission_plan_type: CommissionPlanType | null
  commission_plan_config: CommissionPlanConfig | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  user_id: string
  user_type: UserRole
  name: string
  parent_reseller_id?: string
  documents_signed: boolean
}

// ─── Business Entities ───────────────────────────────────────────────────────

export interface Client {
  id: string
  reseller_id: string
  salesperson_id: string | null
  business_name: string
  owner_name: string
  address: string
  business_phone: string | null
  owner_phone: string | null
  owner_email: string | null
  google_url: string
  status: "pending" | "active" | "in_progress" | "completed" | "paused"
  notes: string | null
  created_at: string
  updated_at: string
}

export type ReviewStatus =
  | "active"
  | "in_progress"
  | "removed"
  | "waiting_for_payment"
  | "paid"
  | "failed"

export interface Review {
  id: string
  client_id: string
  platform: "google" | "facebook"
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
  status: ReviewStatus
  removal_date: string | null
  created_at: string
}

export interface Snapshot {
  id: string
  client_id: string
  average_rating: number | null
  total_reviews: number | null
  total_stars: number | null
  platform: string
  created_at: string
}

export interface Contract {
  id: string
  client_id: string
  reseller_id: string
  salesperson_id: string | null
  selected_review_ids: string[]
  google_review_count: number
  contract_rate_google: number | null
  bts_base_google: number | null
  status: "draft" | "sent" | "signed" | "active" | "completed"
  generated_at: string
  signed_at: string | null
  pdf_path: string | null
  signing_token: string
  signature_data: SignatureData | null
  signer_name: string | null
  signer_ip: string | null
  signed_pdf_path: string | null
}

// ─── Documents (1099 + Contractor Agreement) ─────────────────────────────────

export type DocumentType = "w9_1099" | "contractor_agreement"
export type DocumentStatus = "pending" | "signed"

export interface Document {
  id: string
  signer_type: "reseller" | "salesperson"
  signer_id: string
  document_type: DocumentType
  status: DocumentStatus
  signature_data: SignatureData | null
  signed_at: string | null
  pdf_path: string | null
  created_at: string
}

export interface SignatureData {
  type: "draw" | "typed"
  image_data?: string
  typed_name?: string
  font?: string
  ip: string
  user_agent: string
  timestamp: string
}

// ─── Invoicing + Payments ────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

export interface Invoice {
  id: string
  contract_id: string
  client_id: string
  reseller_id: string | null
  salesperson_id: string | null
  review_ids: string[]
  total_amount: number
  bts_base_amount: number
  reseller_amount: number
  salesperson_amount: number
  status: InvoiceStatus
  payment_token: string | null
  sent_at: string | null
  due_at: string | null
  paid_at: string | null
  payment_method: "credit_card" | "ach" | null
  payment_reference: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: "credit_card" | "ach"
  processor_ref: string | null
  status: "pending" | "completed" | "failed" | "refunded"
  created_at: string
}

export type PayoutStatus = "pending" | "paid" | "held"

export interface Payout {
  id: string
  invoice_id: string
  payment_id: string
  recipient_type: "reseller" | "salesperson"
  recipient_id: string
  amount: number
  status: PayoutStatus
  paid_at: string | null
  notes: string | null
  created_at: string
}

// ─── Rate Overrides ──────────────────────────────────────────────────────────

export interface RateOverride {
  id: string
  set_by_type: "owner" | "reseller"
  set_by_id: string
  target_type: "reseller" | "salesperson"
  target_id: string
  client_id: string | null
  rate_google: number
  notes: string | null
  created_at: string
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationEventType =
  | "review_removed"
  | "invoice_sent"
  | "payment_received"
  | "payment_overdue"
  | "document_signed"

export interface Notification {
  id: string
  recipient_type: "owner" | "reseller" | "salesperson" | "client"
  recipient_id: string
  event_type: NotificationEventType
  subject: string
  body: string
  email_sent: boolean
  email_sent_at: string | null
  read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Prospects ──────────────────────────────────────────────────────────────

export interface Prospect {
  id: string
  created_by_type: "owner" | "reseller" | "salesperson"
  created_by_id: string
  contact_name: string | null
  company_name: string | null
  phone: string | null
  google_url: string
  notes: string | null
  status: "prospect" | "converted" | "lost"
  review_snapshot: Array<{ reviewer_name: string; star_rating: number; review_text: string | null; review_date: string | null }> | null
  selected_review_ids: string[] | null
  original_rating: number | null
  projected_rating: number | null
  converted_client_id: string | null
  created_at: string
  updated_at: string
}

// ─── Commission Splits ──────────────────────────────────────────────────────

export interface CommissionSplit {
  bts: number
  reseller: number
  salesperson: number
}
