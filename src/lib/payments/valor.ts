/**
 * Valor Pay credit card processing — PLACEHOLDER
 * Replace with real Valor Pay API integration when API keys are available.
 * Docs: https://valorpaytech.com/developer
 */

export interface ChargeCardParams {
  amount: number
  cardNumber: string
  expiry: string
  cvv: string
  zip: string
  invoiceId: string
}

export interface ChargeResult {
  success: boolean
  transactionId: string | null
  error?: string
}

export async function chargeCard(params: ChargeCardParams): Promise<ChargeResult> {
  const apiKey = process.env.VALOR_PAY_API_KEY
  const merchantId = process.env.VALOR_PAY_MERCHANT_ID

  if (!apiKey || !merchantId) {
    return {
      success: false,
      transactionId: null,
      error: "Valor Pay API keys not configured. Contact support.",
    }
  }

  // TODO: Replace with real Valor Pay API call
  // const response = await fetch("https://api.valorpaytech.com/v1/charges", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${apiKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     merchant_id: merchantId,
  //     amount: params.amount,
  //     card_number: params.cardNumber,
  //     exp_date: params.expiry,
  //     cvv: params.cvv,
  //     zip: params.zip,
  //     invoice_id: params.invoiceId,
  //   }),
  // })

  return {
    success: false,
    transactionId: null,
    error: "Payment processing is not yet configured. Please contact support.",
  }
}
