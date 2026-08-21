import { randomUUID } from 'node:crypto';

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import {
  BackupVerificationBusyError,
  BackupVerificationStatusError,
  readBackupVerificationStatus,
  readScheduledBackupStatus,
  requestBackupVerification,
} from '@/lib/backup-verification';

export const runtime = 'nodejs';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [status, scheduled] = await Promise.all([
      readBackupVerificationStatus(),
      readScheduledBackupStatus(),
    ]);
    return Response.json({ status, scheduled }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof BackupVerificationStatusError) {
      return Response.json(
        { error: 'Backup verification status is currently unavailable.' },
        { status: 503, headers: noStoreHeaders },
      );
    }
    return Response.json(
      { error: 'Backup verification status could not be read.' },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function POST() {
  const audit = adminMutationAudit.begin('backup.verify');
  if (!(await isCurrentUserAdmin())) {
    await audit.denied();
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestId = randomUUID();
  try {
    await requestBackupVerification({
      schemaVersion: 1,
      requestId,
      requestedAt: new Date().toISOString(),
    });
    await audit.succeeded({
      target: { type: 'backup', id: requestId },
      metadata: { source: 'manual' },
    });
    return Response.json({ accepted: true, requestId }, {
      status: 202,
      headers: noStoreHeaders,
    });
  } catch (error) {
    await audit.failed({ target: { type: 'backup', id: requestId } });
    if (error instanceof BackupVerificationBusyError) {
      return Response.json(
        { error: 'A backup verification is already pending.' },
        { status: 409, headers: noStoreHeaders },
      );
    }
    return Response.json(
      { error: 'Backup verification could not be requested.' },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
