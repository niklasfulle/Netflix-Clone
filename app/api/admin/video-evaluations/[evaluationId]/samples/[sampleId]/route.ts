import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { EvaluationEvidenceError, readEvaluationEvidence, reviewEvaluationEvidence } from '@/lib/video-evaluation/evidence';

export const dynamic = 'force-dynamic';
const id = z.string().regex(/^[A-Za-z0-9_-]{8,128}$/);
const parameters = z.object({ evaluationId: id, sampleId: id }).strict();
type Context = { params: Promise<{ evaluationId: string; sampleId: string }> };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
const failure = (error: unknown) => json({ error: error instanceof EvaluationEvidenceError ? error.code : 'EVIDENCE_UNAVAILABLE' }, error instanceof EvaluationEvidenceError ? error.status : 503);

export async function GET(_request: Request, context: Context) {
  if ((await currentUser())?.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, 403);
  const parsed = parameters.safeParse(await context.params);
  if (!parsed.success) return json({ error: 'INVALID_INPUT' }, 400);
  try { return json(await readEvaluationEvidence(parsed.data.evaluationId, parsed.data.sampleId)); }
  catch (error) { return failure(error); }
}
async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new EvaluationEvidenceError('INVALID_INPUT', 400);
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16384) throw new EvaluationEvidenceError('INVALID_INPUT', 413);
      chunks.push(chunk.value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new EvaluationEvidenceError('INVALID_INPUT', 400); }
  } finally { await reader.cancel().catch(() => undefined); }
}
export async function PATCH(request: Request, context: Context) {
  const audit = adminMutationAudit.begin('video.evaluation.inspect');
  const actor = await currentUser();
  if (!actor?.id || actor.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const parsed = parameters.safeParse(await context.params);
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    const result = await reviewEvaluationEvidence(parsed.data.evaluationId, parsed.data.sampleId, await boundedBody(request), actor.id);
    await audit.succeeded({ target: { type: 'video_evaluation', id: parsed.data.evaluationId }, metadata: { labelCount: result.labelCount } });
    return json(result);
  } catch (error) { await audit.failed(); return failure(error); }
}
