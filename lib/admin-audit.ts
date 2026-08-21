import { randomUUID } from 'node:crypto';

import { UserRole } from '@prisma/client';

import { adminAuditRepository } from '@/data/admin-audit';
import { createAdminAudit } from '@/lib/administration/admin-audit';
import { currentUser } from '@/lib/auth';

export const adminAudit = createAdminAudit({
  repository: adminAuditRepository,
  async resolveActor() {
    const user = await currentUser();
    if (!user?.id || !user.role) return null;
    return {
      userId: user.id,
      role: user.role === UserRole.ADMIN ? 'ADMIN' : 'USER',
    };
  },
  now: () => new Date(),
  createId: randomUUID,
});
