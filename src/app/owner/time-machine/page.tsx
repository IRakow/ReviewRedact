import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Link from "next/link"
import { Database, GitBranch, ArrowRight } from "lucide-react"
import { listSnapshots } from "./database/actions"
import { listCommits } from "./codebase/actions"

export default async function TimeMachineHubPage() {
  const session = await getSession()
  if (!session) redirect("/")

  const [snapshotsResult, commits] = await Promise.all([
    listSnapshots(),
    listCommits(1, 5),
  ])

  const snapshots = "data" in snapshotsResult ? snapshotsResult.data ?? [] : []
  const snapshotCount = "total" in snapshotsResult ? snapshotsResult.total ?? 0 : 0
  const lastBackup = snapshots.length > 0
    ? new Date(snapshots[0].created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  const commitCount = commits.length
  const lastDeploy = commits.length > 0
    ? new Date(commits[0].author.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown"

  const cards = [
    {
      title: "Database Backups",
      description: "Full snapshots of all 13 tables stored in GCS. Browse, compare, and restore.",
      href: "/owner/time-machine/database",
      icon: Database,
      stats: [
        { label: "Snapshots", value: snapshotCount },
        { label: "Last Backup", value: lastBackup },
      ],
    },
    {
      title: "Codebase History",
      description: "Git commit timeline from GitHub. Inspect diffs and trigger rollback deploys.",
      href: "/owner/time-machine/codebase",
      icon: GitBranch,
      stats: [
        { label: "Recent Commits", value: commitCount },
        { label: "Last Commit", value: lastDeploy },
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
          Time Machine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Database backups and codebase history — browse, compare, and restore
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-md border border-border bg-surface p-6 transition-all hover:border-steel/30 hover:bg-steel/5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-steel/20 bg-steel/10 text-steel">
                <card.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground group-hover:text-steel">
                    {card.title}
                  </h2>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>

                <div className="mt-4 flex gap-6">
                  {card.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
