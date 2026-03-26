import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { PhoneCall, ArrowRight } from "lucide-react"
import type { Prospect } from "@/lib/types"

export default async function ProspectsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  let query = supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false })

  if (session.user_type === "reseller") {
    // Reseller sees their own + their salespeople's prospects
    const { data: salespeople } = await supabase
      .from("salespeople")
      .select("id")
      .eq("reseller_id", session.user_id)

    const spIds = (salespeople ?? []).map((sp) => sp.id)
    const allIds = [session.user_id, ...spIds]

    query = query.in("created_by_id", allIds)
  } else if (session.user_type === "salesperson") {
    query = query.eq("created_by_id", session.user_id)
  }
  // owner sees all

  const { data: prospects, error } = await query

  if (error) {
    throw new Error(`Failed to fetch prospects: ${error.message}`)
  }

  const items = (prospects ?? []) as Prospect[]

  function displayName(p: Prospect): string {
    return p.contact_name || p.company_name || p.phone || "Unnamed"
  }

  function statusType(
    s: string
  ): "active" | "pending" | "completed" | "paused" {
    if (s === "converted") return "completed"
    if (s === "lost") return "paused"
    return "active"
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prospects from sales calls
          </p>
        </div>
        <Link
          href="/dashboard/prospect"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          New Prospect Call
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12 text-center">
          <PhoneCall className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No leads yet — use the Prospect tool to start a sales call
          </p>
          <Link
            href="/dashboard/prospect"
            className="mt-3 inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
          >
            Start a prospect call
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Contact / Company
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/prospects/${p.id}`}
                      className="text-sm font-medium text-foreground hover:text-steel transition-colors"
                    >
                      {displayName(p)}
                    </Link>
                    {p.company_name && p.contact_name && (
                      <p className="text-xs text-muted-foreground">
                        {p.company_name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.original_rating != null && p.projected_rating != null ? (
                      <span className="text-xs">
                        <span className="text-muted-foreground">
                          {p.original_rating.toFixed(1)}
                        </span>
                        <span className="mx-1 text-muted-foreground/40">
                          &rarr;
                        </span>
                        <span className="font-medium text-emerald-400">
                          {p.projected_rating.toFixed(1)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusType(p.status)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
