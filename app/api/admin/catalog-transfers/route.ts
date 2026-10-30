import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { queueTransfer, saveUpload, transferOverview, TransferError } from '@/lib/catalog-transfers/store';
import { sameOrigin, transferErrorResponse } from '@/lib/catalog-transfers/http';

export const runtime = 'nodejs';

export async function GET() {
  if (!await isCurrentUserAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try { return Response.json(await transferOverview(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return transferErrorResponse(error); }
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('catalog.export');
  if (!await isCurrentUserAdmin() || !sameOrigin(request)) { await audit.denied(); return Response.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const job = await queueTransfer({ operation: 'export' });
    await audit.succeeded({ target: { type: 'catalog_snapshot', id: job.id } });
    return Response.json({ job }, { status: 202 });
  } catch (error) { await audit.failed(); return transferErrorResponse(error); }
}

export async function PUT(request: Request) {
  const audit = adminMutationAudit.begin('catalog.import');
  if (!await isCurrentUserAdmin() || !sameOrigin(request)) { await audit.denied(); return Response.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const body = z.object({ uploadId: z.string().uuid(), confirmation: z.string().max(63) }).strict().safeParse(await request.json());
    if (!body.success) throw new TransferError('Bitte einen geprüften Snapshot und die Datenbankbestätigung angeben.');
    const job = await queueTransfer({ operation: 'import', ...body.data });
    await audit.succeeded({ target: { type: 'catalog_snapshot', id: job.id } });
    return Response.json({ job }, { status: 202 });
  } catch (error) { await audit.failed(); return transferErrorResponse(error); }
}

export async function PATCH(request: Request) {
  if (!await isCurrentUserAdmin() || !sameOrigin(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try { return Response.json(await saveUpload(request), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return transferErrorResponse(error); }
}
