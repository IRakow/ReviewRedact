import { Resend } from "resend"
import { createServerClient } from "./supabase/server"
import { OWNER_EMAILS } from "./constants"
import type { NotificationEventType } from "./types"

const resend = new Resend(process.env.RESEND_API_KEY)

interface NotifyParams {
  event: NotificationEventType
  metadata: Record<string, unknown>
}

/**
 * Central notification function — handles all event types.
 * Sends emails via Resend + stores in notifications table.
 */
export async function notify(params: NotifyParams): Promise<void> {
  const { event, metadata } = params

  switch (event) {
    case "review_removed":
      await notifyReviewRemoved(metadata)
      break
    case "invoice_sent":
      await notifyInvoiceSent(metadata)
      break
    case "payment_received":
      await notifyPaymentReceived(metadata)
      break
    case "payment_overdue":
      await notifyPaymentOverdue(metadata)
      break
    case "document_signed":
      // Handled directly in sign/actions.ts
      break
  }
}

async function notifyReviewRemoved(meta: Record<string, unknown>) {
  const {
    reviewerName,
    reviewSnippet,
    clientBusinessName,
    resellerEmail,
    resellerName,
    salespersonEmail,
    salespersonName,
    resellerId,
    salespersonId,
  } = meta as {
    reviewerName: string
    reviewSnippet: string
    clientBusinessName: string
    resellerEmail?: string
    resellerName?: string
    salespersonEmail?: string
    salespersonName?: string
    resellerId?: string
    salespersonId?: string
  }

  const supabase = createServerClient()

  // Email reseller + salesperson: congrats, NO pricing
  const congratsRecipients: string[] = []
  if (resellerEmail) congratsRecipients.push(resellerEmail)
  if (salespersonEmail) congratsRecipients.push(salespersonEmail)

  if (congratsRecipients.length > 0) {
    try {
      await resend.emails.send({
        from: "Review Redact <notifications@reviewredact.com>",
        to: congratsRecipients,
        subject: `Review Removed — ${clientBusinessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1a1a1a;">Congratulations!</h2>
            <p>A review has been successfully removed for <strong>${clientBusinessName}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p style="margin: 0; font-size: 13px;"><strong>Reviewer:</strong> ${reviewerName}</p>
              <p style="margin: 5px 0 0; font-size: 13px; color: #666;">"${(reviewSnippet as string).slice(0, 100)}${(reviewSnippet as string).length > 100 ? "..." : ""}"</p>
            </div>
            <p>An invoice has been sent to the client.</p>
            <p>Log in to your portal to see the updated status.</p>
            <br/>
            <p style="font-size: 11px; color: #999;">Business Threat Solutions, LLC — Automated Notification</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send congrats email:", err)
    }
  }

  // Store notifications
  const notifRows = []
  if (resellerId) {
    notifRows.push({
      recipient_type: "reseller",
      recipient_id: resellerId,
      event_type: "review_removed",
      subject: `Review removed for ${clientBusinessName}`,
      body: `${reviewerName}'s review has been removed. Invoice sent to client.`,
      email_sent: congratsRecipients.length > 0,
      email_sent_at: new Date().toISOString(),
      metadata: { reviewerName, clientBusinessName },
    })
  }
  if (salespersonId) {
    notifRows.push({
      recipient_type: "salesperson",
      recipient_id: salespersonId,
      event_type: "review_removed",
      subject: `Review removed for ${clientBusinessName}`,
      body: `${reviewerName}'s review has been removed. Invoice sent to client.`,
      email_sent: congratsRecipients.length > 0,
      email_sent_at: new Date().toISOString(),
      metadata: { reviewerName, clientBusinessName },
    })
  }

  if (notifRows.length > 0) {
    await supabase.from("notifications").insert(notifRows)
  }
}

async function notifyInvoiceSent(meta: Record<string, unknown>) {
  const { clientEmail, clientBusinessName, clientOwnerName, invoiceAmount, paymentUrl, pdfBase64, filename } = meta as {
    clientEmail: string
    clientBusinessName: string
    clientOwnerName: string
    invoiceAmount: number
    paymentUrl: string
    pdfBase64?: string
    filename?: string
  }

  // Email invoice to client
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #1a1a1a;">Invoice for Review Removal</h2>
        <p>Dear ${clientOwnerName},</p>
        <p>A review has been successfully removed from your Google Business listing for <strong>${clientBusinessName}</strong>.</p>
        <p style="font-size: 18px; font-weight: bold; color: #1a1a1a;">Amount Due: $${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        <p><strong>Payment is due within 24 hours.</strong></p>
        <p><a href="${paymentUrl}" style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Pay Now</a></p>
        <p style="font-size: 12px; color: #666;">You can pay by credit card or ACH bank transfer.</p>
        <br/>
        <p>Regards,</p>
        <p><strong>Business Threat Solutions, LLC</strong></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">This invoice is confidential. If you have questions, please reply to this email.</p>
      </div>
    `

    const attachments = pdfBase64 && filename
      ? [{ filename, content: Buffer.from(pdfBase64, "base64"), contentType: "application/pdf" as const }]
      : undefined

    await resend.emails.send({
      from: "Review Redact <invoices@reviewredact.com>",
      to: clientEmail,
      subject: `Invoice — ${clientBusinessName} — Review Removal`,
      html: htmlContent,
      attachments,
    })
  } catch (err) {
    console.error("Failed to send invoice email:", err)
  }

  // Email invoice copy to all owners
  try {
    await resend.emails.send({
      from: "Review Redact <invoices@reviewredact.com>",
      to: OWNER_EMAILS,
      subject: `[Invoice Sent] ${clientBusinessName} — $${invoiceAmount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Invoice Sent to Client</h2>
          <p>An invoice for <strong>$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> has been sent to <strong>${clientBusinessName}</strong> (${clientEmail}).</p>
          <p>Payment due within 24 hours.</p>
          <br/>
          <p style="font-size: 11px; color: #999;">Automated notification — ReviewRedact</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send owner invoice notification:", err)
  }
}

async function notifyPaymentReceived(meta: Record<string, unknown>) {
  const { clientBusinessName, amount, resellerEmail, salespersonEmail, resellerId, salespersonId } = meta as {
    clientBusinessName: string
    amount: number
    resellerEmail?: string
    salespersonEmail?: string
    resellerId?: string
    salespersonId?: string
  }

  const recipients: string[] = []
  if (resellerEmail) recipients.push(resellerEmail)
  if (salespersonEmail) recipients.push(salespersonEmail)

  if (recipients.length > 0) {
    try {
      await resend.emails.send({
        from: "Review Redact <notifications@reviewredact.com>",
        to: recipients,
        subject: `Payment Received — ${clientBusinessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1a1a1a;">Payment Received</h2>
            <p>Payment has been received from <strong>${clientBusinessName}</strong>.</p>
            <p>Log in to your portal to see the updated status.</p>
            <br/>
            <p style="font-size: 11px; color: #999;">Business Threat Solutions, LLC — Automated Notification</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send payment received email:", err)
    }
  }

  const supabase = createServerClient()
  const notifRows = []
  if (resellerId) {
    notifRows.push({
      recipient_type: "reseller", recipient_id: resellerId,
      event_type: "payment_received",
      subject: `Payment received from ${clientBusinessName}`,
      body: `Client paid for review removal.`,
      email_sent: true, email_sent_at: new Date().toISOString(),
      metadata: { clientBusinessName, amount },
    })
  }
  if (salespersonId) {
    notifRows.push({
      recipient_type: "salesperson", recipient_id: salespersonId,
      event_type: "payment_received",
      subject: `Payment received from ${clientBusinessName}`,
      body: `Client paid for review removal.`,
      email_sent: true, email_sent_at: new Date().toISOString(),
      metadata: { clientBusinessName, amount },
    })
  }
  if (notifRows.length > 0) {
    await supabase.from("notifications").insert(notifRows)
  }
}

async function notifyPaymentOverdue(meta: Record<string, unknown>) {
  const { clientEmail, clientOwnerName, clientBusinessName, invoiceAmount, paymentUrl } = meta as {
    clientEmail: string
    clientOwnerName: string
    clientBusinessName: string
    invoiceAmount: number
    paymentUrl: string
  }

  // Gentle reminder to client
  try {
    await resend.emails.send({
      from: "Review Redact <invoices@reviewredact.com>",
      to: clientEmail,
      subject: `Friendly Reminder — Payment Due for ${clientBusinessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">Payment Reminder</h2>
          <p>Dear ${clientOwnerName},</p>
          <p>This is a friendly reminder that your invoice of <strong>$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> for review removal services for <strong>${clientBusinessName}</strong> is now past due.</p>
          <p><a href="${paymentUrl}" style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Pay Now</a></p>
          <p>If you've already submitted payment, please disregard this notice.</p>
          <p>If you have any questions, please reply to this email.</p>
          <br/>
          <p>Thank you,</p>
          <p><strong>Business Threat Solutions, LLC</strong></p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send overdue reminder:", err)
  }

  // Alert owners
  try {
    await resend.emails.send({
      from: "Review Redact <invoices@reviewredact.com>",
      to: OWNER_EMAILS,
      subject: `[OVERDUE] ${clientBusinessName} — $${invoiceAmount.toLocaleString()} past due`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #cc0000;">Overdue Invoice Alert</h2>
          <p><strong>${clientBusinessName}</strong> (${clientEmail}) has an overdue invoice of <strong>$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.</p>
          <p>A gentle reminder has been sent to the client.</p>
          <br/>
          <p style="font-size: 11px; color: #999;">Automated alert — ReviewRedact</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send owner overdue alert:", err)
  }
}
