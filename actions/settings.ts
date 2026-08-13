"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";

import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { normalizeAuthEmail } from "@/lib/authentication/contracts";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";
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
    logBackendAction("settings_email_in_use", { userId }, "error");
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
  userId: string,
): Promise<{ error?: string; hashedPassword?: string }> {
  if (!currentPassword || !newPassword) {
    return {};
  }
  if (!storedPassword) {
    logBackendAction("settings_password_unavailable", { userId }, "error");
    return { error: "Password cannot be changed for this account." };
  }

  const passwordMatch = await bcrypt.compare(currentPassword, storedPassword);
  if (!passwordMatch) {
    logBackendAction("settings_incorrect_password", { userId }, "error");
    return { error: "Incorrect password!" };
  }

  return { hashedPassword: await bcrypt.hash(newPassword, 10) };
}

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    logBackendAction("settings_unauthorized", {}, "error");
    return { error: "Unauthorized!" };
  }

  const dbUser = await getUserById(user.id as string);

  if (!dbUser) {
    logBackendAction(
      "settings_dbuser_unauthorized",
      { userId: user.id },
      "error",
    );
    return { error: "Unauthorized!" };
  }

  const valuesForValidation = user.isOAuth
    ? {
        ...values,
        email: undefined,
        password: undefined,
        newPassword: undefined,
        confirmNewPassword: undefined,
      }
    : {
        ...values,
        email: values.email ? normalizeAuthEmail(values.email) : values.email,
      };
  const parsedValues = SettingsSchema.safeParse(valuesForValidation);

  if (!parsedValues.success) {
    logBackendAction(
      "settings_validation_failed",
      { userId: user.id },
      "error",
    );
    return {
      error: parsedValues.error.issues[0]?.message ?? "Invalid settings.",
    };
  }

  const nextValues = normalizeSettingsValues(
    parsedValues.data,
    user.isOAuth,
  );
  const emailResult = await handleEmailChange(
    nextValues.email,
    dbUser.email,
    user.id as string,
  );
  if (emailResult) return emailResult;

  const passwordResult = await hashNewPassword(
    nextValues.password,
    nextValues.newPassword,
    dbUser.hashedPassword,
    user.id as string,
  );
  if (passwordResult.error) return { error: passwordResult.error };

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
    const context = await currentSecurityContext();
    if (user.sessionId) {
      await sessionSecurity.revokeOtherSessions({
        userId: user.id as string,
        currentSessionId: user.sessionId,
        context,
      });
      await sessionSecurity.recordActivity(
        user.id as string,
        "password_changed",
        context,
      );
    } else {
      await sessionSecurity.revokeAllSessions({
        userId: user.id as string,
        event: "password_changed",
        context,
      });
    }
  }

  logBackendAction("settings_success", { userId: user.id }, "info");

  return { success: "Settings updated!" };
};
