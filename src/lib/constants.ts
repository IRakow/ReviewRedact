// Business constants from Reseller Agreement + Discussion Doc

export const BASE_RATE_GOOGLE = 1000
export const BASE_RATE_FACEBOOK = 500
export const MAX_VOLUME_DISCOUNT = 0.15 // 15% for 100+ active accounts
export const VOLUME_DISCOUNT_THRESHOLD = 100 // active account minimum

export const REMOVAL_TIMELINE = {
  google: { min: 8, max: 14, unit: "days" as const },
  facebook: { min: 3, max: 5, unit: "days" as const },
}

export const SUCCESS_RATE = 0.98 // 98%

export const RETAINER_MINIMUM_MONTHLY = 1000

export const SESSION_COOKIE_NAME = "rr_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export const PIN_CODE_LENGTH = 6
