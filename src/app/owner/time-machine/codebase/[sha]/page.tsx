import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Link from "next/link"
import { ArrowLeft, GitCommit, Plus, Minus, FileCode } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { getCommitDetail } from "../actions"
import { CommitDetailClient } from "./CommitDetailClient"

export default async function CommitDetailPage({
  params,
}: {
  params: Promise<{ sha: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/")

  const { sha } = await params
  const commit = await getCommitDetail(sha)

  if (!commit) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/owner/time-machine/codebase"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Commit Not Found
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/time-machine/codebase"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
            {commit.message.split("\n")[0]}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{commit.author.name}</span>
            <span>&middot;</span>
            <span>
              {new Date(commit.author.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Full SHA */}
      <div className="rounded-md border border-border bg-surface px-4 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
          Full SHA
        </p>
        <p className="text-xs font-mono text-foreground select-all">{commit.sha}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Files Changed"
          value={commit.files.length}
          icon={<FileCode className="h-5 w-5" />}
          subtext="in this commit"
        />
        <StatsCard
          label="Insertions"
          value={`+${commit.stats?.additions ?? 0}`}
          icon={<Plus className="h-5 w-5" />}
          subtext="lines added"
        />
        <StatsCard
          label="Deletions"
          value={`-${commit.stats?.deletions ?? 0}`}
          icon={<Minus className="h-5 w-5" />}
          subtext="lines removed"
        />
      </div>

      {/* Rollback + file diffs */}
      <CommitDetailClient
        sha={commit.sha}
        files={commit.files}
      />
    </div>
  )
}
