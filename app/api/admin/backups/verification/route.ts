import { randomUUID } from 'node:crypto';

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import {
  BackupVerificationStatusError,
  readBackupVerificationStatus,
  readScheduledBackupStatus,
} from '@/lib/backup-verification';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import {
  OperationalLeaseLostError,
  OperationalLeaseUnavailableError,
} from '@/lib/operations/lease';
import { operationalLeases } from '@/lib/operations/runtime';

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
    return await operationalLeases.execute({
      operation: 'backup.verify',
      targetId: 'backup-verification:latest',
      ttlMs: 30_000,
    }, async () => {
      const user = await currentUser();
      if (!user || user.role !== 'ADMIN') {
        throw new Error('Authenticated administrator context is unavailable');
      }
      const requestedAt = new Date().toISOString();
      const result = await backgroundJobSubmission.submit({
        name: 'backup.verification.request',
        version: 1,
        payload: { scope: 'latest', requestId, requestedAt },
        actor: { userId: user.id, role: 'ADMIN' },
        target: { type: 'backup', id: 'latest' },
        idempotencyKey: requestId,
        correlationId: audit.correlationId,
      });
      await audit.succeeded({
        target: { type: 'background_job', id: result.id },
        metadata: { source: 'manual' },
      });
      return Response.json({
        jobRunId: result.id,
        queueJobId: result.queueJobId,
        status: result.status,
        duplicate: result.duplicate,
        correlationId: audit.correlationId,
      }, {
        status: result.duplicate ? 200 : 202,
        headers: noStoreHeaders,
      });
    });
  } catch (error) {
    await audit.failed({ target: { type: 'backup', id: requestId } });
    if (
      error instanceof OperationalLeaseUnavailableError
      || error instanceof OperationalLeaseLostError
    ) {
      return Response.json(
        { error: 'A backup verification is already pending.' },
        { status: 409, headers: noStoreHeaders },
      );
    }
    return Response.json(
      { error: 'Backup verification could not be queued.' },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
