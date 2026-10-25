import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { JOB_NAMES } from '@/lib/jobs/contracts';
import { VideoAnalysisError, frameTagsSchema } from '@/lib/video-analysis/contracts';
import { currentAnalysisProfileId } from '@/lib/video-analysis/runtime-profile';
import { analysisModelAvailable, videoAnalysisEnabled } from '@/lib/video-analysis/model';
import { exampleLabels } from '@/lib/video-examples/validation';
import { MIN_CATEGORY_SCORE } from '@/lib/video-analysis/profile';
import { MAX_EVALUATION_SAMPLES, summarizeEvaluation, type EvaluationSample } from './metrics';

export async function submitVideoEvaluation(requestId: string, actorUserId: string) {
  if (!videoAnalysisEnabled()) throw new VideoAnalysisError('ANALYSIS_DISABLED', true);
  let evaluation = await db.videoEvaluation.findUnique({ where: { requestId } });
  if (evaluation && evaluation.requestedById !== actorUserId) throw new VideoAnalysisError('FORBIDDEN', true);
  if (!evaluation) {
    if (!await analysisModelAvailable()) throw new VideoAnalysisError('MODEL_UNAVAILABLE');
    evaluation = await db.$transaction(async transaction => {
      const examples = await transaction.videoExample.findMany({ orderBy: [{ movieId: 'asc' }, { startSeconds: 'asc' }, { id: 'asc' }], take: MAX_EVALUATION_SAMPLES + 1 });
      if (examples.length > MAX_EVALUATION_SAMPLES) throw new VideoAnalysisError('EVALUATION_LIMIT', true);
      const eligible = examples.map(example => ({ ...example, labels: exampleLabels.parse(example.labels) })).filter(example => example.labels.some(label => label.verdict !== 'UNCERTAIN'));
      if (!eligible.length) throw new VideoAnalysisError('NO_REVIEWED_EXAMPLES', true);
      const vocabulary = await transaction.category.findMany({ select: { id: true, name: true, nameEn: true }, orderBy: { name: 'asc' } });
      return transaction.videoEvaluation.upsert({ where: { requestId }, update: {}, create: {
        requestId, requestedById: actorUserId, model: currentAnalysisProfileId(), vocabulary, threshold: MIN_CATEGORY_SCORE,
        samples: { create: eligible.map(example => ({ exampleId: example.id, exampleVersion: example.version, movieId: example.movieId,
          sourceFingerprint: example.sourceFingerprint, startSeconds: example.startSeconds, endSeconds: example.endSeconds, labels: example.labels })) },
      } });
    }, { isolationLevel: 'RepeatableRead' });
  }
  if (evaluation.requestedById !== actorUserId) throw new VideoAnalysisError('FORBIDDEN', true);
  if (evaluation.jobRunId || evaluation.status === 'SUCCEEDED') return { evaluationId: evaluation.id, jobRunId: evaluation.jobRunId, duplicate: true };
  try {
    const job = await backgroundJobSubmission.submit({ name: JOB_NAMES.videoEvaluation, version: 1, payload: { evaluationId: evaluation.id },
      actor: { userId: actorUserId, role: 'ADMIN' }, target: { type: 'video_evaluation', id: evaluation.id }, idempotencyKey: evaluation.id, correlationId: randomUUID() });
    await db.videoEvaluation.update({ where: { id: evaluation.id }, data: { jobRunId: job.id } });
    return { evaluationId: evaluation.id, jobRunId: job.id, duplicate: job.duplicate };
  } catch {
    await db.videoEvaluation.updateMany({ where: { id: evaluation.id, jobRunId: null }, data: { status: 'FAILED', errorCode: 'QUEUE_UNAVAILABLE' } });
    throw new VideoAnalysisError('QUEUE_UNAVAILABLE');
  }
}

export async function readVideoEvaluations(selectedId?: string) {
  const [runs, exampleCount, movies, available] = await Promise.all([
    db.videoEvaluation.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { jobRun: { select: { id: true, status: true, progress: true } }, samples: { orderBy: [{ movieId: 'asc' }, { startSeconds: 'asc' }], include: { _count: { select: { frames: true } } } } } }),
    db.videoExample.count(), db.videoExample.groupBy({ by: ['movieId'] }), analysisModelAvailable(),
  ]);
  const selected = runs.find(run => run.id === selectedId) ?? runs[0];
  const titles = new Map((await db.movie.findMany({ where: { id: { in: [...new Set(selected?.samples.map(sample => sample.movieId) ?? [])] } }, select: { id: true, title: true } })).map(movie => [movie.id, movie.title]));
  return { exampleCount, videoCount: movies.length, available, runs: runs.map(run => {
    const samples: EvaluationSample[] = run.samples.map(sample => ({ id: sample.id, movieId: sample.movieId, movieTitle: titles.get(sample.movieId), exampleId: sample.exampleId, exampleVersion: sample.exampleVersion,
      startSeconds: sample.startSeconds, endSeconds: sample.endSeconds, labels: exampleLabels.parse(sample.labels), status: sample.status, tags: sample.tags ? frameTagsSchema.parse(sample.tags) : null, hasEvidence: sample._count.frames === 3 && sample.diagnostics !== null }));
    return { id: run.id, model: run.model, status: run.status, errorCode: run.errorCode, createdAt: run.createdAt.toISOString(), completedAt: run.completedAt?.toISOString() ?? null,
      jobRun: run.jobRun, threshold: run.threshold, sampleCount: samples.length, samples: run.id === selected?.id ? samples : [], summary: summarizeEvaluation(samples, run.threshold), videoCount: new Set(samples.map(sample => sample.movieId)).size };
  }) };
}
