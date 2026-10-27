import { z } from 'zod';

export const recommendationSchema = z.object({
  id: z.string().min(1).max(191).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string(),
  thumbnailUrl: z.string().startsWith('/api/catalog/thumbnails/'),
  reason: z.enum(['same-actor', 'similar-categories', 'more-to-watch']),
}).strict();
export const recommendationsResponseSchema = z.object({ items: z.array(recommendationSchema).max(6) }).strict();
export type VideoRecommendation = z.infer<typeof recommendationSchema>;
