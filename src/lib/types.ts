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
  role: "admin" | "reseller"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  reseller_id: string
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

export interface Review {
  id: string
  client_id: string
  platform: "google" | "facebook"
  reviewer_name: string
  star_rating: number
  review_text: string | null
  review_date: string | null
  status: "active" | "pending_removal" | "removed" | "failed"
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
  selected_review_ids: string[]
  google_review_count: number
  contract_rate_google: number | null
  bts_base_google: number | null
  status: "draft" | "sent" | "signed" | "active" | "completed"
  generated_at: string
  signed_at: string | null
  pdf_path: string | null
}

export interface Session {
  reseller_id: string
  role: "admin" | "reseller"
  name: string
}
