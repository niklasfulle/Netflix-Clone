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
  email: z.string().email(messages.emailRequired),
  password: z.string().min(1, messages.passwordRequired),
  code: z.optional(z.string().min(6, messages.codeRequired)),
});

export const LoginSchema = createLoginSchema();
export const RegisterSchema = z.object({
  /* NOSONAR */
  email: z.string().email("Email is requierd"),
  password: z.string().min(6, "Minimum 6 characters requierd"),
  confirm: z.string().min(6, "Minimum 6 characters requierd"),
  name: z.string().min(1, "Name is requierd")
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match!",
  path: ["confirm"], // path of error
});

export const ResetPasswordSchema = z.object({
  /* NOSONAR */
  email: z.string().email("Email is requierd"),
})

export const NewPasswordSchema = z.object({
  password: z.string().min(6, "Minimum 6 characters requierd"),
})
export const SettingsSchema = z.object({
  name: z.string().trim().min(2, "Minimum 2 characters required").max(60, "Maximum 60 characters allowed"),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.optional(z.enum([UserRole.ADMIN, UserRole.USER])),
  /* NOSONAR */
  email: z.optional(z.string().email("Enter a valid email address")),
  password: z.optional(z.union([z.string().min(6, "Minimum 6 characters required"), z.literal("")])),
  newPassword: z.optional(z.union([z.string().min(6, "Minimum 6 characters required"), z.literal("")])),
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
