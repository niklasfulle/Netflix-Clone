import { z } from 'zod';
import { frameTagsSchema } from './contracts';

const legacyDiagnostics = z.object({
  schemaVersion: z.literal(1), discovered: frameTagsSchema, matched: frameTagsSchema.nullable(),
  matchingVocabulary: z.array(z.string().min(1).max(80)).max(64), selectionLimit: z.literal(5),
}).strict();
const catalogDiagnostics = z.object({
  schemaVersion: z.literal(2),
  passes: z.array(z.object({ vocabulary: z.array(z.string().min(1).max(80)).max(32), result: frameTagsSchema }).strict()).max(128),
  matchingVocabulary: z.array(z.string().min(1).max(80)).max(1024), selectionLimit: z.literal(5),
}).strict();
export const classificationDiagnosticsSchema = z.discriminatedUnion('schemaVersion', [legacyDiagnostics, catalogDiagnostics]);
export type ClassificationDiagnostics = z.infer<typeof classificationDiagnosticsSchema>;
