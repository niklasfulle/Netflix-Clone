import { randomUUID } from 'node:crypto';

import { adminAudit } from '@/lib/admin-audit';
import { createAdminMutationAudit } from '@/lib/administration/admin-mutation-audit';
import { logBackendAction } from '@/lib/logger';

export const adminMutationAudit = createAdminMutationAudit({
  audit: adminAudit,
  createCorrelationId: randomUUID,
  reportFailure(details) {
    logBackendAction('admin_audit_write_failed', details, 'error');
  },
});
