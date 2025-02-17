"use server"
import bcrypt from 'bcryptjs';
import * as z from 'zod';

import { getUserByEmail, getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { SettingsSchema } from '@/schemas';

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const dbUser = await getUserById(user.id as string)

  if (!dbUser) {
    return { error: "Unauthorized!" }
  }

  if (user.isOAuth) {
    values.email = undefined
    values.password = undefined
    values.newPassword = undefined
    values.isTwoFactorEnabled = undefined
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email)

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email allready in use!" }
    }

    const verificationToken = await generateVerificationToken(values.email)

    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return { success: "Confirmation email sent!" }
  }

  if (values.password && values.newPassword && dbUser.hashedPassword) {
    const passwordMatch = await bcrypt.compare(values.password, dbUser.hashedPassword)

    if (!passwordMatch) {
      return { error: "Incorrect password!" }
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10)

    values.password = hashedPassword
    values.newPassword = undefined
  }



  await db.user.update({
    where: {
      id: dbUser.id
    },
    data: {
      name: values.name,
      email: values.email,
      hashedPassword: values.password,
      role: values.role,
      isTwoFactorEnabled: values.isTwoFactorEnabled
    }
  })

  return { success: "Settings Updated!" }
}