"use server";

import type * as z from 'zod';

import { authenticationService } from '@/lib/authentication/production';
import type { NewPasswordSchema } from '@/schemas';

export const setNewPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null,
) => authenticationService.setNewPassword({ ...values, token });
