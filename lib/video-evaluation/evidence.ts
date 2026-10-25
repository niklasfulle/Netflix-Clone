import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { classificationDiagnosticsSchema } from '@/lib/video-analysis/diagnostics';
import { frameTagsSchema } from '@/lib/video-analysis/contracts';
import { exampleLabels } from '@/lib/video-examples/validation';
import { inspectionInput, diagnoseSample } from './inspection';

export class EvaluationEvidenceError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); this.name = 'EvaluationEvidenceError'; }
}
const frameSelect = { index: true, atSeconds: true, sha256: true } as const;
export async function readEvaluationEvidence(evaluationId: string, sampleId: string) {
  const sample = await db.videoEvaluationSample.findFirst({ where: { id: sampleId, evaluationId }, include: {
    evaluation: { select: { model: true, threshold: true } }, frames: { orderBy: { index: 'asc' }, select: frameSelect },
  } });
  if (!sample) throw new EvaluationEvidenceError('SAMPLE_NOT_FOUND', 404);
  if (sample.status !== 'COMPLETED' || sample.frames.length !== 3 || !sample.diagnostics || !sample.tags) throw new EvaluationEvidenceError('EVIDENCE_UNAVAILABLE');
  const diagnostics = classificationDiagnosticsSchema.parse(sample.diagnostics);
  const labels = exampleLabels.parse(sample.labels);
  const tags = frameTagsSchema.parse(sample.tags);
  const inspection = sample.inspection ? inspectionInput.omit({ version: true }).strip().parse(sample.inspection) : { judgments: [] };
  return { sampleId: sample.id, model: sample.evaluation.model, threshold: sample.evaluation.threshold, startSeconds: sample.startSeconds, endSeconds: sample.endSeconds,
    frames: sample.frames.map(frame => ({ ...frame, url: `/api/admin/video-evaluations/${encodeURIComponent(evaluationId)}/samples/${encodeURIComponent(sampleId)}/frames/${frame.index}` })),
    diagnostics, tags, labels, inspectionVersion: sample.inspectionVersion, inspection: inspection.judgments,
    outcomes: diagnoseSample(labels, tags, diagnostics, sample.evaluation.threshold, inspection.judgments) };
}
export async function readEvaluationFrame(evaluationId: string, sampleId: string, index: number) {
  const frame = await db.videoEvaluationFrame.findFirst({ where: { sampleId, index, sample: { evaluationId, status: 'COMPLETED' } }, select: { jpeg: true, sha256: true } });
  if (!frame) throw new EvaluationEvidenceError('FRAME_NOT_FOUND', 404);
  if (frame.jpeg.length < 4 || frame.jpeg.length > 1048576 || frame.jpeg[0] !== 0xff || frame.jpeg[1] !== 0xd8 || createHash('sha256').update(frame.jpeg).digest('hex') !== frame.sha256) throw new EvaluationEvidenceError('EVIDENCE_CORRUPT');
  return frame.jpeg;
}
export async function reviewEvaluationEvidence(evaluationId: string, sampleId: string, input: unknown, actorId: string) {
  const parsed = inspectionInput.safeParse(input);
  if (!parsed.success) throw new EvaluationEvidenceError('INVALID_INPUT', 400);
  const sample = await readEvaluationEvidence(evaluationId, sampleId);
  const ids = new Set(sample.labels.filter(label => label.verdict !== 'UNCERTAIN').map(label => label.categoryId));
  if (parsed.data.judgments.some(judgment => !ids.has(judgment.categoryId))) throw new EvaluationEvidenceError('INVALID_CATEGORY', 400);
  const updated = await db.videoEvaluationSample.updateMany({ where: { id: sampleId, evaluationId, inspectionVersion: parsed.data.version }, data: {
    inspection: { judgments: parsed.data.judgments, reviewerId: actorId, reviewedAt: new Date().toISOString() }, inspectionVersion: { increment: 1 },
  } });
  if (!updated.count) throw new EvaluationEvidenceError('INSPECTION_CONFLICT');
  return { version: parsed.data.version + 1, labelCount: parsed.data.judgments.length };
}
