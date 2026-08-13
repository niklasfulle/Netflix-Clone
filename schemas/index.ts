import { UserRole } from "@prisma/client"
import * as z from "zod"

export interface LoginValidationMessages {
  emailRequired: string;
  passwordRequired: string;
  codeRequired: string;
}

const defaultLoginValidationMessages: LoginValidationMessages = {
  emailRequired: "Email is required.",
  passwordRequired: "Password is required.",
  codeRequired: "A six-digit code is required.",
};

export const createLoginSchema = (
  messages: LoginValidationMessages = defaultLoginValidationMessages,
) => z.object({
  email: z.email(messages.emailRequired),
  password: z.string().min(1, messages.passwordRequired),
  code: z.optional(z.string().trim().min(6, messages.codeRequired).max(20, messages.codeRequired)),
  challengeMethod: z.optional(z.enum(['totp', 'email_otp'])),
});

export const LoginSchema = createLoginSchema();

export interface RegisterValidationMessages {
  emailRequired: string;
  passwordLength: string;
  nameRequired: string;
  passwordsMismatch: string;
}

const defaultRegisterValidationMessages: RegisterValidationMessages = {
  emailRequired: "Email is required.",
  passwordLength: "Minimum 12 characters required",
  nameRequired: "Name is required.",
  passwordsMismatch: "Passwords don't match.",
};

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const passwordSchema = (message: string) => z.string()
  .min(PASSWORD_MIN_LENGTH, message)
  .max(PASSWORD_MAX_LENGTH, "Maximum 128 characters allowed");

export const createRegisterSchema = (
  messages: RegisterValidationMessages = defaultRegisterValidationMessages,
) => z.object({
  email: z.email(messages.emailRequired),
  password: passwordSchema(messages.passwordLength),
  confirm: passwordSchema(messages.passwordLength),
  name: z.string().trim().min(1, messages.nameRequired),
}).refine((data) => data.password === data.confirm, {
  message: messages.passwordsMismatch,
  path: ["confirm"],
});

export const RegisterSchema = createRegisterSchema();

export const createResetPasswordSchema = (emailRequired = "Email is required.") => z.object({
  email: z.email(emailRequired),
});

export const ResetPasswordSchema = createResetPasswordSchema();

export const createNewPasswordSchema = (
  passwordLength = "Minimum 12 characters required",
  passwordsMismatch = "Passwords don't match.",
) => z.object({
  password: passwordSchema(passwordLength),
  confirm: passwordSchema(passwordLength),
}).refine((data) => data.password === data.confirm, {
  message: passwordsMismatch,
  path: ["confirm"],
});

export const NewPasswordSchema = createNewPasswordSchema();
export const SettingsSchema = z.object({
  name: z.string().trim().min(2, "Minimum 2 characters required").max(60, "Maximum 60 characters allowed"),
  role: z.optional(z.enum([UserRole.ADMIN, UserRole.USER])),
  email: z.optional(z.email("Enter a valid email address")),
  password: z.optional(z.union([z.string().min(1, "Current password is required!"), z.literal("")])),
  newPassword: z.optional(z.union([
    passwordSchema("Minimum 12 characters required"),
    z.literal(""),
  ])),
  confirmNewPassword: z.optional(z.union([
    passwordSchema("Minimum 12 characters required"),
    z.literal(""),
  ])),
}).refine((data) => {
  if (data.password && !data.newPassword) {
    return false
  }
  return true
}, { message: "New password is required!", path: ["newPassword"] })
  .refine((data) => {
    if (!data.password && data.newPassword) {
      return false
    }
    return true
  }, { message: "Current password is required!", path: ["password"] })
  .refine((data) => {
    if (data.newPassword && !data.confirmNewPassword) {
      return false
    }
    return true
  }, { message: "Passwords don't match.", path: ["confirmNewPassword"] })
  .refine((data) => {
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
      return false
    }
    return true
  }, { message: "Passwords don't match.", path: ["confirmNewPassword"] })

export const ProfilSchema = z.object({
  profilId: z.string().trim().min(1).optional(),
  profilName: z.string().min(1, 'Name must be set'),
  profilImg: z.string().min(1, 'Img must be set'),
});

export const ProfilIdSchema = z.object({
  profilId: z.string().trim().min(1)
})

export const FavoriteIdSchema = z.object({
  favoriteId: z.string().optional(),
  movieId: z.string().optional(),
})

export const WatchTimeSchema = z.object({
  movieId: z.string(),
  watchTime: z.number()
})

export const MovieSchema = z.object({
  movieName: z.string().min(1, 'Name must be set'),
  movieDescripton: z.string().min(1, 'Descripton must be set'),
  movieActor: z.array(z.string().min(1)).min(1, 'Mindestens ein Actor muss gewählt werden'),
  movieType: z.string().min(1, 'Type must be set'),
  movieGenre: z.string().min(1, 'Genre must be set'),
  movieDuration: z.string().min(1, 'Duration must be set').regex(/^(\d{1,2}:)?\d{2}:\d{2}$/g, 'Invalid duration'),
  movieVideo: z.string().min(1, 'Video must be set'),
  movieThumbnail: z.string().optional(),
})

export const PlaylistSchema = z.object({
  playlistId: z.string().trim().min(1).optional(),
  playlistName: z.string().min(1, 'Name must be set'),
})

export const PlaylistSelectSchema = z.object({
  playlistId: z.string().trim().min(1),
  movieId: z.string().trim().min(1),
})

export const PlaylistRemoveSchema = z.object({
  playlistId: z.string().trim().min(1),
})
