import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { QuickEntryForm } from "./QuickEntryForm"

export default async function QuickEntryPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: entries } = await supabase
    .from("quick_entries")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
          Quick Entry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free demos, comps, one-offs — log anything fast, email whoever you want
        </p>
      </div>

      <QuickEntryForm entries={entries ?? []} />
    </div>
  )
}
