import { Prisma } from '@prisma/client';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { CategoryImportSchema, MAX_CATEGORY_IMPORT_BYTES } from '@/lib/category-transfer';
import { importCategories } from '@/lib/category-import';

export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
class ImportBodyLimitError extends Error {}
async function boundedBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_CATEGORY_IMPORT_BYTES) throw new ImportBodyLimitError();
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_CATEGORY_IMPORT_BYTES) throw new ImportBodyLimitError();
      chunks.push(result.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => undefined); }
}
export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('category.import');
  if (!await isCurrentUserAdmin()) { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  try {
    const parsed = CategoryImportSchema.safeParse(await boundedBody(request));
    if (!parsed.success) { await audit.failed(); return json({ error: parsed.error.issues.some(issue => issue.message === 'DUPLICATE_NAMES') ? 'DUPLICATE_CATEGORY_NAMES' : 'INVALID_CATEGORY_IMPORT' }, 400); }
    const result = await importCategories(parsed.data);
    await audit.succeeded({ target: { type: 'category', id: 'import' }, metadata: { createdCount: result.created, updatedCount: result.updated, unchangedCount: result.unchanged } });
    return json(result);
  } catch (error) {
    await audit.failed();
    if (error instanceof ImportBodyLimitError) return json({ error: 'CATEGORY_IMPORT_TOO_LARGE' }, 413);
    if (error instanceof SyntaxError) return json({ error: 'INVALID_CATEGORY_IMPORT' }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) return json({ error: 'CATEGORY_IMPORT_CONFLICT' }, 409);
    return json({ error: 'CATEGORY_IMPORT_UNAVAILABLE' }, 503);
  }
}
