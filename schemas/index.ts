import { UserRole } from "@prisma/client"
import * as z from "zod"

export const LoginSchema = z.object({
  email: z.string().email("Email is requierd"),
  password: z.string().min(1, "Password is requierd"),
  code: z.optional(z.string().min(6, "6 digets requierd"))
})

export const RegisterSchema = z.object({
  email: z.string().email("Email is requierd"),
  password: z.string().min(6, "Minimum 6 characters requierd"),
  confirm: z.string().min(6, "Minimum 6 characters requierd"),
  name: z.string().min(1, "Name is requierd")
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match!",
  path: ["confirm"], // path of error
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Email is requierd"),
})

export const NewPasswordSchema = z.object({
  password: z.string().min(6, "Minimum 6 characters requierd"),
})

export const SettingsSchema = z.object({
  name: z.string(),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
}).refine((data) => {
  if (data.password && !data.newPassword) {
    return false
  }
  return true
}, { message: "Password is required!", path: ["password"] })
  .refine((data) => {
    if (!data.password && data.newPassword) {
      return false
    }
    return true
  }, { message: "New password is required!", path: ["newPassword"] })