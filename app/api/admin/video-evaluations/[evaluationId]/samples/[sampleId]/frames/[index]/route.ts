import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { EvaluationEvidenceError, readEvaluationFrame } from '@/lib/video-evaluation/evidence';

export const dynamic = 'force-dynamic';
const id = z.string().regex(/^[A-Za-z0-9_-]{8,128}$/);
const parameters = z.object({ evaluationId: id, sampleId: id, index: z.enum(['0', '1', '2']) }).strict();
type Context = { params: Promise<{ evaluationId: string; sampleId: string; index: string }> };
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' };
export async function GET(_request: Request, context: Context) {
  if ((await currentUser())?.role !== 'ADMIN') return Response.json({ error: 'FORBIDDEN' }, { status: 403, headers });
  const parsed = parameters.safeParse(await context.params);
  if (!parsed.success) return Response.json({ error: 'INVALID_INPUT' }, { status: 400, headers });
  try {
    const frame = await readEvaluationFrame(parsed.data.evaluationId, parsed.data.sampleId, Number(parsed.data.index));
    return new Response(Uint8Array.from(frame), { headers: { ...headers, 'Content-Type': 'image/jpeg', 'Content-Length': String(frame.length) } });
  } catch (error) {
    return Response.json({ error: error instanceof EvaluationEvidenceError ? error.code : 'EVIDENCE_UNAVAILABLE' }, { status: error instanceof EvaluationEvidenceError ? error.status : 503, headers });
  }
}
