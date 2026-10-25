import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { reviewVideoSuggestions } from '@/lib/video-analysis/service';
import { VideoAnalysisError } from '@/lib/video-analysis/contracts';

export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
const review = z.object({ ids: z.array(z.string().min(1).max(191)).min(1).max(40), action: z.enum(['ACCEPT', 'REJECT']) }).strict();
type Context = { params: Promise<{ analysisId: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, 403);
  try {
    const { analysisId } = await context.params;
    const analysis = await db.videoAnalysis.findUnique({ where: { id: analysisId }, select: {
      id: true, status: true, model: true, samplingProfile: true, sampleCount: true, processedCount: true, durationSeconds: true, errorCode: true, completedAt: true,
      jobRun: { select: { id: true, status: true, progress: true } },
      suggestions: { where: { categoryId: { not: null } }, orderBy: { confidence: 'desc' }, select: { id: true, name: true, nameEn: true, confidence: true, evidence: true, state: true, categoryId: true, category: { select: { name: true, nameEn: true } } } },
    } });
    return analysis ? json(analysis) : json({ error: 'ANALYSIS_NOT_FOUND' }, 404);
  } catch { return json({ error: 'ANALYSIS_UNAVAILABLE' }, 503); }
}

export async function PATCH(request: Request, context: Context) {
  const audit = adminMutationAudit.begin('video.analysis.review');
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const parsed = review.safeParse(await request.json().catch(() => null));
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    const { analysisId } = await context.params;
    const result = await reviewVideoSuggestions(analysisId, parsed.data.ids, parsed.data.action);
    await audit.succeeded({ target: { type: 'video_analysis', id: analysisId }, metadata: { acceptedCount: parsed.data.action === 'ACCEPT' ? result.changed : 0, rejectedCount: parsed.data.action === 'REJECT' ? result.changed : 0 } });
    return json(result);
  } catch (error) {
    await audit.failed();
    return json({ error: error instanceof VideoAnalysisError ? error.code : 'ANALYSIS_UNAVAILABLE' }, error instanceof VideoAnalysisError ? 409 : 503);
  }
}
