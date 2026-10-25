import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { VideoAnalysisError } from '@/lib/video-analysis/contracts';
import { readVideoEvaluations, submitVideoEvaluation } from '@/lib/video-evaluation/service';

export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
const input = z.object({ requestId: z.uuid() }).strict();
export async function GET(request: Request) {
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, 403);
  const id = new URL(request.url).searchParams.get('id') ?? undefined;
  if (id && !/^[A-Za-z0-9_-]{8,128}$/.test(id)) return json({ error: 'INVALID_INPUT' }, 400);
  try { return json(await readVideoEvaluations(id)); }
  catch { return json({ error: 'EVALUATION_UNAVAILABLE' }, 503); }
}
export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('video.evaluation.submit');
  const actor = await currentUser();
  if (!actor?.id || actor.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    const result = await submitVideoEvaluation(parsed.data.requestId, actor.id);
    await audit.succeeded({ target: { type: 'video_evaluation', id: result.evaluationId }, metadata: { duplicate: result.duplicate } });
    return json(result, 202);
  } catch (error) {
    await audit.failed();
    return json({ error: error instanceof VideoAnalysisError ? error.code : 'EVALUATION_UNAVAILABLE' }, error instanceof VideoAnalysisError && error.permanent ? 409 : 503);
  }
}
