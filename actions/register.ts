"use server";

import type * as z from 'zod';

import { authenticationService } from '@/lib/authentication/production';
import type { RegisterSchema } from '@/schemas';

export const register = async (values: z.infer<typeof RegisterSchema>) =>
  authenticationService.register(values);
