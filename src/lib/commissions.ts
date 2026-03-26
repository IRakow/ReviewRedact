import {
  BTS_BASE_RATE,
  OWNER_DIRECT_PLAN_A_BASE,
  OWNER_DIRECT_PLAN_A_MAX,
  OWNER_DIRECT_PLAN_B_BASE,
} from "./constants"
import type { CommissionSplit, PricingPlan } from "./types"

interface SplitParams {
  clientRate: number
  reseller?: {
    id: string
    baseRate: number // what BTS charges this reseller (usually $850)
  }
  salesperson?: {
    id: string
    parentType: "reseller" | "owner"
    pricingPlan: PricingPlan | null
    baseRate: number // what the salesperson's base cost is
  }
  rateOverride?: number // per-deal override rate for the salesperson
}

/**
 * Calculate commission splits for a single review removal.
 *
 * Scenarios:
 * 1. Reseller direct sale (no salesperson): BTS $850, reseller keeps rest
 * 2. Reseller → Salesperson: BTS $850, salesperson gets their allocated rate, reseller keeps middle
 * 3. Owner-direct Plan A: Salesperson gets $750 flat, BTS keeps rest (max $1K charge)
 * 4. Owner-direct Plan B: BTS gets $1,000, salesperson keeps everything above
 */
export function calculateSplits(params: SplitParams): CommissionSplit {
  const { clientRate, reseller, salesperson, rateOverride } = params

  // Scenario 3 & 4: Owner-direct salesperson (no reseller in chain)
  if (salesperson && salesperson.parentType === "owner") {
    if (salesperson.pricingPlan === "owner_plan_a") {
      // Plan A: Salesperson gets $750 flat, BTS keeps the rest
      // Client can't be charged more than $1K
      const effectiveRate = Math.min(clientRate, OWNER_DIRECT_PLAN_A_MAX)
      return {
        bts: effectiveRate - OWNER_DIRECT_PLAN_A_BASE,
        reseller: 0,
        salesperson: OWNER_DIRECT_PLAN_A_BASE,
      }
    }

    if (salesperson.pricingPlan === "owner_plan_b") {
      // Plan B: BTS gets $1,000, salesperson keeps everything above
      return {
        bts: Math.min(clientRate, OWNER_DIRECT_PLAN_B_BASE),
        reseller: 0,
        salesperson: Math.max(0, clientRate - OWNER_DIRECT_PLAN_B_BASE),
      }
    }

    // Fallback: BTS keeps everything
    return { bts: clientRate, reseller: 0, salesperson: 0 }
  }

  // Scenario 1: Reseller direct sale (no salesperson)
  if (reseller && !salesperson) {
    const btsAmount = Math.min(clientRate, reseller.baseRate || BTS_BASE_RATE)
    return {
      bts: btsAmount,
      reseller: Math.max(0, clientRate - btsAmount),
      salesperson: 0,
    }
  }

  // Scenario 2: Reseller → Salesperson
  if (reseller && salesperson) {
    const btsAmount = reseller.baseRate || BTS_BASE_RATE
    const effectiveSpRate = rateOverride ?? salesperson.baseRate
    // Salesperson gets everything between BTS base and the rate the reseller set for them
    // Actually: salesperson gets (clientRate - effectiveSpRate) if reseller set the SP rate as what client pays minus SP cut
    // The reseller's salesperson base_rate is the FLOOR — reseller decides what SP gets per deal
    // So: BTS gets $850, reseller gets (clientRate - $850 - spCut), SP gets spCut
    // The sp baseRate is the minimum the reseller must give them. Override can change per-deal.
    const spAmount = Math.max(0, clientRate - btsAmount - (clientRate - btsAmount - (effectiveSpRate - btsAmount)))
    // Simpler: SP gets (effectiveSpRate - btsAmount) if that makes sense
    // Actually the simplest interpretation:
    // - Client pays $clientRate
    // - BTS takes $850
    // - Remainder = clientRate - 850
    // - Of that remainder, salesperson gets (effectiveSpRate - BTS_BASE_RATE) or whatever reseller allocates
    // Let's think differently:
    // - The reseller's base is $850 to BTS
    // - The salesperson's base_rate is what the RESELLER charges the SP (like BTS charges the reseller)
    // - So if SP base_rate is $1000, BTS gets $850, reseller keeps $150, SP gets clientRate - $1000
    // Wait, the user said: "the resellers base rate of $850... salespeople will work on the resellers team.
    // the reseller will decide on a case by case basis what each salesperson of his makes"
    // And "salesperson has the opportunity to get everything over $1k"
    // So: client pays X. BTS gets $850. Reseller's salesperson's base is $1K.
    // SP gets (X - $1K). Reseller gets ($1K - $850) = $150 from each SP deal.
    // If override, SP base changes.

    const spCut = Math.max(0, clientRate - effectiveSpRate)
    const resellerCut = Math.max(0, effectiveSpRate - btsAmount)

    return {
      bts: btsAmount,
      reseller: resellerCut,
      salesperson: spCut,
    }
  }

  // Fallback: no reseller, no salesperson (shouldn't happen)
  return { bts: clientRate, reseller: 0, salesperson: 0 }
}

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
