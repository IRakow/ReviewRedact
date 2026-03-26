import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Link from "next/link"
import { ArrowLeft, GitCommit, Clock } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { listCommits } from "./actions"
import { CodebaseTimelineClient } from "./CodebaseTimelineClient"

export default async function CodebaseTimeMachinePage() {
  const session = await getSession()
  if (!session) redirect("/")

  const commits = await listCommits(1, 50)

  const lastCommitDate = commits.length > 0
    ? new Date(commits[0].author.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown"

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/time-machine"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Codebase Time Machine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Git commit history from GitHub
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          label="Commits Loaded"
          value={commits.length}
          icon={<GitCommit className="h-5 w-5" />}
          subtext="most recent"
        />
        <StatsCard
          label="Last Commit"
          value={lastCommitDate}
          icon={<Clock className="h-5 w-5" />}
          subtext={commits.length > 0 ? commits[0].author.name : "—"}
        />
      </div>

      {/* Client timeline */}
      <CodebaseTimelineClient
        commits={commits.map((c) => ({
          sha: c.sha,
          message: c.message,
          authorName: c.author.name,
          authorDate: c.author.date,
          additions: c.stats?.additions ?? 0,
          deletions: c.stats?.deletions ?? 0,
        }))}
      />
    </div>
  )
}
