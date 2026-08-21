"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";

import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { normalizeAuthEmail } from "@/lib/authentication/contracts";
import { authenticationTelemetry } from "@/lib/authentication/production-telemetry";
import type { AuthenticationTelemetryRecord } from "@/lib/authentication/telemetry";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";
import { SettingsSchema } from "@/schemas";
import { currentSecurityContext, sessionSecurity } from "@/lib/session-security";

type SettingsValues = z.infer<typeof SettingsSchema>;
type SettingsResult = { error: string } | { success: string };

function normalizeSettingsValues(values: SettingsValues, isOAuth?: boolean) {
  const normalizedValues = {
    ...values,
    password: values.password || undefined,
    newPassword: values.newPassword || undefined,
    confirmNewPassword: values.confirmNewPassword || undefined,
  };

  if (isOAuth) {
    normalizedValues.email = undefined;
    normalizedValues.password = undefined;
    normalizedValues.newPassword = undefined;
    normalizedValues.confirmNewPassword = undefined;
  }

  return normalizedValues;
}

async function handleEmailChange(
  email: string | undefined,
  currentEmail: string | null,
  userId: string,
): Promise<SettingsResult | null> {
  if (!email || email === currentEmail) {
    return null;
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser && existingUser.id !== userId) {
    return { error: "Email already in use!" };
  }

  const verificationToken = await generateVerificationToken(email, {
    userId,
    targetEmail: email,
  });
  await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  );
  return { success: "Confirmation email sent!" };
}

async function hashNewPassword(
  currentPassword: string | undefined,
  newPassword: string | undefined,
  storedPassword: string | null,
): Promise<{ error?: string; hashedPassword?: string }> {
  if (!currentPassword || !newPassword) {
    return {};
  }
  if (!storedPassword) {
    return { error: "Password cannot be changed for this account." };
  }

  const passwordMatch = await bcrypt.compare(currentPassword, storedPassword);
  if (!passwordMatch) {
    return { error: "Incorrect password!" };
  }

  return { hashedPassword: await bcrypt.hash(newPassword, 10) };
}

function settingsFailureCategory(
  stage: AuthenticationTelemetryRecord['stage'],
): NonNullable<AuthenticationTelemetryRecord['errorCategory']> {
  if (stage === 'mail') return 'mail';
  if (stage === 'credentials') return 'credentials';
  return 'database';
}

function settingsValuesForValidation(
  values: SettingsValues,
  isOAuth?: boolean,
): SettingsValues {
  if (isOAuth) {
    return {
      ...values,
      email: undefined,
      password: undefined,
      newPassword: undefined,
      confirmNewPassword: undefined,
    };
  }
  return {
    ...values,
    email: values.email ? normalizeAuthEmail(values.email) : values.email,
  };
}

async function securePasswordChange(
  userId: string,
  sessionId: string | undefined,
) {
  const context = await currentSecurityContext();
  if (sessionId) {
    await sessionSecurity.revokeOtherSessions({
      userId,
      currentSessionId: sessionId,
      context,
    });
    await sessionSecurity.recordActivity(userId, "password_changed", context);
    return;
  }
  await sessionSecurity.revokeAllSessions({
    userId,
    event: "password_changed",
    context,
  });
}

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const attempt = authenticationTelemetry.start({
    flow: 'account_settings',
    component: 'authentication.action',
  });
  let stage: AuthenticationTelemetryRecord['stage'] = 'session';

  try {
    const user = await currentUser();

    if (!user) {
      attempt.complete({
        stage,
        outcome: 'rejected',
        reasonCode: 'unauthorized',
        retryable: false,
      });
      return { error: "Unauthorized!" };
    }

    stage = 'account';
    const dbUser = await getUserById(user.id as string);

    if (!dbUser) {
      attempt.complete({
        stage,
        outcome: 'rejected',
        reasonCode: 'account_missing',
        retryable: false,
      });
      return { error: "Unauthorized!" };
    }

    const valuesForValidation = settingsValuesForValidation(values, user.isOAuth);
    const parsedValues = SettingsSchema.safeParse(valuesForValidation);

    if (!parsedValues.success) {
      attempt.complete({
        stage: 'request',
        outcome: 'rejected',
        reasonCode: 'invalid_fields',
        retryable: false,
        errorCategory: 'validation',
      });
      return {
        error: parsedValues.error.issues[0]?.message ?? "Invalid settings.",
      };
    }

    const nextValues = normalizeSettingsValues(
      parsedValues.data,
      user.isOAuth,
    );
    stage = 'mail';
    const emailResult = await handleEmailChange(
      nextValues.email,
      dbUser.email,
      user.id as string,
    );
    if (emailResult) {
      attempt.complete({
        stage,
        outcome: 'success' in emailResult ? 'challenge' : 'rejected',
        reasonCode: 'success' in emailResult ? 'verification_sent' : 'email_in_use',
        retryable: false,
      });
      return emailResult;
    }

    stage = 'credentials';
    const passwordResult = await hashNewPassword(
      nextValues.password,
      nextValues.newPassword,
      dbUser.hashedPassword,
    );
    if (passwordResult.error) {
      attempt.complete({
        stage,
        outcome: 'rejected',
        reasonCode: 'invalid_credentials',
        retryable: false,
        errorCategory: 'credentials',
      });
      return { error: passwordResult.error };
    }

    stage = 'account';
    await db.user.update({
      where: {
        id: dbUser.id,
      },
      data: {
        name: nextValues.name,
        ...(nextValues.email !== undefined && { email: nextValues.email }),
        ...(passwordResult.hashedPassword !== undefined && {
          hashedPassword: passwordResult.hashedPassword,
        }),
      },
    });

    if (passwordResult.hashedPassword !== undefined) {
      stage = 'session';
      await securePasswordChange(user.id as string, user.sessionId);
    }

    const passwordChanged = passwordResult.hashedPassword !== undefined;

    attempt.complete({
      stage,
      outcome: 'success',
      reasonCode: passwordChanged ? 'password_updated' : 'settings_updated',
      retryable: false,
    });
    return { success: "Settings updated!" };
  } catch {
    attempt.complete({
      stage,
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      retryable: true,
      errorCategory: settingsFailureCategory(stage),
    });
    return { error: `Settings could not be updated. Reference: ${attempt.correlationId}` };
  }
};
