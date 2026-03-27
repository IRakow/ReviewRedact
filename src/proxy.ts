import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME } from "./lib/constants"
import { verifySession } from "./lib/session"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Public routes — no auth needed
  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/sign/contract/") ||
    pathname.startsWith("/api/contracts/signed/") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/webhooks/")
  ) {
    // If logged in and visiting /, redirect based on role
    if (pathname === "/" && token) {
      const session = await verifySession(token)
      if (session) {
        if (!session.documents_signed && session.user_type !== "owner") {
          return NextResponse.redirect(new URL("/sign", request.url))
        }
        if (session.user_type === "owner") {
          return NextResponse.redirect(new URL("/owner", request.url))
        }
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Cron routes require CRON_SECRET
    if (pathname.startsWith("/api/cron/")) {
      const cronSecret = request.headers.get("authorization")
      if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    return NextResponse.next()
  }

  // All other routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const session = await verifySession(token)
  if (!session) {
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  // Document signing gate — non-owners who haven't signed get redirected to /sign
  if (!session.documents_signed && session.user_type !== "owner") {
    if (!pathname.startsWith("/sign") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/sign", request.url))
    }
    return NextResponse.next()
  }

  // /sign route — allow signed users through (they'll see completed status)
  if (pathname.startsWith("/sign")) {
    return NextResponse.next()
  }

  // Owner routes — owner only
  if (pathname.startsWith("/owner")) {
    if (session.user_type !== "owner") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Admin routes — redirect to owner (backward compat)
  if (pathname.startsWith("/admin")) {
    if (session.user_type === "owner") {
      return NextResponse.redirect(new URL("/owner", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Dashboard routes — all authenticated users with signed docs
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
