import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME } from "./lib/constants"
import { verifySession } from "./lib/session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Public routes — no auth needed
  if (pathname === "/" || pathname.startsWith("/api/auth")) {
    // If logged in and visiting /, redirect to dashboard
    if (pathname === "/" && token) {
      const session = await verifySession(token)
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  // Protected routes — require valid session
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const session = await verifySession(token)
    if (!session) {
      // Invalid/expired token — clear it and redirect
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }

    // Admin routes require admin role
    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
