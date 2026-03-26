import { getSession } from "./session"
import { createServerClient } from "./supabase/server"
import type { Session } from "./types"

/**
 * Check if the session user has access to a specific client.
 * Owners can access all clients.
 * Resellers can access their own clients + their salespeople's clients.
 * Salespeople can access only their own clients.
 */
export async function canAccessClient(
  session: Session,
  clientResellerId: string,
  clientSalespersonId?: string | null
): Promise<boolean> {
  if (session.user_type === "owner") return true

  if (session.user_type === "reseller") {
    // Reseller can access their direct clients
    if (clientResellerId === session.user_id) return true
    return false
  }

  if (session.user_type === "salesperson") {
    // Salesperson can access their own clients
    if (clientSalespersonId === session.user_id) return true
    // Also can access the reseller's direct clients if they're under that reseller
    if (session.parent_reseller_id && clientResellerId === session.parent_reseller_id && !clientSalespersonId) {
      return false // Salespeople only see their own assigned clients
    }
    return false
  }

  return false
}

/**
 * Get the reseller_id to use when a user creates a client.
 * For resellers: their own ID
 * For salespeople: their parent reseller's ID (or null for owner-direct)
 */
export function getResellerIdForClient(session: Session): string | null {
  if (session.user_type === "reseller") return session.user_id
  if (session.user_type === "salesperson") return session.parent_reseller_id ?? null
  return null
}

/**
 * Get the salesperson_id to use when a salesperson creates a client.
 */
export function getSalespersonIdForClient(session: Session): string | null {
  if (session.user_type === "salesperson") return session.user_id
  return null
}

/**
 * Require a valid session or redirect. Returns session.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    const { redirect } = await import("next/navigation")
    redirect("/")
    // redirect() throws, but TS doesn't know that
    throw new Error("Unreachable")
  }
  return session
}

/**
 * Verify the current user can access a client by fetching from DB and checking.
 */
export async function verifyClientAccess(
  session: Session,
  clientId: string
): Promise<{ reseller_id: string; salesperson_id: string | null }> {
  const supabase = createServerClient()

  const { data: client } = await supabase
    .from("clients")
    .select("reseller_id, salesperson_id")
    .eq("id", clientId)
    .single()

  if (!client) {
    throw new Error("Client not found")
  }

  const hasAccess = await canAccessClient(
    session,
    client.reseller_id,
    client.salesperson_id
  )

  if (!hasAccess) {
    throw new Error("Unauthorized")
  }

  return client
}
