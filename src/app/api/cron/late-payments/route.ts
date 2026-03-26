import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { notify } from "@/lib/notifications"

/**
 * Late payment cron — runs daily.
 * Finds invoices past due, marks overdue, sends reminders.
 */
export async function GET() {
  const supabase = createServerClient()

  // Find sent invoices past their due date
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, client_id, total_amount, due_at, payment_token")
    .eq("status", "sent")
    .lt("due_at", new Date().toISOString())

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return NextResponse.json({ message: "No overdue invoices", updated: 0 })
  }

  let updated = 0

  for (const invoice of overdueInvoices) {
    // Mark as overdue
    await supabase
      .from("invoices")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", invoice.id)

    // Get client details
    const { data: client } = await supabase
      .from("clients")
      .select("owner_email, owner_name, business_name")
      .eq("id", invoice.client_id)
      .single()

    if (client?.owner_email) {
      const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://reviewredact.com"}/pay/${invoice.payment_token}`

      await notify({
        event: "payment_overdue",
        metadata: {
          clientEmail: client.owner_email,
          clientOwnerName: client.owner_name,
          clientBusinessName: client.business_name,
          invoiceAmount: invoice.total_amount,
          paymentUrl,
        },
      })
    }

    updated++
  }

  return NextResponse.json({
    success: true,
    updated,
    timestamp: new Date().toISOString(),
  })
}
