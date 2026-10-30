/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: {
  maintenancePolicy: { findUnique: jest.fn(), upsert: jest.fn() },
  user: { updateMany: jest.fn() }, authSession: { updateMany: jest.fn() }, $transaction: jest.fn(),
} }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: () => ({ denied: jest.fn(), failed: jest.fn(), succeeded: jest.fn() }) } }));
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { activeMaintenance, parseMaintenance, maintenanceBlocksRole, saveMaintenance } from '../maintenance-policy';
import { PATCH } from '@/app/api/admin/maintenance/route';

const settings = { bannerEnabled: true, message: 'Wartung am Abend', loginLocked: true, expiresAt: new Date(Date.now() + 3600000) };
describe('maintenance security policy', () => {
  it('accepts a custom heading and text while preserving compatibility with older clients', () => {
    expect(parseMaintenance({ ...settings, heading: '  Geplante Wartung  ', expiresAt: settings.expiresAt.toISOString() })).toMatchObject({ heading: 'Geplante Wartung', message: settings.message });
    expect(parseMaintenance({ ...settings, expiresAt: settings.expiresAt.toISOString() }).heading).toBeUndefined();
    expect(() => parseMaintenance({ ...settings, heading: 'x'.repeat(121), expiresAt: settings.expiresAt.toISOString() })).toThrow();
    expect(() => parseMaintenance({ ...settings, heading: 123, expiresAt: settings.expiresAt.toISOString() })).toThrow();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(db.maintenancePolicy.findUnique).mockResolvedValue(settings as never);
    jest.mocked(db.maintenancePolicy.upsert).mockResolvedValue(settings as never);
    jest.mocked(db.$transaction).mockImplementation((async (work: (tx: typeof db) => unknown) => work(db)) as never);
  });
  it('blocks normal users but never locks administrators out', async () => {
    expect(await maintenanceBlocksRole('USER')).toBe(true);
    expect(await maintenanceBlocksRole('ADMIN')).toBe(false);
  });
  it('expires both the banner and login lock at the specified boundary', () => {
    expect(activeMaintenance(settings, settings.expiresAt)).toMatchObject({ bannerEnabled: false, loginLocked: false });
  });
  it('revokes only non-admin sessions and invalidates older tokens in one transaction', async () => {
    await saveMaintenance(settings);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.user.updateMany).toHaveBeenCalledWith({ where: { role: { not: 'ADMIN' } }, data: { sessionsInvalidBefore: expect.any(Date) } });
    expect(db.authSession.updateMany).toHaveBeenCalledWith({ where: { user: { role: { not: 'ADMIN' } }, revokedAt: null }, data: { revokedAt: expect.any(Date) } });
  });
  it('does not revoke sessions for a banner-only announcement', async () => {
    await saveMaintenance({ ...settings, loginLocked: false });
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(db.authSession.updateMany).not.toHaveBeenCalled();
  });
  it.each([null, {}, { bannerEnabled: true, message: '', loginLocked: false, expiresAt: settings.expiresAt.toISOString() }, { ...settings, expiresAt: '2000-01-01' }, { ...settings, message: 'x'.repeat(501), expiresAt: settings.expiresAt.toISOString() }])('rejects invalid settings', input => {
    expect(() => parseMaintenance(input)).toThrow();
  });
  it('requires an administrator before persisting settings or revoking sessions', async () => {
    jest.mocked(currentUser).mockResolvedValue({ role: 'USER' } as never);
    const response = await PATCH(new Request('http://localhost/api/admin/maintenance', { method: 'PATCH', body: JSON.stringify(settings) }));
    expect(response.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a foreign Origin even for an administrator', async () => {
    jest.mocked(currentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    const response = await PATCH(new Request('http://localhost/api/admin/maintenance', { method: 'PATCH', headers: { Origin: 'https://other.test' }, body: JSON.stringify(settings) }));
    expect(response.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('accepts the configured staging origin behind the reverse proxy', async () => {
    const previous = process.env.AUTH_PUBLIC_URL;
    process.env.AUTH_PUBLIC_URL = 'http://netflix-staging';
    jest.mocked(currentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    try {
      const response = await PATCH(new Request('http://0.0.0.0:3000/api/admin/maintenance', {
        method: 'PATCH', headers: { Origin: 'http://netflix-staging' }, body: JSON.stringify(settings),
      }));
      expect(response.status).toBe(200);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    } finally {
      if (previous === undefined) delete process.env.AUTH_PUBLIC_URL;
      else process.env.AUTH_PUBLIC_URL = previous;
    }
  });
  it('does not trust forwarded host headers to authorize a foreign origin', async () => {
    const previous = process.env.AUTH_PUBLIC_URL;
    process.env.AUTH_PUBLIC_URL = 'http://netflix-staging';
    jest.mocked(currentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    try {
      const response = await PATCH(new Request('http://0.0.0.0:3000/api/admin/maintenance', {
        method: 'PATCH', headers: { Origin: 'https://other.test', 'X-Forwarded-Host': 'other.test' }, body: JSON.stringify(settings),
      }));
      expect(response.status).toBe(403);
      expect(db.$transaction).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.AUTH_PUBLIC_URL;
      else process.env.AUTH_PUBLIC_URL = previous;
    }
  });
});
