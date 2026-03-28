"use client"

import { useState, useTransition } from "react"
import type { ClientNote } from "@/lib/types"
import {
  addNote,
  updateNote,
  deleteNote,
  togglePinNote,
} from "./client-notes-actions"
import { Pin, Pencil, Trash2, MessageSquarePlus } from "lucide-react"

interface ClientNotesProps {
  clientId: string
  notes: ClientNote[]
  currentUserId: string
  currentUserType: "owner" | "reseller" | "salesperson"
  currentUserName: string
}

const ROLE_COLORS: Record<string, { border: string; badge: string; badgeText: string }> = {
  owner: {
    border: "border-l-brass",
    badge: "bg-brass/15 text-brass",
    badgeText: "Owner",
  },
  reseller: {
    border: "border-l-steel",
    badge: "bg-steel/15 text-steel",
    badgeText: "Reseller",
  },
  salesperson: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400",
    badgeText: "Sales",
  },
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return `${years}y ago`
}

function absoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

export function ClientNotes({
  clientId,
  notes,
  currentUserId,
  currentUserType,
  currentUserName,
}: ClientNotesProps) {
  const [newContent, setNewContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isPending, startTransition] = useTransition()

  // Sort: pinned first, then newest first
  const sorted = [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function handleAdd() {
    if (!newContent.trim()) return
    startTransition(async () => {
      await addNote(clientId, newContent)
      setNewContent("")
    })
  }

  function handleEdit(note: ClientNote) {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  function handleSaveEdit(noteId: string) {
    if (!editContent.trim()) return
    startTransition(async () => {
      await updateNote(noteId, editContent)
      setEditingId(null)
      setEditContent("")
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditContent("")
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      await deleteNote(noteId)
    })
  }

  function handleTogglePin(noteId: string) {
    startTransition(async () => {
      await togglePinNote(noteId)
    })
  }

  function canPin(note: ClientNote) {
    return currentUserType === "owner" || note.author_id === currentUserId
  }

  function canDelete(note: ClientNote) {
    return currentUserType === "owner" || note.author_id === currentUserId
  }

  function canEdit(note: ClientNote) {
    return note.author_id === currentUserId
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      {/* Header */}
      <div className="border-b border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-raised px-1.5 text-[10px] font-medium text-muted-foreground">
            {notes.length}
          </span>
        </div>
      </div>

      {/* Add note */}
      <div className="border-b border-border p-5 space-y-3">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a note about this client..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-steel resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={isPending || !newContent.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-steel px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-steel-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="divide-y divide-border">
        {sorted.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No notes yet — add your first note about this client
          </div>
        ) : (
          sorted.map((note) => {
            const role = ROLE_COLORS[note.author_type] ?? ROLE_COLORS.salesperson
            const isEditing = editingId === note.id

            return (
              <div
                key={note.id}
                className={`border-l-2 ${role.border} px-5 py-4 space-y-2 ${
                  note.is_pinned ? "bg-surface-raised/40" : ""
                }`}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {note.author_name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${role.badge}`}
                    >
                      {role.badgeText}
                    </span>
                    {note.is_pinned && (
                      <Pin className="h-3 w-3 text-brass fill-brass" />
                    )}
                    <span
                      className="text-[10px] text-muted-foreground cursor-default"
                      title={absoluteTime(note.created_at)}
                    >
                      {relativeTime(note.created_at)}
                    </span>
                    {note.updated_at !== note.created_at && (
                      <span
                        className="text-[10px] text-muted-foreground italic cursor-default"
                        title={`Edited ${absoluteTime(note.updated_at)}`}
                      >
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canPin(note) && (
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground hover:text-brass transition-colors disabled:opacity-40"
                        title={note.is_pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className={`h-3.5 w-3.5 ${note.is_pinned ? "fill-brass text-brass" : ""}`} />
                      </button>
                    )}
                    {canEdit(note) && !isEditing && (
                      <button
                        onClick={() => handleEdit(note)}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete(note) && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-steel resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={isPending || !editContent.trim()}
                        className="rounded-md bg-steel px-2.5 py-1 text-xs font-medium text-white hover:bg-steel-light disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
