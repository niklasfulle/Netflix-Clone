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

export const ProfilSchema = z.object({
  profilId: z.string().optional(),
  profilName: z.string().min(1, 'Name must be set'),
  profilImg: z.string().min(1, 'Img must be set'),
});

export const ProfilIdSchema = z.object({
  profilId: z.string()
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
  movieActor: z.string().min(1, 'Actor must be set'),
  movieType: z.string().min(1, 'Type must be set'),
  movieGenre: z.string().min(1, 'Genre must be set'),
  movieDuration: z.string().min(1, 'Duration must be set').regex(/^(\d{1,2}:)?\d{2}:\d{2}$/g, 'Invalid duration'),
  movieVideo: z.string().min(1, 'Video must be set'),
  movieThumbnail: z.string().min(1, 'Thumbnail must be set'),
})

export const PlaylistSchema = z.object({
  playlistId: z.string().optional(),
  playlistName: z.string().min(1, 'Name must be set'),
})

export const PlaylistSelectSchema = z.object({
  playlistId: z.string(),
  movieId: z.string(),
})

