import { randomUUID } from 'node:crypto';

import type { JobAcceptance } from '@/lib/jobs/submission';
import { parseWeeklyScheduleTick } from '@/lib/jobs/weekly-schedules';

type Dependencies = {
  resolveAdministrator(userId: string): Promise<{ id: string; role: string } | null>;
  submit(value: unknown): Promise<JobAcceptance>;
  createId?: () => string;
  now?: () => Date;
};

export class WeeklyScheduleActorError extends Error {
  constructor() {
    super('The weekly schedule owner is no longer an administrator');
    this.name = 'WeeklyScheduleActorError';
  }
}

export function createWeeklyScheduleTickHandler({
  resolveAdministrator,
  submit,
  createId = randomUUID,
  now = () => new Date(),
}: Dependencies) {
  return async function executeWeeklyScheduleTick(value: unknown, deliveryId: string) {
    const tick = parseWeeklyScheduleTick(value);
    const actor = await resolveAdministrator(tick.actorUserId);
    if (actor?.role !== 'ADMIN') throw new WeeklyScheduleActorError();

    const correlationId = createId();
    const requestId = createId();
    const idempotencyKey = `schedule-${deliveryId}`;
    if (tick.kind === 'MEDIA_HEALTH') {
      return submit({
        name: 'media.integrity.scan',
        version: 1,
        payload: { scope: 'catalog' },
        actor: { userId: actor.id, role: 'ADMIN' },
        target: { type: 'catalog', id: 'published' },
        idempotencyKey,
        correlationId,
      });
    }

    return submit({
      name: 'backup.creation.request',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: tick.environment,
        requestId,
        requestedAt: now().toISOString(),
      },
      actor: { userId: actor.id, role: 'ADMIN' },
      target: { type: 'backup', id: tick.environment },
      idempotencyKey,
      correlationId,
    });
  };
}
