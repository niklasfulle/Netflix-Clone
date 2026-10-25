import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import type { JobProgress } from '@/lib/jobs/contracts';
import { hasActiveUserBlock } from '@/lib/user-access';
import { VideoAnalysisError } from '@/lib/video-analysis/contracts';
import { classifyVideoFramesWithDiagnostics, videoAnalysisEnabled } from '@/lib/video-analysis/model';
import { currentAnalysisProfileId } from '@/lib/video-analysis/runtime-profile';
import { inspectAnalysisSource, captureAnalysisFrame } from '@/lib/video-analysis/source';
import { createFfprobe } from '@/lib/media-probe';
import { samplePositions } from './metrics';

export async function runVideoEvaluation(payload: { evaluationId: string }, context: {
  jobRunId: string; actorUserId: string; signal?: AbortSignal;
  assertLease(): Promise<void>; reportProgress(progress: JobProgress): Promise<void>;
}) {
  if (!videoAnalysisEnabled()) throw new VideoAnalysisError('ANALYSIS_DISABLED', true);
  const run = await db.videoEvaluation.findUnique({ where: { id: payload.evaluationId }, include: { samples: { orderBy: [{ movieId: 'asc' }, { startSeconds: 'asc' }] } } });
  if (!run || run.requestedById !== context.actorUserId) throw new VideoAnalysisError('EVALUATION_NOT_FOUND', true);
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
  const timer = setInterval(() => { void checkpoint().catch(error => controller.abort(error)); }, 2000); timer.unref();
  try {
    if (run.model !== currentAnalysisProfileId()) throw new VideoAnalysisError('ANALYSIS_PROFILE_CHANGED', true);
    await checkpoint();
    const vocabulary = z.array(z.object({ id: z.string(), name: z.string(), nameEn: z.string() })).parse(run.vocabulary);
    await db.videoEvaluation.update({ where: { id: run.id }, data: { jobRunId: context.jobRunId, status: 'RUNNING', errorCode: null } });
    let processed = run.samples.filter(sample => sample.status !== 'PENDING').length;
    let skipped = run.samples.filter(sample => ['STALE', 'UNAVAILABLE'].includes(sample.status)).length;
    const progress = () => context.reportProgress({ percent: Math.round(processed / run.samples.length * 95), message: `Reviewed segments compared: ${processed}/${run.samples.length}` });
    await progress();
    for (const sample of run.samples) {
      await checkpoint();
      if (sample.status !== 'PENDING') continue;
      const movie = await db.movie.findUnique({ where: { id: sample.movieId }, select: { type: true, videoUrl: true } });
      let source: Awaited<ReturnType<typeof inspectAnalysisSource>> | null = null;
      if (movie) source = await inspectAnalysisSource(movie).catch(() => null);
      let status = !source ? 'UNAVAILABLE' : source.fingerprint !== sample.sourceFingerprint ? 'STALE' : 'COMPLETED';
      let tags;
      let diagnostics;
      let evidence: { index: number; atSeconds: number; sha256: string; jpeg: Buffer }[] = [];
      if (status === 'COMPLETED' && source) {
        const probe = await createFfprobe()(source.filePath, 15_000);
        if (!probe.durationSeconds || sample.endSeconds > probe.durationSeconds) status = 'STALE';
        else {
          const frames: Buffer[] = [];
          for (const [index, position] of samplePositions(sample.startSeconds, sample.endSeconds).entries()) {
            await checkpoint();
            const frame = await captureAnalysisFrame(source.filePath, position, signal);
            frames.push(frame);
            evidence.push({ index, atSeconds: Number(position.toFixed(3)), sha256: createHash('sha256').update(frame).digest('hex'), jpeg: frame });
          }
          ({ tags, diagnostics } = await classifyVideoFramesWithDiagnostics(frames, vocabulary, signal));
          const current = await db.movie.findUnique({ where: { id: sample.movieId }, select: { type: true, videoUrl: true } });
          if (!current || (await inspectAnalysisSource(current)).fingerprint !== sample.sourceFingerprint) { status = 'STALE'; tags = undefined; diagnostics = undefined; evidence = []; }
        }
      }
      await checkpoint();
      await db.videoEvaluationSample.update({ where: { id: sample.id }, data: { status, ...(tags && { tags, diagnostics, frames: { deleteMany: {}, create: evidence } }) } });
      processed++; if (status !== 'COMPLETED') skipped++;
      await progress();
    }
    await checkpoint();
    await db.videoEvaluation.update({ where: { id: run.id }, data: { status: 'SUCCEEDED', completedAt: new Date(), errorCode: null } });
    return { evaluationId: run.id, processedCount: processed, skippedCount: skipped, status: 'EVALUATED' as const };
  } catch (error) {
    const cause = signal.aborted ? signal.reason : error;
    const code = cause instanceof VideoAnalysisError ? cause.code : 'ANALYSIS_FAILED';
    await db.videoEvaluation.updateMany({ where: { id: run.id }, data: { status: code === 'ANALYSIS_CANCELLED' || context.signal?.aborted ? 'CANCELLED' : 'FAILED', errorCode: code } }).catch(() => undefined);
    if (cause instanceof VideoAnalysisError) throw cause;
    throw new VideoAnalysisError('ANALYSIS_FAILED');
  } finally { clearInterval(timer); }
}
