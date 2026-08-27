import { z } from 'zod';

import { currentUser } from '@/lib/auth';
import {
  InvalidJobListCursorError,
  JOB_ADMIN_STATUSES,
} from '@/lib/jobs/administration';
import { backgroundJobAdministration } from '@/lib/jobs/administration-runtime';
import { JOB_NAMES } from '@/lib/jobs/contracts';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.enum(JOB_ADMIN_STATUSES).optional(),
  jobType: z.enum([
    JOB_NAMES.mediaIntegrityScan,
    JOB_NAMES.backupVerification,
    JOB_NAMES.backupRetentionCleanup,
  ]).optional(),
  cursor: z.string().trim().min(1).max(1024).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function GET(request: Request): Promise<Response> {
  const user = await currentUser();
  if (!user?.id || user.role !== 'ADMIN') return json({ error: 'Forbidden' }, 403);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    jobType: url.searchParams.get('jobType') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return json({ error: 'Invalid job list filters' }, 400);

  try {
    const actor = {
      userId: user.id,
      role: 'ADMIN' as const,
    };
    const [page, health] = await Promise.all([
      backgroundJobAdministration.list(actor, parsed.data),
      backgroundJobAdministration.health(actor),
    ]);
    return json({ ...page, health });
  } catch (error) {
    if (error instanceof InvalidJobListCursorError) {
      return json({ error: 'Invalid job list cursor' }, 400);
    }
    return json({ error: 'Unable to load background jobs' }, 503);
  }
}
