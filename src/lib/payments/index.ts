import { chargeCard, type ChargeCardParams } from "./valor"
import { processACH, type ACHPaymentParams } from "./ach"

export type PaymentMethod = "credit_card" | "ach"

interface ProcessPaymentParams {
  method: PaymentMethod
  amount: number
  invoiceId: string
  creditCard?: {
    cardNumber: string
    expiry: string
    cvv: string
    zip: string
  }
  ach?: {
    routingNumber: string
    accountNumber: string
    accountType: "checking" | "savings"
  }
}

export async function processPayment(params: ProcessPaymentParams) {
  if (params.method === "credit_card") {
    if (!params.creditCard) {
      return { success: false, transactionId: null, error: "Card details required" }
    }
    return chargeCard({
      amount: params.amount,
      cardNumber: params.creditCard.cardNumber,
      expiry: params.creditCard.expiry,
      cvv: params.creditCard.cvv,
      zip: params.creditCard.zip,
      invoiceId: params.invoiceId,
    })
  }

  if (params.method === "ach") {
    if (!params.ach) {
      return { success: false, transactionId: null, error: "Bank details required" }
    }
    return processACH({
      amount: params.amount,
      routingNumber: params.ach.routingNumber,
      accountNumber: params.ach.accountNumber,
      accountType: params.ach.accountType,
      invoiceId: params.invoiceId,
    })
  }

  return { success: false, transactionId: null, error: "Invalid payment method" }
}
