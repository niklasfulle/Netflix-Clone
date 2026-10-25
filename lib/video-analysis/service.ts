import { createHash, randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { JOB_NAMES } from '@/lib/jobs/contracts';
import { VideoAnalysisError } from './contracts';
import { currentAnalysisProfileId } from './runtime-profile';
import { analysisModelAvailable, videoAnalysisEnabled } from './model';
import { inspectAnalysisSource } from './source';

export async function submitVideoAnalysis(movieId: string, actorUserId: string, force = false) {
  if (!videoAnalysisEnabled()) throw new VideoAnalysisError('ANALYSIS_DISABLED', true);
  if (!await analysisModelAvailable()) throw new VideoAnalysisError('MODEL_UNAVAILABLE');
  const movie = await db.movie.findUnique({ where: { id: movieId }, select: { id: true, type: true, videoUrl: true } });
  if (!movie) throw new VideoAnalysisError('VIDEO_NOT_FOUND', true);
  const source = await inspectAnalysisSource(movie);
  const model = currentAnalysisProfileId();
  const cacheKey = createHash('sha256').update(JSON.stringify([movie.id, source.fingerprint, model, force ? randomUUID() : 'cached'])).digest('hex');
  const analysis = await db.videoAnalysis.upsert({ where: { cacheKey }, update: {}, create: {
    movieId, requestedById: actorUserId, cacheKey, sourceFingerprint: source.fingerprint, model,
  } });
  if (analysis.jobRunId || analysis.status === 'SUCCEEDED') return { analysisId: analysis.id, jobRunId: analysis.jobRunId, duplicate: true };
  try {
    const job = await backgroundJobSubmission.submit({
      name: JOB_NAMES.videoAnalysis, version: 1,
      payload: { analysisId: analysis.id, contentId: movie.id },
      actor: { userId: analysis.requestedById, role: 'ADMIN' },
      target: { type: 'content', id: movie.id }, idempotencyKey: analysis.id, correlationId: randomUUID(),
    });
    await db.videoAnalysis.update({ where: { id: analysis.id }, data: { jobRunId: job.id } });
    return { analysisId: analysis.id, jobRunId: job.id, duplicate: job.duplicate };
  } catch {
    await db.videoAnalysis.updateMany({ where: { id: analysis.id, jobRunId: null }, data: { status: 'FAILED', errorCode: 'QUEUE_UNAVAILABLE' } }).catch(() => undefined);
    throw new VideoAnalysisError('QUEUE_UNAVAILABLE');
  }
}

export async function reviewVideoSuggestions(analysisId: string, ids: string[], action: 'ACCEPT' | 'REJECT') {
  return db.$transaction(async transaction => {
    const analysis = await transaction.videoAnalysis.findUnique({ where: { id: analysisId }, include: { jobRun: { select: { status: true } } } });
    if (!analysis) throw new VideoAnalysisError('ANALYSIS_NOT_FOUND', true);
    if (analysis.status !== 'SUCCEEDED' || (analysis.jobRun && analysis.jobRun.status !== 'SUCCEEDED')) throw new VideoAnalysisError('ANALYSIS_NOT_READY', true);
    await transaction.$queryRaw`SELECT id FROM "Movie" WHERE id = ${analysis.movieId} FOR UPDATE`;
    const movie = await transaction.movie.findUnique({ where: { id: analysis.movieId } });
    if (!movie || (await inspectAnalysisSource(movie)).fingerprint !== analysis.sourceFingerprint) throw new VideoAnalysisError('VIDEO_CHANGED', true);
    const suggestions = await transaction.videoCategorySuggestion.findMany({ where: { analysisId, id: { in: [...new Set(ids)] } } });
    if (suggestions.length !== new Set(ids).size) throw new VideoAnalysisError('INVALID_SUGGESTIONS', true);
    let changed = 0;
    for (const suggestion of suggestions) {
      if (suggestion.state !== 'PENDING') continue;
      if (action === 'ACCEPT') {
        let category = suggestion.categoryId ? await transaction.category.findUnique({ where: { id: suggestion.categoryId } }) : null;
        if (!category && !suggestion.nameEn?.trim()) throw new VideoAnalysisError('MISSING_CATEGORY_TRANSLATION', true);
        category ??= await transaction.category.upsert({ where: { normalizedName: suggestion.normalizedName }, update: {}, create: { name: suggestion.name, nameEn: suggestion.nameEn, normalizedName: suggestion.normalizedName } });
        const linked = await transaction.movieCategory.findUnique({ where: { movieId_categoryId: { movieId: movie.id, categoryId: category.id } } });
        if (!linked && await transaction.movieCategory.count({ where: { movieId: movie.id } }) >= 50) throw new VideoAnalysisError('TOO_MANY_CATEGORIES', true);
        await transaction.movieCategory.upsert({ where: { movieId_categoryId: { movieId: movie.id, categoryId: category.id } }, update: {}, create: { movieId: movie.id, categoryId: category.id } });
        await transaction.videoCategorySuggestion.update({ where: { id: suggestion.id }, data: { state: 'ACCEPTED', categoryId: category.id } });
      } else {
        await transaction.videoCategorySuggestion.update({ where: { id: suggestion.id }, data: { state: 'REJECTED' } });
      }
      changed++;
    }
    return { changed, movieId: movie.id };
  });
}
