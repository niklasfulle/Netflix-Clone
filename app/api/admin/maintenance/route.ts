import { currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { parseMaintenance, readMaintenance, saveMaintenance } from '@/lib/maintenance-policy';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  if ((await currentUser())?.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  return Response.json(await readMaintenance(), { headers });
}
export async function PATCH(request: Request) {
  const audit = adminMutationAudit.begin('deployment.manage');
  if ((await currentUser())?.role !== 'ADMIN') {
    await audit.denied();
    return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  }
  const origin = request.headers.get('origin');
  const publicUrl = process.env.AUTH_PUBLIC_URL?.trim()
    || process.env.AUTH_URL?.trim()
    || process.env.NEXTAUTH_URL?.trim()
    || request.url;
  let expectedOrigin: string;
  try { expectedOrigin = new URL(publicUrl).origin; }
  catch {
    await audit.failed();
    return Response.json({ error: 'Die öffentliche Anwendungsadresse ist nicht korrekt konfiguriert.' }, { status: 503, headers });
  }
  if (origin && origin !== expectedOrigin) {
    await audit.denied();
    return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  }
  let settings;
  try { settings = parseMaintenance(await request.json()); }
  catch (error) {
    await audit.failed();
    return Response.json({ error: error instanceof Error ? error.message : 'Ungültige Einstellungen.' }, { status: 400, headers });
  }
  try {
    const result = await saveMaintenance(settings);
    await audit.succeeded({ target: { type: 'deployment', id: 'maintenance-policy' }, metadata: { environment: process.env.DEPLOYMENT_ENVIRONMENT ?? 'development', operation: settings.loginLocked ? 'maintenance_enabled' : 'maintenance_updated' } });
    return Response.json(result, { headers });
  } catch {
    await audit.failed();
    return Response.json({ error: 'Wartungseinstellungen konnten nicht gespeichert werden.' }, { status: 503, headers });
  }
}
