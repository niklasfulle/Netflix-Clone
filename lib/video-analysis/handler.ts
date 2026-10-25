import { db } from '@/lib/db';
import { createFfprobe } from '@/lib/media-probe';
import type { JobProgress } from '@/lib/jobs/contracts';
import { hasActiveUserBlock } from '@/lib/user-access';
import { aggregateCategorySuggestions, analysisSampleTimes, frameTagsSchema, VideoAnalysisError } from './contracts';
import { currentAnalysisProfileId } from './runtime-profile';
import { classifyVideoFrames, videoAnalysisEnabled } from './model';
import { analyzeVideoSegments } from './runner';
import { captureAnalysisFrame, inspectAnalysisSource } from './source';
import { samplingProfileSchema } from './sampling';

export async function runVideoAnalysis(payload: { analysisId: string; contentId: string }, context: {
  jobRunId: string;
  actorUserId: string;
  signal?: AbortSignal;
  assertLease(): Promise<void>;
  reportProgress(progress: JobProgress): Promise<void>;
}) {
  if (!videoAnalysisEnabled()) throw new VideoAnalysisError('ANALYSIS_DISABLED', true);
  const analysis = await db.videoAnalysis.findUnique({ where: { id: payload.analysisId }, include: { movie: true, samples: true } });
  if (!analysis || analysis.movieId !== payload.contentId || analysis.requestedById !== context.actorUserId) throw new VideoAnalysisError('ANALYSIS_NOT_FOUND', true);
  const controller = new AbortController();
  const signal = context.signal ? AbortSignal.any([context.signal, controller.signal]) : controller.signal;
  const checkpoint = async () => {
    signal.throwIfAborted();
    const [actor, job] = await Promise.all([
      db.user.findUnique({ where: { id: context.actorUserId }, select: { id: true, role: true, isBlocked: true, blockedUntil: true } }),
      db.jobRun.findUnique({ where: { id: context.jobRunId }, select: { status: true } }),
    ]);
    if (!job || ['CANCEL_REQUESTED', 'CANCELLED'].includes(job.status)) throw new VideoAnalysisError('ANALYSIS_CANCELLED', true);
    if (!actor || actor.role !== 'ADMIN' || await hasActiveUserBlock(actor)) throw new VideoAnalysisError('ADMIN_ACCESS_LOST', true);
    await context.assertLease();
  };
  const timer = setInterval(() => { void checkpoint().catch(error => controller.abort(error)); }, 2000);
  timer.unref();
  try {
    if (analysis.model !== currentAnalysisProfileId()) throw new VideoAnalysisError('ANALYSIS_PROFILE_CHANGED', true);
    const parsedSampling = samplingProfileSchema.safeParse(analysis.samplingProfile ?? 'standard-v1');
    if (!parsedSampling.success) throw new VideoAnalysisError('INVALID_SAMPLING_PROFILE', true);
    const samplingProfile = parsedSampling.data;
    await checkpoint();
    const source = await inspectAnalysisSource(analysis.movie);
    if (source.fingerprint !== analysis.sourceFingerprint) throw new VideoAnalysisError('VIDEO_CHANGED', true);
    const probe = await createFfprobe()(source.filePath, 15_000);
    const duration = probe.durationSeconds ?? 0;
    const times = analysisSampleTimes(duration, samplingProfile);
    const previous = analysis.samples.map(sample => ({ index: sample.index, atSeconds: sample.atSeconds, tags: frameTagsSchema.parse(sample.tags) }));
    const vocabulary = await db.category.findMany({ select: { id: true, name: true, nameEn: true }, orderBy: { name: 'asc' } });
    await db.videoAnalysis.update({ where: { id: analysis.id }, data: { jobRunId: context.jobRunId, status: 'RUNNING', errorCode: null, durationSeconds: duration, sampleCount: times.length, processedCount: previous.length } });
    const observations = await analyzeVideoSegments({
      duration, samplingProfile, previous, checkpoint,
      capture: seconds => captureAnalysisFrame(source.filePath, seconds, signal),
      classify: frames => classifyVideoFrames(frames, vocabulary.map(category => category.name), signal),
      async save(observation, processed) {
        await db.$transaction([
          db.videoAnalysisSample.upsert({ where: { analysisId_index: { analysisId: analysis.id, index: observation.index } },
            create: { analysisId: analysis.id, index: observation.index, atSeconds: observation.atSeconds, tags: observation.tags }, update: { tags: observation.tags } }),
          db.videoAnalysis.update({ where: { id: analysis.id }, data: { processedCount: processed } }),
        ]);
      },
      progress: (processed, total) => context.reportProgress({ percent: Math.round(5 + processed / total * 85), message: `Video segments analyzed: ${processed}/${total}` }),
    });
    const suggestions = aggregateCategorySuggestions(observations, vocabulary);
    await checkpoint();
    await db.$transaction(async transaction => {
      await transaction.$queryRaw`SELECT id FROM "Movie" WHERE id = ${analysis.movieId} FOR UPDATE`;
      const movie = await transaction.movie.findUnique({ where: { id: analysis.movieId } });
      if (!movie || (await inspectAnalysisSource(movie)).fingerprint !== source.fingerprint) throw new VideoAnalysisError('VIDEO_CHANGED', true);
      await transaction.videoCategorySuggestion.deleteMany({ where: { analysisId: analysis.id } });
      if (suggestions.length > 0) await transaction.videoCategorySuggestion.createMany({ data: suggestions.map(suggestion => ({ ...suggestion, analysisId: analysis.id })) });
      await transaction.videoAnalysis.update({ where: { id: analysis.id }, data: { status: 'SUCCEEDED', completedAt: new Date(), errorCode: null } });
    });
    return { analysisId: analysis.id, suggestionCount: suggestions.length, sampleCount: times.length, status: 'READY' as const };
  } catch (error) {
    const cause = signal.aborted ? signal.reason : error;
    const code = cause instanceof VideoAnalysisError ? cause.code : 'ANALYSIS_FAILED';
    await db.videoAnalysis.updateMany({ where: { id: analysis.id }, data: { status: code === 'ANALYSIS_CANCELLED' || context.signal?.aborted ? 'CANCELLED' : 'FAILED', errorCode: code } }).catch(() => undefined);
    if (cause instanceof VideoAnalysisError) throw cause;
    throw new VideoAnalysisError('ANALYSIS_FAILED');
  } finally { clearInterval(timer); }
}
