import NextAuth from "next-auth"
import type { UserRole } from "@prisma/client"
import authConfig from "@/auth.config"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, isPublicRoute } from "@/routes"

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as UserRole
      }
      if (session.user) {
        session.user.isBlocked = Boolean(token.isBlocked)
      }

      return session
    },
  },
})

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isPublic = isPublicRoute(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isAdminRoute = ["/admin", "/add", "/edit_movie"].some(
    (path) => nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`),
  )

  if (isApiAuthRoute) {
    return
  }

  if (req.auth?.user?.isBlocked) {
    if (nextUrl.pathname === "/auth/error") return
    return Response.redirect(new URL("/auth/error?error=AccessDenied", nextUrl))
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    return
  }

  if (isAdminRoute && req.auth?.user?.role !== "ADMIN") {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
  }

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL("/auth/login", nextUrl))
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
