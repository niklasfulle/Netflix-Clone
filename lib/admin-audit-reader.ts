import { adminAuditReadRepository } from '@/data/admin-audit-reader';
import { createAdminAuditReader } from '@/lib/administration/admin-audit-reader';
import { isCurrentUserAdmin } from '@/lib/admin-auth';

export const adminAuditReader = createAdminAuditReader({
  repository: adminAuditReadRepository,
  async resolveActor() {
    return await isCurrentUserAdmin()
      ? { userId: 'current-administrator', role: 'ADMIN' }
      : null;
  },
});
