import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { CategorizationError, readCategorization, saveCategorization } from '@/lib/manual-categorization/service';
import { categorizationInput, categorizationQuery } from '@/lib/manual-categorization/validation';

export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
function failure(error: unknown) {
  if (error instanceof CategorizationError) {
    let status = 422;
    if (error.code === 'CONFLICT') status = 409;
    else if (error.code === 'NOT_FOUND') status = 404;
    return json({ error: error.code }, status);
  }
  return json({ error: 'SAVE_FAILED' }, 500);
}
export async function GET(request: Request) {
  if (!await isCurrentUserAdmin()) return json({ error: 'FORBIDDEN' }, 403);
  const query = categorizationQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return json({ error: 'INVALID_INPUT' }, 400);
  try { return json(await readCategorization(query.data)); } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('content.update');
  try {
    if (!await isCurrentUserAdmin()) { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
    let body: unknown;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 65536) {
        return json({ error: 'INVALID_INPUT' }, 413);
      }
      body = JSON.parse(text);
    }
    catch { return json({ error: 'INVALID_INPUT' }, 400); }
    const parsed = categorizationInput.safeParse(body);
    if (!parsed.success) return json({ error: 'INVALID_INPUT' }, 400);
    const result = await saveCategorization(parsed.data);
    await audit.succeeded({ target: { type: 'content', id: parsed.data.movieId }, metadata: { changedFields: ['categories', 'categorySegments', 'categoryReviewedAt'] } });
    return json(result);
  } catch (error) { await audit.failed(); return failure(error); }
}
