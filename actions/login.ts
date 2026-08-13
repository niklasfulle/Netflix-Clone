"use server";

import type * as z from 'zod';

import { authenticationService } from '@/lib/authentication/production';
import type { LoginSchema } from '@/schemas';

export const login = async (values: z.infer<typeof LoginSchema>) =>
  authenticationService.login(values);
