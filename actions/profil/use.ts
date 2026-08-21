"use server"
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilIdSchema } from '@/schemas';
import { findOwnedProfile } from '@/lib/ownership';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';

export const use = async (values: z.infer<typeof ProfilIdSchema>) => {
  const attempt = authenticationTelemetry.start({
    flow: 'profile_handoff',
    component: 'authentication.action',
  });
  try {
    const user = await currentUser()

    if (!user?.id) {
      attempt.complete({
        stage: 'session', outcome: 'rejected', reasonCode: 'unauthorized', retryable: false,
      });
      return { error: "Unauthorized!" }
    }

    const validatedField = ProfilIdSchema.safeParse(values);

    if (!validatedField.success) {
      attempt.complete({
        stage: 'request', outcome: 'rejected', reasonCode: 'invalid_fields',
        retryable: false, errorCategory: 'validation',
      });
      return { error: "Invalid fields!" }
    }
    const { profilId } = validatedField.data

    const ownedProfile = await findOwnedProfile(profilId, user.id);

    if (!ownedProfile) {
      attempt.complete({
        stage: 'account', outcome: 'rejected', reasonCode: 'account_missing', retryable: false,
      });
      return { error: "Profile not found!" }
    }

    await db.$transaction(async (transaction) => {
      await transaction.profil.updateMany({
        where: { userId: user.id },
        data: { inUse: false },
      });
      await transaction.profil.update({
        where: { id: ownedProfile.id },
        data: { inUse: true },
      });
    });

    attempt.complete({
      stage: 'session', outcome: 'success', reasonCode: 'profile_selected', retryable: false,
    });
    return { success: "Profil use!" }
  } catch {
    attempt.complete({
      stage: 'session', outcome: 'failed', reasonCode: 'unexpected_failure',
      retryable: true, errorCategory: 'database',
    });
    return { error: `Profile could not be selected. Reference: ${attempt.correlationId}` };
  }
}
