import { ProspectFlow } from "./ProspectFlow"

export default function ProspectPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div>
        <h1 className="heading-accent text-xl font-semibold tracking-tight text-foreground">
          Sales Prospect Tool
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a Google Business URL to analyze reviews during a live call
        </p>
      </div>
      <div className="mt-6">
        <ProspectFlow />
      </div>
    </div>
  )
}
