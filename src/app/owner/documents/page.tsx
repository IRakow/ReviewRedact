import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { DocumentsTable } from "./DocumentsTable"

export default async function OwnerDocumentsPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: documents } = await supabase
    .from("documents")
    .select("id, signer_type, signer_id, document_type, status, signature_data, signed_at, pdf_path, created_at")
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">Signed Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">All 1099s and contractor agreements</p>
      </div>

      <DocumentsTable documents={documents ?? []} nameMap={nameMap} />
    </div>
  )
}
