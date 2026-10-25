import { z } from 'zod';

const id = z.string().min(1).max(191);
const label = z.object({ categoryId: id, verdict: z.enum(['PRESENT', 'ABSENT', 'UNCERTAIN']) }).strict();
export const exampleLabels = z.array(z.object({ categoryId: id, name: z.string().min(1).max(80), nameEn: z.string().max(80), verdict: z.enum(['PRESENT', 'ABSENT', 'UNCERTAIN']) }).strict()).min(1).max(50);
const fields = {
  movieId: id, sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  startSeconds: z.number().finite().min(0).max(86400), endSeconds: z.number().finite().min(0).max(86400),
  labels: z.array(label).min(1).max(50).refine(labels => new Set(labels.map(value => value.categoryId)).size === labels.length),
  note: z.string().trim().max(500).default(''),
};
const validRange = (value: { startSeconds: number; endSeconds: number }) => value.startSeconds < value.endSeconds;
export const createVideoExample = z.object({ ...fields, requestId: z.uuid() }).strict().refine(validRange);
export const updateVideoExample = z.object({ ...fields, id, version: z.number().int().min(1) }).strict().refine(validRange);
export const deleteVideoExample = z.object({ id, version: z.number().int().min(1) }).strict();
export type ExampleInput = z.infer<typeof createVideoExample> | z.infer<typeof updateVideoExample>;

export class VideoExampleError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); this.name = 'VideoExampleError'; }
}
