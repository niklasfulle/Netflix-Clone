import { UserRole } from "@prisma/client"
import type { DefaultSession } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole
  isTwoFactorEnabled: boolean
  isOAuth: boolean
  isBlocked: boolean
}

declare module "next-auth" {
  interface Session {
    user: ExtendedUser
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    isBlocked?: boolean
  }
}
