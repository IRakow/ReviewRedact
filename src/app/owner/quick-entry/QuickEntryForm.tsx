"use client"

import { useState, useTransition, useRef } from "react"
import { createQuickEntry, updateEntryStatus, deleteEntry } from "./actions"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Send,
  Plus,
} from "lucide-react"

const ENTRY_TYPES = [
  { value: "free_demo", label: "Free Demo" },
  { value: "comp", label: "Comp / Freebie" },
  { value: "one_off", label: "One-Off Deal" },
  { value: "credit", label: "Credit" },
  { value: "referral", label: "Referral" },
  { value: "misc", label: "Misc" },
]

interface QuickEntry {
  id: string
  title: string
  type: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  amount: number
  notes: string | null
  notify_emails: string[]
  status: string
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function typeLabel(type: string) {
  return ENTRY_TYPES.find((t) => t.value === type)?.label ?? type
}

function statusColor(status: string) {
  switch (status) {
    case "open": return "text-amber-400"
    case "completed": return "text-emerald-400"
    case "cancelled": return "text-red-400"
    default: return "text-muted-foreground"
  }
}

export function QuickEntryForm({ entries }: { entries: QuickEntry[] }) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "completed" | "cancelled">("all")

  function handleSubmit(formData: FormData) {
    setError("")
    setSuccess(false)
    startTransition(async () => {
      const result = await createQuickEntry(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        formRef.current?.reset()
        setTimeout(() => { setSuccess(false); setShowForm(false) }, 1500)
      }
    })
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateEntryStatus(id, status)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEntry(id)
    })
  }

  const filtered = filter === "all"
    ? entries
    : entries.filter((e) => e.status === filter)

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(["all", "open", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                filter === f
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
              )}
            >
              {f} {f !== "all" ? `(${entries.filter((e) => e.status === f).length})` : `(${entries.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Quick Add
        </button>
      </div>

      {/* Quick add form */}
      {showForm && (
        <form
          ref={formRef}
          action={handleSubmit}
          className="rounded-md border border-gold/20 bg-surface p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Title */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                What is this? *
              </label>
              <input
                name="title"
                required
                placeholder="e.g. Free demo for Joe's Pizza, comp for referral..."
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Type
              </label>
              <select
                name="type"
                defaultValue="misc"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Contact name */}
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Contact Name
              </label>
              <input
                name="contact_name"
                placeholder="Optional"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Contact email */}
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Contact Email
              </label>
              <input
                name="contact_email"
                type="email"
                placeholder="Optional"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Contact phone */}
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Contact Phone
              </label>
              <input
                name="contact_phone"
                placeholder="Optional"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Amount ($)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0 = free"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Any details, context, whatever you want..."
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
              />
            </div>

            {/* Notify emails */}
            <div className="lg:col-span-1">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                <Send className="inline h-3 w-3 mr-1" />
                Email Notify
              </label>
              <input
                name="notify_emails"
                placeholder="email1@, email2@ (comma separated)"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                These people get emailed about this entry
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium uppercase tracking-wider text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Entry added</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-gold/15 border border-gold/30 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/25 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-12 text-center text-sm text-muted-foreground">
          {filter === "all" ? "No entries yet — hit Quick Add to start" : `No ${filter} entries`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "rounded-md border bg-surface transition-colors",
                entry.status === "completed" ? "border-emerald-400/10" :
                entry.status === "cancelled" ? "border-red-400/10 opacity-60" :
                "border-border hover:border-gold/20"
              )}
            >
              {/* Row header */}
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.title}</span>
                    <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {typeLabel(entry.type)}
                    </span>
                    <span className={cn("text-[10px] font-medium uppercase tracking-wider", statusColor(entry.status))}>
                      {entry.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {entry.contact_name && <span>{entry.contact_name}</span>}
                    <span className="font-mono">
                      {entry.amount === 0 ? "FREE" : `$${Number(entry.amount).toFixed(2)}`}
                    </span>
                    <span>{timeAgo(entry.created_at)}</span>
                    {entry.notify_emails.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Send className="h-2.5 w-2.5" />
                        {entry.notify_emails.length}
                      </span>
                    )}
                  </div>
                </div>
                {expandedId === entry.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Expanded details */}
              {expandedId === entry.id && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    {entry.contact_name && (
                      <div>
                        <span className="text-muted-foreground">Contact: </span>
                        <span className="text-foreground">{entry.contact_name}</span>
                      </div>
                    )}
                    {entry.contact_email && (
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <a href={`mailto:${entry.contact_email}`} className="text-steel hover:text-steel-light">{entry.contact_email}</a>
                      </div>
                    )}
                    {entry.contact_phone && (
                      <div>
                        <span className="text-muted-foreground">Phone: </span>
                        <a href={`tel:${entry.contact_phone}`} className="text-steel hover:text-steel-light">{entry.contact_phone}</a>
                      </div>
                    )}
                  </div>

                  {entry.notes && (
                    <div className="rounded bg-surface-raised px-3 py-2 text-xs text-foreground whitespace-pre-wrap">
                      {entry.notes}
                    </div>
                  )}

                  {entry.notify_emails.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Notified: </span>
                      <span className="text-foreground">{entry.notify_emails.join(", ")}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {entry.status === "open" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(entry.id, "completed")}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400 hover:bg-emerald-400/10 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" /> Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(entry.id, "cancelled")}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" /> Cancel
                        </button>
                      </>
                    )}
                    {entry.status !== "open" && (
                      <button
                        onClick={() => handleStatusChange(entry.id, "open")}
                        disabled={isPending}
                        className="flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Reopen
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("Delete this entry?")) handleDelete(entry.id)
                      }}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
