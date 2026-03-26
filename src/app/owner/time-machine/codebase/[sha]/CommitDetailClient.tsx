"use client"

import { useState, useTransition } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiffView } from "../../components/DiffView"
import { rollbackToCommit } from "../actions"

interface CommitFile {
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string
}

interface CommitDetailClientProps {
  sha: string
  files: CommitFile[]
}

export function CommitDetailClient({ sha, files }: CommitDetailClientProps) {
  const [confirmRollback, setConfirmRollback] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string; deploymentUrl?: string } | null>(null)

  function handleRollback() {
    startTransition(async () => {
      const res = await rollbackToCommit(sha)
      setResult(res)
      setConfirmRollback(false)
    })
  }

  return (
    <div className="space-y-6">
      {/* Rollback action */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setConfirmRollback(true)}
          variant="outline"
          className="text-xs"
          disabled={isPending}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Rollback to this commit
        </Button>
      </div>

      {confirmRollback && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-400">
            This will trigger a new Vercel deployment at commit {sha.slice(0, 7)}.
            The current deployment will be replaced.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleRollback}
              disabled={isPending}
              className="text-xs"
            >
              {isPending ? "Deploying..." : "Confirm Rollback"}
            </Button>
            <Button
              onClick={() => setConfirmRollback(false)}
              variant="outline"
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`rounded-md border p-4 ${
            result.error
              ? "border-red-500/30 bg-red-500/5"
              : "border-emerald-500/30 bg-emerald-500/5"
          }`}
        >
          {result.error ? (
            <p className="text-sm text-red-400">{result.error}</p>
          ) : (
            <div>
              <p className="text-sm text-emerald-400">Rollback deployment triggered successfully.</p>
              {result.deploymentUrl && (
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  {result.deploymentUrl}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* File diffs */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Changed Files ({files.length})
        </h2>

        {/* File list summary */}
        <div className="mb-4 rounded-md border border-border bg-surface divide-y divide-border">
          {files.map((f) => (
            <div key={f.filename} className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-mono text-foreground truncate">{f.filename}</span>
              <div className="flex items-center gap-2 text-[10px] font-mono flex-shrink-0 ml-2">
                <span className="text-emerald-400">+{f.additions}</span>
                <span className="text-red-400">-{f.deletions}</span>
                <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-muted-foreground capitalize">
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Full diffs */}
        <DiffView mode="code" files={files} />
      </div>
    </div>
  )
}
