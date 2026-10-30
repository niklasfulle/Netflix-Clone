import { auth } from '@/auth';
import { readMaintenance } from '@/lib/maintenance-policy';

export const dynamic = 'force-dynamic';
export async function GET() {
  const [settings, session] = await Promise.all([readMaintenance(), auth()]);
  const user = session?.user;
  return Response.json({
    heading: settings.bannerEnabled ? settings.heading ?? '' : '',
    message: settings.bannerEnabled ? settings.message : '',
    expiresAt: settings.expiresAt,
    loginLocked: settings.loginLocked,
    logoutRequired: !!user && user.role !== 'ADMIN' && (settings.loginLocked || !!user.isRevoked),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
