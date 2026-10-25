import { db } from '@/lib/db';
import { createFfprobe } from '@/lib/media-probe';
import { inspectAnalysisSource } from '@/lib/video-analysis/source';
import { VideoAnalysisError } from '@/lib/video-analysis/contracts';
import { exampleLabels, VideoExampleError, type ExampleInput } from './validation';

export async function videoExampleSource(movieId: string) {
  const movie = await db.movie.findUnique({ where: { id: movieId }, select: { id: true, title: true, type: true, videoUrl: true } });
  if (!movie) throw new VideoExampleError('VIDEO_NOT_FOUND', 404);
  try {
    const source = await inspectAnalysisSource(movie);
    const probe = await createFfprobe()(source.filePath, 15000);
    const durationSeconds = probe.durationSeconds ?? 0;
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86400 || !probe.streams.some(stream => stream.type === 'video')) throw new VideoExampleError('INVALID_VIDEO_DURATION');
    if ((await inspectAnalysisSource(movie)).fingerprint !== source.fingerprint) throw new VideoExampleError('VIDEO_CHANGED');
    return { movie: { id: movie.id, title: movie.title }, sourceFingerprint: source.fingerprint, durationSeconds };
  } catch (error) {
    if (error instanceof VideoExampleError) throw error;
    if (error instanceof VideoAnalysisError) throw new VideoExampleError(error.code);
    throw new VideoExampleError('VIDEO_UNAVAILABLE', 503);
  }
}

export async function readVideoExamples(movieId: string) {
  const source = await videoExampleSource(movieId);
  const examples = await db.videoExample.findMany({ where: { movieId }, orderBy: { startSeconds: 'asc' }, take: 500 });
  return { ...source, examples: examples.map(example => ({
    id: example.id, movieId, startSeconds: example.startSeconds, endSeconds: example.endSeconds,
    labels: exampleLabels.parse(example.labels), note: example.note, version: example.version,
    stale: example.sourceFingerprint !== source.sourceFingerprint,
  })) };
}

export async function saveVideoExample(input: ExampleInput, actorId: string) {
  const source = await videoExampleSource(input.movieId);
  if (input.sourceFingerprint !== source.sourceFingerprint) throw new VideoExampleError('VIDEO_CHANGED');
  if (input.endSeconds > source.durationSeconds) throw new VideoExampleError('INVALID_TIME_RANGE', 400);
  return db.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT id FROM "Movie" WHERE id = ${input.movieId} FOR UPDATE`;
    const movie = await transaction.movie.findUnique({ where: { id: input.movieId } });
    if (!movie || (await inspectAnalysisSource(movie)).fingerprint !== source.sourceFingerprint) throw new VideoExampleError('VIDEO_CHANGED');
    const previous = 'id' in input ? await transaction.videoExample.findUnique({ where: { id: input.id } }) : null;
    if ('id' in input && (!previous || previous.movieId !== input.movieId)) throw new VideoExampleError('EXAMPLE_NOT_FOUND', 404);
    if (previous && (previous.version !== ('version' in input ? input.version : 0) || previous.sourceFingerprint !== source.sourceFingerprint)) throw new VideoExampleError('EXAMPLE_CONFLICT');
    const categories = await transaction.category.findMany({ where: { id: { in: input.labels.map(label => label.categoryId) } }, select: { id: true, name: true, nameEn: true } });
    const oldLabels = previous ? exampleLabels.parse(previous.labels) : [];
    const labels = input.labels.map(label => {
      const category = categories.find(category => category.id === label.categoryId);
      const old = oldLabels.find(old => old.categoryId === label.categoryId);
      if (!category && !old) throw new VideoExampleError('INVALID_CATEGORY', 400);
      return { categoryId: label.categoryId, name: category?.name ?? old!.name, nameEn: category?.nameEn ?? old!.nameEn, verdict: label.verdict };
    }).sort((a, b) => a.categoryId.localeCompare(b.categoryId));
    const data = { startSeconds: input.startSeconds, endSeconds: input.endSeconds, labels, note: input.note, reviewerId: actorId };
    if ('id' in input) {
      const updated = await transaction.videoExample.updateMany({ where: { id: input.id, version: input.version }, data: { ...data, version: { increment: 1 } } });
      if (!updated.count) throw new VideoExampleError('EXAMPLE_CONFLICT');
      return { id: input.id, version: input.version + 1 };
    }
    const duplicate = await transaction.videoExample.findUnique({ where: { requestId: input.requestId } });
    if (duplicate) {
      const duplicateLabels = exampleLabels.parse(duplicate.labels).sort((a, b) => a.categoryId.localeCompare(b.categoryId));
      if (duplicate.movieId !== input.movieId || duplicate.sourceFingerprint !== input.sourceFingerprint || duplicate.startSeconds !== input.startSeconds || duplicate.endSeconds !== input.endSeconds || duplicate.note !== input.note || JSON.stringify(duplicateLabels) !== JSON.stringify(labels)) throw new VideoExampleError('EXAMPLE_CONFLICT');
      return { id: duplicate.id, version: duplicate.version };
    }
    if (await transaction.videoExample.count({ where: { movieId: input.movieId } }) >= 500) throw new VideoExampleError('EXAMPLE_LIMIT');
    const created = await transaction.videoExample.create({ data: { ...data, movieId: input.movieId, requestId: input.requestId, sourceFingerprint: source.sourceFingerprint } });
    return { id: created.id, version: created.version };
  });
}

export async function removeVideoExample(id: string, version: number) {
  const removed = await db.videoExample.deleteMany({ where: { id, version } });
  if (!removed.count) throw new VideoExampleError('EXAMPLE_CONFLICT');
}
