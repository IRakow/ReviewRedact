import {
  BTS_BASE_RATE,
  BTS_BASE_RATE_FACEBOOK,
  OWNER_DIRECT_PLAN_A_BASE,
  OWNER_DIRECT_PLAN_A_MAX,
  OWNER_DIRECT_PLAN_B_BASE,
} from "./constants"
import type {
  CommissionPlanConfig,
  CommissionPlanType,
  CommissionSplit,
  PricingPlan,
  Reseller,
  Salesperson,
} from "./types"

// ─── Resolve Commission Plan ────────────────────────────────────────────────

/**
 * Determine the effective commission plan for a deal.
 * Priority: salesperson override → reseller global → default "fixed".
 */
export function resolveCommissionPlan(
  reseller?: Pick<Reseller, "commission_plan_type" | "commission_plan_config"> | null,
  salesperson?: Pick<Salesperson, "commission_plan_type" | "commission_plan_config"> | null,
): { type: CommissionPlanType; config: CommissionPlanConfig } {
  // SP-level override takes priority
  if (salesperson?.commission_plan_type) {
    return {
      type: salesperson.commission_plan_type,
      config: salesperson.commission_plan_config ?? {},
    }
  }

  // Reseller global plan
  return {
    type: reseller?.commission_plan_type ?? "fixed",
    config: reseller?.commission_plan_config ?? {},
  }
}

// ─── Calculate Splits ───────────────────────────────────────────────────────

interface SplitParams {
  clientRate: number
  platform: "google" | "facebook"
  resellerBaseRate?: number // defaults to BTS_BASE_RATE or BTS_BASE_RATE_FACEBOOK
  salesperson?: {
    exists: boolean
    parentType: "reseller" | "owner"
    pricingPlan?: PricingPlan | null
    baseRateGoogle: number
  }
  commissionPlan?: {
    type: CommissionPlanType
    config: CommissionPlanConfig
  }
  rateOverride?: number // per-client override for SP base rate
}

function clamp(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100)
}

/**
 * Calculate commission splits for a single review removal.
 *
 * Scenarios:
 * 1. Reseller direct sale (no salesperson): BTS gets base, reseller keeps rest
 * 2. Owner-direct Plan A: SP gets $750 flat, BTS keeps rest (max $1K charge)
 * 3. Owner-direct Plan B: BTS gets $1,000, SP keeps everything above
 * 4. Reseller → SP with commission plan (fixed / base_split / percentage / flat_fee)
 */
export function calculateSplits(params: SplitParams): CommissionSplit {
  const { clientRate, platform, salesperson, commissionPlan, rateOverride } = params

  const btsBase = platform === "google" ? BTS_BASE_RATE : BTS_BASE_RATE_FACEBOOK

  // ── Owner-direct salesperson (no reseller in chain) ──────────────────────
  if (salesperson?.exists && salesperson.parentType === "owner") {
    if (salesperson.pricingPlan === "owner_plan_a") {
      // Plan A: SP gets $750 flat, BTS keeps the rest (max client charge $1K)
      const effectiveRate = Math.min(clientRate, OWNER_DIRECT_PLAN_A_MAX)
      return {
        bts: clamp(effectiveRate - OWNER_DIRECT_PLAN_A_BASE),
        reseller: 0,
        salesperson: clamp(OWNER_DIRECT_PLAN_A_BASE),
      }
    }

    if (salesperson.pricingPlan === "owner_plan_b") {
      // Plan B: BTS gets $1,000, SP keeps everything above
      return {
        bts: clamp(Math.min(clientRate, OWNER_DIRECT_PLAN_B_BASE)),
        reseller: 0,
        salesperson: clamp(clientRate - OWNER_DIRECT_PLAN_B_BASE),
      }
    }

    // Fallback: BTS keeps everything
    return { bts: clamp(clientRate), reseller: 0, salesperson: 0 }
  }

  // ── Reseller direct sale (no salesperson) ────────────────────────────────
  if (!salesperson?.exists) {
    return {
      bts: clamp(btsBase),
      reseller: clamp(clientRate - btsBase),
      salesperson: 0,
    }
  }

  // ── Reseller → Salesperson ───────────────────────────────────────────────
  const effectiveSpRate = rateOverride ?? salesperson.baseRateGoogle
  const planType = commissionPlan?.type ?? "fixed"
  const config = commissionPlan?.config ?? {}

  let spAmount: number
  let resellerAmount: number

  switch (planType) {
    case "fixed": {
      // SP gets everything above their effective rate; reseller gets middle
      spAmount = clientRate - effectiveSpRate
      resellerAmount = effectiveSpRate - btsBase
      break
    }

    case "base_split": {
      // Overage above SP rate is split between SP and reseller
      const overage = clientRate - effectiveSpRate
      const splitPct = config.split_sp_pct ?? 50
      spAmount = overage * (splitPct / 100)
      resellerAmount = (effectiveSpRate - btsBase) + overage * (1 - splitPct / 100)
      break
    }

    case "percentage": {
      // Total margin above BTS base is split by percentage
      const margin = clientRate - btsBase
      const spPct = config.sp_margin_pct ?? 50
      spAmount = margin * (spPct / 100)
      resellerAmount = margin * (1 - spPct / 100)
      break
    }

    case "flat_fee": {
      // SP gets a flat fee per deal
      const flatFee = config.sp_flat_fee ?? 0
      spAmount = flatFee
      resellerAmount = clientRate - btsBase - flatFee
      break
    }

    default: {
      // Fallback to fixed
      spAmount = clientRate - effectiveSpRate
      resellerAmount = effectiveSpRate - btsBase
    }
  }

  return {
    bts: clamp(btsBase),
    reseller: clamp(resellerAmount),
    salesperson: clamp(spAmount),
  }
}

// ─── Validate Deal Rate ─────────────────────────────────────────────────────

/**
 * Validate that a deal rate complies with the salesperson's pricing plan rules.
 */
export function validateDealRate(params: {
  clientRate: number
  pricingPlan: PricingPlan | null
  parentType: "reseller" | "owner"
}): { valid: boolean; error?: string } {
  const { clientRate, pricingPlan, parentType } = params

  if (parentType === "owner" && pricingPlan === "owner_plan_a") {
    if (clientRate > OWNER_DIRECT_PLAN_A_MAX) {
      return {
        valid: false,
        error: `Plan A salespeople cannot charge more than $${OWNER_DIRECT_PLAN_A_MAX}/removal`,
      }
    }
  }

  if (clientRate < 0) {
    return { valid: false, error: "Rate cannot be negative" }
  }

  return { valid: true }
}

// ─── Calculate Impact (Prospect Tool) ───────────────────────────────────────

/**
 * Calculate the rating impact of removing selected reviews.
 */
export function calculateImpact(
  reviews: Array<{ id: string; star_rating: number }>,
  selectedIds: string[],
): { originalRating: number; projectedRating: number; change: number; removedCount: number } {
  if (reviews.length === 0) {
    return { originalRating: 0, projectedRating: 0, change: 0, removedCount: 0 }
  }

  const originalRating =
    reviews.reduce((sum, r) => sum + r.star_rating, 0) / reviews.length

  const selectedSet = new Set(selectedIds)
  const remaining = reviews.filter((r) => !selectedSet.has(r.id))

  const projectedRating =
    remaining.length > 0
      ? remaining.reduce((sum, r) => sum + r.star_rating, 0) / remaining.length
      : 0

  return {
    originalRating: Math.round(originalRating * 100) / 100,
    projectedRating: Math.round(projectedRating * 100) / 100,
    change: Math.round((projectedRating - originalRating) * 100) / 100,
    removedCount: selectedIds.length,
  }
}
