"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilIdSchema } from '@/schemas';
import { findOwnedProfile } from '@/lib/ownership';

export const use = async (values: z.infer<typeof ProfilIdSchema>) => {
  const user = await currentUser()

  if (!user?.id) {
    logBackendAction('profilUse_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilIdSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('profilUse_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  const { profilId } = validatedField.data

  const ownedProfile = await findOwnedProfile(profilId, user.id);

  if (!ownedProfile) {
    logBackendAction('profilUse_not_found', { userId: user.id, profilId }, 'warn');
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

  logBackendAction('profilUse_success', { userId: user.id, profilId }, 'info');

  return { success: "Profil use!" }
}
