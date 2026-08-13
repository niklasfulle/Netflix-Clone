import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, isPublicRoute } from "@/routes"
import { sessionSecurity } from "@/lib/session-security"
import { applySessionIdentity } from "@/lib/authentication/session-user"
import { createProxyAuthenticationConfig } from "@/lib/authentication/proxy-configuration"

const { auth } = NextAuth({
  ...createProxyAuthenticationConfig(authConfig),
  callbacks: {
    async session({ session, token }) {
      return applySessionIdentity(session, token)
    },
  },
})

export default auth(async (req) => {
  const { nextUrl } = req
  const sessionUser = req.auth?.user
  const isLoggedIn = sessionUser?.id
    ? await sessionSecurity.isAuthorized({
        userId: sessionUser.id,
        sessionId: sessionUser.sessionId,
        issuedAt: new Date((sessionUser.sessionIssuedAt ?? 0) * 1000),
      })
    : false

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isPublic = isPublicRoute(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isAdminRoute = ["/admin", "/add", "/edit_movie"].some(
    (path) => nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`),
  )

  if (isApiAuthRoute) {
    return
  }

  if (sessionUser?.isBlocked || sessionUser?.isRevoked) {
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
