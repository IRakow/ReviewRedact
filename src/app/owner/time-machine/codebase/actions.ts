"use server"

const REPO = "IRakow/ReviewRedact"
const GITHUB_API = "https://api.github.com"

interface CommitAuthor {
  name: string
  date: string
}

interface CommitSummary {
  sha: string
  message: string
  author: CommitAuthor
  stats?: { additions: number; deletions: number; total: number }
}

interface CommitFile {
  filename: string
  status: string
  additions: number
  deletions: number
  patch: string
}

interface CommitDetail extends CommitSummary {
  files: CommitFile[]
}

async function githubFetch(path: string) {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null

  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status} ${res.statusText} for ${path}`)
    return null
  }

  return res.json()
}

function getMockCommits(): CommitSummary[] {
  const now = Date.now()
  return Array.from({ length: 10 }, (_, i) => ({
    sha: `${String(i).padStart(2, "0")}abcdef1234567890abcdef1234567890abcd${i}`,
    message: [
      "fix: impact calculator — clearer math for complete review removal",
      "fix: scrape button — call scraper directly instead of API route",
      "feat: email DRMC contracts to clients via Resend",
      "feat: contract preview — PDF shows on page with Print/Download/Email",
      "fix: contract generation — add missing contract_rate_google param",
      "feat: add owner reports with reseller & salesperson performance",
      "fix: commission calculation edge case for flat-fee plans",
      "feat: prospect flow — scrape reviews + impact calculator",
      "chore: update dependencies and fix type errors",
      "feat: initial vault room with 3D login experience",
    ][i],
    author: {
      name: i % 3 === 0 ? "Ian Rakow" : "Claude",
      date: new Date(now - i * 3600000 * 6).toISOString(),
    },
    stats: {
      additions: Math.floor(Math.random() * 200) + 5,
      deletions: Math.floor(Math.random() * 80) + 1,
      total: 0,
    },
  })).map((c) => ({ ...c, stats: { ...c.stats!, total: c.stats!.additions + c.stats!.deletions } }))
}

function getMockCommitDetail(sha: string): CommitDetail {
  return {
    sha,
    message: "fix: impact calculator — clearer math for complete review removal",
    author: { name: "Claude", date: new Date().toISOString() },
    stats: { additions: 42, deletions: 15, total: 57 },
    files: [
      {
        filename: "src/app/dashboard/prospect/ProspectFlow.tsx",
        status: "modified",
        additions: 25,
        deletions: 10,
        patch: `@@ -61,10 +61,25 @@\n-    const originalRating = totalStars / reviews.length\n+    const originalRating =\n+      Math.round((totalStars / reviews.length) * 100) / 100\n \n     if (selectedIds.size === 0) {\n       return {\n         originalRating,\n-        projectedRating: originalRating,\n+        projectedRating: originalRating,`,
      },
      {
        filename: "src/components/dashboard/ImpactCard.tsx",
        status: "modified",
        additions: 17,
        deletions: 5,
        patch: `@@ -12,5 +12,17 @@\n-  const change = projected - original\n+  const change = Math.round((projected - original) * 100) / 100\n+  const percentage = original > 0 ? ((change / original) * 100).toFixed(1) : "0"`,
      },
    ],
  }
}

export async function listCommits(page = 1, perPage = 30): Promise<CommitSummary[]> {
  const data = await githubFetch(`/repos/${REPO}/commits?page=${page}&per_page=${perPage}`)

  if (!data) return getMockCommits()

  return (data as Array<Record<string, unknown>>).map((c: Record<string, unknown>) => {
    const commit = c.commit as Record<string, unknown>
    const author = commit.author as Record<string, unknown>
    return {
      sha: c.sha as string,
      message: commit.message as string,
      author: {
        name: author.name as string,
        date: author.date as string,
      },
      stats: c.stats as { additions: number; deletions: number; total: number } | undefined,
    }
  })
}

export async function getCommitDetail(sha: string): Promise<CommitDetail | null> {
  const data = await githubFetch(`/repos/${REPO}/commits/${sha}`)

  if (!data) return getMockCommitDetail(sha)

  const d = data as Record<string, unknown>
  const commit = d.commit as Record<string, unknown>
  const author = commit.author as Record<string, unknown>

  return {
    sha: d.sha as string,
    message: commit.message as string,
    author: {
      name: author.name as string,
      date: author.date as string,
    },
    stats: d.stats as { additions: number; deletions: number; total: number },
    files: ((d.files as Array<Record<string, unknown>>) ?? []).map((f) => ({
      filename: f.filename as string,
      status: f.status as string,
      additions: f.additions as number,
      deletions: f.deletions as number,
      patch: (f.patch as string) ?? "",
    })),
  }
}

export async function compareCommits(base: string, head: string) {
  const data = await githubFetch(`/repos/${REPO}/compare/${base}...${head}`)

  if (!data) {
    return {
      ahead_by: 0,
      behind_by: 0,
      total_commits: 0,
      files: [],
    }
  }

  const d = data as Record<string, unknown>
  return {
    ahead_by: d.ahead_by as number,
    behind_by: d.behind_by as number,
    total_commits: d.total_commits as number,
    files: ((d.files as Array<Record<string, unknown>>) ?? []).map((f) => ({
      filename: f.filename as string,
      status: f.status as string,
      additions: f.additions as number,
      deletions: f.deletions as number,
      patch: (f.patch as string) ?? "",
    })),
  }
}

export async function rollbackToCommit(sha: string) {
  const vercelToken = process.env.VERCEL_TOKEN
  const vercelProjectId = process.env.VERCEL_PROJECT_ID

  if (!vercelToken || !vercelProjectId) {
    return { error: "VERCEL_TOKEN or VERCEL_PROJECT_ID not configured. Cannot trigger rollback deployment." }
  }

  try {
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "reviewredact",
        project: vercelProjectId,
        gitSource: {
          type: "github",
          repo: REPO,
          ref: sha,
        },
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { error: `Vercel deployment failed: ${res.status} — ${body}` }
    }

    const deployment = (await res.json()) as Record<string, unknown>
    return { success: true, deploymentUrl: deployment.url as string }
  } catch (err) {
    return { error: `Rollback failed: ${String(err)}` }
  }
}
