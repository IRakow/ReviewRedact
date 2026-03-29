import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function OwnerClientsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name, owner_name, status, reseller_id, salesperson_id, created_at")
    .order("created_at", { ascending: false })

  // Get reseller names
  const { data: resellers } = await supabase.from("resellers").select("id, name").eq("role", "reseller")
  const resellerMap: Record<string, string> = {}
  for (const r of resellers ?? []) resellerMap[r.id] = r.name

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">All Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">{(clients ?? []).length} total clients</p>
        </div>
        <Link href="/owner/clients/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(clients ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No clients yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Reseller</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(clients ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">{c.business_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.owner_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{resellerMap[c.reseller_id] ?? "Owner-Direct"}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3">
                    <Link href={`/owner/clients/${c.id}`} className="text-xs text-steel hover:text-steel-light">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
