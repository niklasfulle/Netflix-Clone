import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import bcrypt from "bcryptjs"
import { createHash } from "node:crypto"

import { LoginSchema } from "@/schemas"
import { getUserByEmail } from "./data/user"
import { getUserById } from "./data/user"
import { qrDevicePairingRepository } from "./data/qr-device-pairing"
import { configuredPasskeyProvider, passkeysEnabled } from "@/lib/passkey-provider"

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials)
        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await getUserByEmail(email)
          if (!user?.hashedPassword) return null

          const passwordMatch = await bcrypt.compare(password, user.hashedPassword)

          if (passwordMatch) return user
        }

        return null

      },
    }),
    Credentials({
      id: "qr-device",
      name: "QR device",
      credentials: { exchangeSecret: { label: 'Exchange secret', type: 'password' } },
      async authorize(credentials) {
        const exchangeSecret = credentials?.exchangeSecret;
        if (typeof exchangeSecret !== 'string' || exchangeSecret.length < 32 || exchangeSecret.length > 128) {
          return null;
        }
        const userId = await qrDevicePairingRepository.consumeExchange({
          exchangeSecretHash: createHash('sha256').update(exchangeSecret).digest('hex'),
          now: new Date(),
        });
        if (!userId) return null;
        return getUserById(userId);
      },
    }),
    ...(configuredPasskeyProvider ? [configuredPasskeyProvider] : []),
  ],
  experimental: { enableWebAuthn: passkeysEnabled },
} satisfies NextAuthConfig
