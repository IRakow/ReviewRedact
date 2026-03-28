// ─── Pricing ─────────────────────────────────────────────────────────────────

// What BTS charges resellers per removal
export const BTS_BASE_RATE = 850
export const BTS_BASE_RATE_FACEBOOK = 500

// Reseller-salesperson: minimum rate the reseller must set
export const RESELLER_SALESPERSON_MIN_RATE = 1000

// Owner-direct salesperson Plan A: flat $750, max client charge $1K, BTS keeps spread
export const OWNER_DIRECT_PLAN_A_BASE = 750
export const OWNER_DIRECT_PLAN_A_MAX = 1000

// Owner-direct salesperson Plan B: $1K base to BTS, keep everything above
export const OWNER_DIRECT_PLAN_B_BASE = 1000

export const OWNER_DIRECT_SP_BASE = 750

// Legacy constants (used in contract generation)
export const BASE_RATE_GOOGLE = BTS_BASE_RATE
export const BASE_RATE_FACEBOOK = BTS_BASE_RATE_FACEBOOK

export const MAX_VOLUME_DISCOUNT = 0.15 // 15% for 100+ active accounts
export const VOLUME_DISCOUNT_THRESHOLD = 100 // active account minimum

export const REMOVAL_TIMELINE = {
  google: { min: 8, max: 14, unit: "days" as const },
  facebook: { min: 3, max: 5, unit: "days" as const },
}

export const SUCCESS_RATE = 0.98 // 98%

export const RETAINER_MINIMUM_MONTHLY = 1000

// ─── Invoicing ───────────────────────────────────────────────────────────────

export const INVOICE_DUE_HOURS = 24

// ─── Scraping ────────────────────────────────────────────────────────────────

export const SCRAPE_TIMES_PER_DAY = 3 // 3x daily for in_progress reviews

// ─── Session ─────────────────────────────────────────────────────────────────

export const SESSION_COOKIE_NAME = "rr_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

export const PIN_CODE_LENGTH = 6

// ─── Owners ──────────────────────────────────────────────────────────────────

export const OWNER_EMAILS = [
  "abstoverkm@aol.com",        // Blair Stover
  "vkawana@krusemennillo.com", // Victor Kawana
  "ian@cyberactiveconsulting.com", // Ian Rakow
]
