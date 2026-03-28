"use server"

import { getSession } from "@/lib/session"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { verifyClientAccess } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addNote(clientId: string, content: string) {
  const session = await getSession()
  if (!session) redirect("/")

  await verifyClientAccess(session, clientId)

  const trimmed = content.trim()
  if (!trimmed) throw new Error("Note content cannot be empty")

  const supabase = createServerClient()

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    author_type: session.user_type,
    author_id: session.user_id,
    author_name: session.name,
    content: trimmed,
  })

  if (error) throw new Error(`Failed to add note: ${error.message}`)

  revalidatePath(`/owner/clients/${clientId}`)
  revalidatePath(`/dashboard/clients/${clientId}`)
}

export async function updateNote(noteId: string, content: string) {
  const session = await getSession()
  if (!session) redirect("/")

  const trimmed = content.trim()
  if (!trimmed) throw new Error("Note content cannot be empty")

  const supabase = createServerClient()

  // Fetch note to verify author
  const { data: note } = await supabase
    .from("client_notes")
    .select("client_id, author_id")
    .eq("id", noteId)
    .single()

  if (!note) throw new Error("Note not found")

  // Only the author can edit
  if (note.author_id !== session.user_id) {
    throw new Error("Only the author can edit this note")
  }

  const { error } = await supabase
    .from("client_notes")
    .update({ content: trimmed, updated_at: new Date().toISOString() })
    .eq("id", noteId)

  if (error) throw new Error(`Failed to update note: ${error.message}`)

  revalidatePath(`/owner/clients/${note.client_id}`)
  revalidatePath(`/dashboard/clients/${note.client_id}`)
}

export async function deleteNote(noteId: string) {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: note } = await supabase
    .from("client_notes")
    .select("client_id, author_id")
    .eq("id", noteId)
    .single()

  if (!note) throw new Error("Note not found")

  // Owner can delete any, others only their own
  if (session.user_type !== "owner" && note.author_id !== session.user_id) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("client_notes")
    .delete()
    .eq("id", noteId)

  if (error) throw new Error(`Failed to delete note: ${error.message}`)

  revalidatePath(`/owner/clients/${note.client_id}`)
  revalidatePath(`/dashboard/clients/${note.client_id}`)
}

export async function togglePinNote(noteId: string) {
  const session = await getSession()
  if (!session) redirect("/")

  const supabase = createServerClient()

  const { data: note } = await supabase
    .from("client_notes")
    .select("client_id, author_id, is_pinned")
    .eq("id", noteId)
    .single()

  if (!note) throw new Error("Note not found")

  // Owner can pin/unpin any, others only their own
  if (session.user_type !== "owner" && note.author_id !== session.user_id) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("client_notes")
    .update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() })
    .eq("id", noteId)

  if (error) throw new Error(`Failed to toggle pin: ${error.message}`)

  revalidatePath(`/owner/clients/${note.client_id}`)
  revalidatePath(`/dashboard/clients/${note.client_id}`)
}
