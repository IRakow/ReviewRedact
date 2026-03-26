import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/dashboard/StatusBadge"

export default async function OwnerDocumentsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: documents } = await supabase
    .from("documents")
    .select("id, signer_type, signer_id, document_type, status, signed_at, created_at")
    .order("created_at", { ascending: false })

  // Get signer names
  const resellerIds = (documents ?? []).filter((d) => d.signer_type === "reseller").map((d) => d.signer_id)
  const spIds = (documents ?? []).filter((d) => d.signer_type === "salesperson").map((d) => d.signer_id)

  const [{ data: resellers }, { data: salespeople }] = await Promise.all([
    resellerIds.length > 0
      ? supabase.from("resellers").select("id, name").in("id", resellerIds)
      : { data: [] },
    spIds.length > 0
      ? supabase.from("salespeople").select("id, name").in("id", spIds)
      : { data: [] },
  ])

  const nameMap: Record<string, string> = {}
  for (const r of resellers ?? []) nameMap[r.id] = r.name
  for (const s of salespeople ?? []) nameMap[s.id] = s.name

  function docLabel(type: string) {
    return type === "w9_1099" ? "W-9/1099" : "Contractor Agreement"
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Signed Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">All 1099s and contractor agreements</p>
      </div>

      <div className="rounded-md border border-border bg-surface">
        {(documents ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No documents yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Signer</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Document</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Signed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(documents ?? []).map((doc) => (
                <tr key={doc.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {nameMap[doc.signer_id] ?? "Unknown"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">{doc.signer_type}</td>
                  <td className="px-5 py-3 text-foreground">{docLabel(doc.document_type)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status === "signed" ? "signed" : "pending"} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {doc.signed_at
                      ? new Date(doc.signed_at).toLocaleDateString()
                      : "—"}
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
