import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { Invoice } from "./types"

interface InvoiceData {
  invoiceId: string
  clientBusinessName: string
  clientOwnerName: string
  clientEmail: string
  clientAddress: string
  reviewerName: string
  reviewSnippet: string
  totalAmount: number
  btsBaseAmount: number
  resellerAmount: number
  salespersonAmount: number
  sentAt: string
  dueAt: string
  paymentToken: string
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // Letter size
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.4, 0.4, 0.4)
  const steel = rgb(0.45, 0.5, 0.55)
  let y = 740

  // Header
  page.drawText("INVOICE", {
    x: 50, y,
    size: 28,
    font: helveticaBold,
    color: dark,
  })

  page.drawText("Business Threat Solutions, LLC", {
    x: 350, y: y + 5,
    size: 10,
    font: helveticaBold,
    color: dark,
  })
  page.drawText("100 N Broadway, Suite 2000", {
    x: 350, y: y - 10,
    size: 9,
    font: helvetica,
    color: gray,
  })
  page.drawText("St. Louis, MO 63102", {
    x: 350, y: y - 22,
    size: 9,
    font: helvetica,
    color: gray,
  })

  y -= 60

  // Invoice details
  const shortId = data.invoiceId.slice(0, 8).toUpperCase()
  const details = [
    ["Invoice #", `INV-${shortId}`],
    ["Date", new Date(data.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Due", new Date(data.dueAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Payment Due Within", "24 hours of receipt"],
  ]

  for (const [label, value] of details) {
    page.drawText(label, { x: 50, y, size: 9, font: helvetica, color: gray })
    page.drawText(value, { x: 180, y, size: 9, font: helveticaBold, color: dark })
    y -= 16
  }

  y -= 10

  // Divider
  page.drawLine({
    start: { x: 50, y },
    end: { x: 562, y },
    thickness: 0.5,
    color: steel,
  })

  y -= 25

  // Bill To
  page.drawText("BILL TO", { x: 50, y, size: 9, font: helveticaBold, color: steel })
  y -= 16
  page.drawText(data.clientBusinessName, { x: 50, y, size: 11, font: helveticaBold, color: dark })
  y -= 14
  page.drawText(`Attn: ${data.clientOwnerName}`, { x: 50, y, size: 9, font: helvetica, color: gray })
  y -= 14
  page.drawText(data.clientAddress, { x: 50, y, size: 9, font: helvetica, color: gray })
  y -= 14
  page.drawText(data.clientEmail, { x: 50, y, size: 9, font: helvetica, color: gray })

  y -= 35

  // Line items header
  page.drawRectangle({
    x: 50, y: y - 5,
    width: 512, height: 22,
    color: rgb(0.95, 0.95, 0.95),
  })
  page.drawText("Description", { x: 55, y, size: 9, font: helveticaBold, color: dark })
  page.drawText("Amount", { x: 490, y, size: 9, font: helveticaBold, color: dark })

  y -= 25

  // Line item: the removed review
  const description = `Google Review Removal — "${data.reviewerName}"`
  page.drawText(description, { x: 55, y, size: 9, font: helvetica, color: dark })
  page.drawText(`$${data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, {
    x: 490, y, size: 9, font: helveticaBold, color: dark,
  })

  y -= 14
  // Review snippet
  const snippet = data.reviewSnippet.length > 80
    ? data.reviewSnippet.slice(0, 80) + "..."
    : data.reviewSnippet
  page.drawText(`"${snippet}"`, { x: 55, y, size: 8, font: helvetica, color: gray })

  y -= 30

  // Divider
  page.drawLine({
    start: { x: 350, y },
    end: { x: 562, y },
    thickness: 0.5,
    color: steel,
  })

  y -= 20

  // Total
  page.drawText("TOTAL DUE", { x: 380, y, size: 11, font: helveticaBold, color: dark })
  page.drawText(`$${data.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, {
    x: 490, y, size: 14, font: helveticaBold, color: dark,
  })

  y -= 50

  // Payment instructions
  page.drawLine({
    start: { x: 50, y },
    end: { x: 562, y },
    thickness: 0.5,
    color: steel,
  })

  y -= 25

  page.drawText("PAYMENT METHODS", { x: 50, y, size: 9, font: helveticaBold, color: steel })
  y -= 18
  page.drawText("Credit Card or ACH Bank Transfer — pay securely online:", { x: 50, y, size: 9, font: helvetica, color: gray })
  y -= 16
  // Payment link would be the actual URL in production
  page.drawText(`Payment link included in email`, { x: 50, y, size: 9, font: helveticaBold, color: dark })

  y -= 30

  page.drawText("Payment is due within 24 hours of invoice receipt.", { x: 50, y, size: 9, font: helveticaBold, color: dark })

  // Footer
  page.drawText("Business Threat Solutions, LLC — Confidential", {
    x: 50, y: 30,
    size: 8,
    font: helvetica,
    color: gray,
  })

  return doc.save()
}
