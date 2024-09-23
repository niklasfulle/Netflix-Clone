import { compare } from "bcrypt"
import { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prismadb from "@/lib/prismadb"
import NextAuth from "next-auth/next"
import { z } from "zod"

const loginUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(5, 'Password should be minimum 5 characters'),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismadb),
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const { email, password } = loginUserSchema.parse(credentials);

        const user = await prismadb.user.findUnique({
          where: {
            email: email
          }
        })

        if (!user || !user.hashedPassword) {
          throw new Error("Email does not exist")
        }

        const isCorrectPassword = await compare(
          password,
          user.hashedPassword
        )

        if (!isCorrectPassword) {
          throw new Error("Incorrect password")
        }

        return user
      }
    })
  ],
  pages: {
    signIn: "/auth",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt"
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)