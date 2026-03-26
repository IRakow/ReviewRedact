"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

interface Target {
  id: string
  name: string
}

interface ClientOption {
  id: string
  business_name: string
}

interface Override {
  id: string
  set_by_type: string
  set_by_id: string
  target_type: string
  target_id: string
  client_id: string | null
  rate_google: number
  notes: string | null
  created_at: string
}

interface OverrideFormProps {
  resellers: Target[]
  salespeople: Target[]
  clients: ClientOption[]
  overrides: Override[]
  nameMap: Record<string, string>
  createOverride: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  deleteOverride: (id: string) => Promise<{ error?: string; success?: boolean }>
}

export function OverrideForm({
  resellers,
  salespeople,
  clients,
  overrides,
  nameMap,
  createOverride,
  deleteOverride,
}: OverrideFormProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [targetType, setTargetType] = useState<"reseller" | "salesperson">("reseller")
  const [targetId, setTargetId] = useState("")
  const [clientId, setClientId] = useState("")
  const [rateGoogle, setRateGoogle] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const targets = targetType === "reseller" ? resellers : salespeople

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const fd = new FormData()
    fd.set("target_type", targetType)
    fd.set("target_id", targetId)
    fd.set("client_id", clientId)
    fd.set("rate_google", rateGoogle)
    fd.set("notes", notes)

    startTransition(async () => {
      const result = await createOverride(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        setTargetId("")
        setClientId("")
        setRateGoogle("")
        setNotes("")
        router.refresh()
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rate override?")) return
    startTransition(async () => {
      const result = await deleteOverride(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-md border border-steel/30 bg-steel/10 px-4 py-2 text-sm font-medium text-steel transition-colors hover:bg-steel/20"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Override"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-md border border-border bg-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Create Rate Override</h3>

          {error && (
            <p className="text-xs font-medium text-red-400">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Target type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => { setTargetType(e.target.value as "reseller" | "salesperson"); setTargetId("") }}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
              >
                <option value="reseller">Reseller</option>
                <option value="salesperson">Salesperson</option>
              </select>
            </div>

            {/* Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
              >
                <option value="">Select {targetType}...</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Client (optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client (optional — blank = universal)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
              >
                <option value="">Universal (all clients)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>

            {/* Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rate (Google)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={rateGoogle}
                onChange={(e) => setRateGoogle(e.target.value)}
                required
                placeholder="e.g. 850"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for override..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-steel focus:outline-none focus:ring-1 focus:ring-steel"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-steel hover:bg-steel/20 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Create Override"}
          </button>
        </form>
      )}

      {/* Existing overrides table */}
      <div className="rounded-md border border-border bg-surface">
        {overrides.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No rate overrides set</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Set By</th>
                <th className="px-5 py-3 text-left">Target</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Rate</th>
                <th className="px-5 py-3 text-left">Notes</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overrides.map((o) => (
                <tr key={o.id} className="hover:bg-surface/80">
                  <td className="px-5 py-3 text-foreground">{nameMap[o.set_by_id] ?? o.set_by_type}</td>
                  <td className="px-5 py-3 text-foreground">{nameMap[o.target_id] ?? o.target_type}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.client_id ? nameMap[o.client_id] ?? "—" : "Universal"}</td>
                  <td className="px-5 py-3 font-mono text-foreground">${Number(o.rate_google).toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{o.notes ?? "—"}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(o.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
