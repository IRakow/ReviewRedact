"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Timeline } from "../components/Timeline"

interface CommitSummary {
  sha: string
  message: string
  authorName: string
  authorDate: string
  additions: number
  deletions: number
}

export function CodebaseTimelineClient({ commits }: { commits: CommitSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const router = useRouter()

  const timelineItems = commits.map((c) => ({
    id: c.sha,
    timestamp: c.authorDate,
    title: c.message.split("\n")[0],
    subtitle: `${c.authorName} · ${c.sha.slice(0, 7)}`,
    badge: {
      label: "commit",
      variant: "commit" as const,
    },
    metadata: {
      "+": c.additions,
      "-": c.deletions,
    },
  }))

  function handleSelect(sha: string) {
    setSelectedId(sha)
    router.push(`/owner/time-machine/codebase/${sha}`)
  }

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Commit History</h2>
      <Timeline
        items={timelineItems}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </div>
  )
}
