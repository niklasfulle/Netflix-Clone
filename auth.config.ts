import Credentials from "next-auth/providers/credentials"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"
import bcrypt from "bcryptjs"

import { LoginSchema } from "@/schemas"
import { getUserByEmail } from "./data/user"
import { getGithubCredentials, getGoogleCredentials } from "./lib/get-credentials"

export default {
  providers: [
    Google({
      clientId: getGoogleCredentials().googleClientId,
      clientSecret: getGoogleCredentials().googleClientSecret,
    }),
    Github({
      clientId: getGithubCredentials().githubClientId,
      clientSecret: getGithubCredentials().githubClientSecret,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials)
        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await getUserByEmail(email)
          if (!user || !user.hashedPassword) return null

          const passwordMatch = await bcrypt.compare(password, user.hashedPassword)

          if (passwordMatch) return user
        }

        return null

      },
    })
  ]
} satisfies NextAuthConfig