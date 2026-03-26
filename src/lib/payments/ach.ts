/**
 * ACH bank direct payment — PLACEHOLDER
 * Replace with real ACH processor integration when ready.
 */

export interface ACHPaymentParams {
  amount: number
  routingNumber: string
  accountNumber: string
  accountType: "checking" | "savings"
  invoiceId: string
}

export interface ACHResult {
  success: boolean
  transactionId: string | null
  error?: string
}

export async function processACH(params: ACHPaymentParams): Promise<ACHResult> {
  // TODO: Replace with real ACH processor
  return {
    success: false,
    transactionId: null,
    error: "ACH payments are not yet configured. Please contact support.",
  }
}
