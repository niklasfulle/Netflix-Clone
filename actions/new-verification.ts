"use server";

import { authenticationService } from '@/lib/authentication/production';

export const newVerification = async (token: string) =>
  authenticationService.verifyEmail({ token });
