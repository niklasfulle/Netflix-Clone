import { z } from 'zod';

const identifier = z.string().min(1).max(191).regex(/^[A-Za-z0-9_-]+$/);
export const categorizationQuery = z.object({ movieId: identifier.optional(), exclude: identifier.optional() }).strict();
export const categorySegmentInput = z.object({
  categoryId: identifier,
  startSeconds: z.number().min(0).max(604800),
  endSeconds: z.number().positive().max(604800),
}).strict().refine(value => value.endSeconds > value.startSeconds);
export const categorizationInput = z.object({
  movieId: identifier,
  version: z.number().int().nonnegative(),
  categoryIds: z.array(identifier).max(50).refine(ids => new Set(ids).size === ids.length),
  segments: z.array(categorySegmentInput).max(200).refine(segments => new Set(segments.map(segment => JSON.stringify(segment))).size === segments.length),
  complete: z.boolean(),
}).strict();
export type CategorizationInput = z.infer<typeof categorizationInput>;
