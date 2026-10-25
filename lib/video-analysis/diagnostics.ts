import { z } from 'zod';
import { frameTagsSchema } from './contracts';

export const classificationDiagnosticsSchema = z.object({
  schemaVersion: z.literal(1), discovered: frameTagsSchema, matched: frameTagsSchema.nullable(),
  matchingVocabulary: z.array(z.string().min(1).max(80)).max(64), selectionLimit: z.literal(5),
}).strict();
export type ClassificationDiagnostics = z.infer<typeof classificationDiagnosticsSchema>;
