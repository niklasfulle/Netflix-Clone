import { db } from '@/lib/db';

export type MaintenanceSettings = { heading?: string; bannerEnabled: boolean; message: string; expiresAt: Date | null; loginLocked: boolean };
export const DEFAULT_MAINTENANCE: MaintenanceSettings = { heading: '', bannerEnabled: false, message: '', expiresAt: null, loginLocked: false };

export function activeMaintenance(settings: MaintenanceSettings, now = new Date()) {
  const active = !!settings.expiresAt && settings.expiresAt.getTime() > now.getTime();
  return { ...settings, bannerEnabled: active && settings.bannerEnabled, loginLocked: active && settings.loginLocked };
}

export function parseMaintenance(value: unknown): MaintenanceSettings {
  if (!value || typeof value !== 'object') throw new Error('Ungültige Einstellungen.');
  const body = value as Record<string, unknown>;
  if (body.heading !== undefined && (typeof body.heading !== 'string' || body.heading.length > 120)) throw new Error('Die Überschrift darf höchstens 120 Zeichen enthalten.');
  if (typeof body.bannerEnabled !== 'boolean' || typeof body.loginLocked !== 'boolean'
    || typeof body.message !== 'string' || body.message.length > 500) throw new Error('Bitte gültige Einstellungen und höchstens 500 Zeichen angeben.');
  const expiresAt = typeof body.expiresAt === 'string' ? new Date(body.expiresAt) : null;
  if ((body.bannerEnabled || body.loginLocked) && (!expiresAt || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) throw new Error('Bitte eine zukünftige Endzeit auswählen.');
  if (body.bannerEnabled && !body.message.trim()) throw new Error('Bitte einen Bannertext eingeben.');
  return { heading: typeof body.heading === 'string' ? body.heading.trim() : undefined, bannerEnabled: body.bannerEnabled, loginLocked: body.loginLocked, message: body.message.trim(), expiresAt: expiresAt && Number.isFinite(expiresAt.getTime()) ? expiresAt : null };
}

export async function readMaintenance() {
  return activeMaintenance(await db.maintenancePolicy.findUnique({ where: { id: 'global' } }) ?? DEFAULT_MAINTENANCE);
}

export async function maintenanceBlocksRole(role: string) {
  return role !== 'ADMIN' && (await readMaintenance()).loginLocked;
}

export async function saveMaintenance(settings: MaintenanceSettings) {
  return db.$transaction(async tx => {
    const policy = await tx.maintenancePolicy.upsert({ where: { id: 'global' }, create: { id: 'global', ...settings }, update: settings });
    if (settings.loginLocked) {
      const now = new Date();
      await tx.user.updateMany({ where: { role: { not: 'ADMIN' } }, data: { sessionsInvalidBefore: now } });
      await tx.authSession.updateMany({ where: { user: { role: { not: 'ADMIN' } }, revokedAt: null }, data: { revokedAt: now } });
    }
    return activeMaintenance(policy);
  });
}
