import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { ArrowLeft, Layers } from "lucide-react"
import { fetchReportData, loadReports } from "./actions"
import { ReportBuilder } from "./ReportBuilder"

export default async function ReportBuilderPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const [data, savedReports] = await Promise.all([
    fetchReportData(),
    loadReports(),
  ])

  if (!data) redirect("/")

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/reports"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-steel" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Report Builder
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag metrics and groupings to build custom reports
          </p>
        </div>
      </div>

      <ReportBuilder initialData={data} initialSavedReports={savedReports} />
    </div>
  )
}
