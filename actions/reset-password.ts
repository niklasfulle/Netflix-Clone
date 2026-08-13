"use server";

import type * as z from 'zod';

import { authenticationService } from '@/lib/authentication/production';
import type { ResetPasswordSchema } from '@/schemas';

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) =>
  authenticationService.requestPasswordReset(values);
