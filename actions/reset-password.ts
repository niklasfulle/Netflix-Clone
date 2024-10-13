"use server"
import * as z from "zod";
import { ResetPasswordSchema } from "@/schemas"
import { getUserByEmail } from "@/data/user"
import { sendResetPasswordEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) => {
  const validatedField = ResetPasswordSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid email!" }
  }

  const { email } = validatedField.data

  const existingUser = await getUserByEmail(email)

  if (!existingUser) {
    return { error: "Email does not exist!" }
  }

  const passwordResetToken = await generatePasswordResetToken(email)
  await sendResetPasswordEmail(passwordResetToken.email, passwordResetToken.token)

  return { success: "Reset email sent!" }
}