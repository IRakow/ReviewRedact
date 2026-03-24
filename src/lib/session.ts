import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "./constants"
import type { Session } from "./types"

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET environment variable is required")
  return new TextEncoder().encode(secret)
}

export async function createSession(session: Session): Promise<string> {
  const token = await new SignJWT({
    reseller_id: session.reseller_id,
    role: session.role,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey())

  return token
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      reseller_id: payload.reseller_id as string,
      role: payload.role as "admin" | "reseller",
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
