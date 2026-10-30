import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { downloadTransfer } from '@/lib/catalog-transfers/store';
import { transferErrorResponse } from '@/lib/catalog-transfers/http';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  if (!await isCurrentUserAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const kind = new URL(request.url).searchParams.get('kind');
  if (kind !== null && kind !== 'backup') return Response.json({ error: 'Ungültiger Download.' }, { status: 400 });
  try { return await downloadTransfer((await context.params).jobId, kind === 'backup' ? 'backup' : 'snapshot'); }
  catch (error) { return transferErrorResponse(error); }
}
