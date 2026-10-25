import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { submitVideoAnalysis } from '@/lib/video-analysis/service';
import { analysisModelAvailable, videoAnalysisEnabled } from '@/lib/video-analysis/model';
import { VideoAnalysisError, VIDEO_ANALYSIS_MODEL } from '@/lib/video-analysis/contracts';

export const dynamic = 'force-dynamic';
const input = z.object({ movieId: z.string().min(1).max(191), force: z.boolean().optional() }).strict();
const query = z.object({ movieId: z.string().min(1).max(191).optional(), search: z.string().trim().max(120).default(''), page: z.coerce.number().int().min(1).max(100000).default(1) });
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request: Request) {
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, 403);
  const params = new URL(request.url).searchParams;
  const parsed = query.safeParse({ movieId: params.get('movieId') ?? undefined, search: params.get('search') ?? '', page: params.get('page') ?? 1 });
  if (!parsed.success) return json({ error: 'INVALID_INPUT' }, 400);
  const { movieId, search, page } = parsed.data;
  const where = { ...(movieId && { id: movieId }), ...(search && { title: { contains: search, mode: 'insensitive' as const } }) };
  try {
    const [items, total, available] = await Promise.all([
      db.movie.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20, select: {
        id: true, title: true, type: true, duration: true, videoUrl: true,
        videoAnalyses: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true, sampleCount: true, processedCount: true, errorCode: true,
          jobRun: { select: { id: true, status: true, progress: true } } } },
      } }), db.movie.count({ where }), analysisModelAvailable(),
    ]);
    return json({ items, total, totalPages: Math.ceil(total / 20), model: { enabled: videoAnalysisEnabled(), available, name: VIDEO_ANALYSIS_MODEL } });
  } catch { return json({ error: 'ANALYSIS_UNAVAILABLE' }, 503); }
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('video.analysis.submit');
  const actor = await currentUser();
  if (!actor?.id || actor.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    const result = await submitVideoAnalysis(parsed.data.movieId, actor.id, parsed.data.force);
    await audit.succeeded({ target: { type: 'video_analysis', id: result.analysisId }, metadata: { duplicate: result.duplicate } });
    return json(result, 202);
  } catch (error) {
    await audit.failed();
    const code = error instanceof VideoAnalysisError ? error.code : 'ANALYSIS_UNAVAILABLE';
    return json({ error: code }, error instanceof VideoAnalysisError && error.permanent ? 409 : 503);
  }
}
