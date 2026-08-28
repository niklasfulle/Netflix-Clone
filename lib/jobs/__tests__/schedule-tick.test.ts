/** @jest-environment node */

import {
  createWeeklyScheduleTickHandler,
  WeeklyScheduleActorError,
} from '@/lib/jobs/schedule-tick';

const baseTick = {
  schemaVersion: 1 as const,
  actorUserId: 'admin-user-123',
  environment: 'staging' as const,
  schedule: {
    kind: 'BACKUP' as const,
    weekdays: [1],
    time: '03:00',
    timezone: 'Europe/Berlin' as const,
  },
};

it('turns a backup schedule tick into a durable backup job', async () => {
  const submit = jest.fn().mockResolvedValue({ id: 'job-run-123' });
  const handler = createWeeklyScheduleTickHandler({
    resolveAdministrator: jest.fn().mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' }),
    submit,
    createId: jest.fn()
      .mockReturnValueOnce('correlation-id-123')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000'),
    now: () => new Date('2026-08-27T08:00:00.000Z'),
  });

  await handler({ ...baseTick, kind: 'BACKUP' }, '750e8400-e29b-41d4-a716-446655440000');

  expect(submit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'backup.creation.request',
    payload: expect.objectContaining({ environment: 'staging' }),
    idempotencyKey: 'schedule-750e8400-e29b-41d4-a716-446655440000',
  }));
});

it('does not execute schedules owned by a user who is no longer an administrator', async () => {
  const submit = jest.fn();
  const handler = createWeeklyScheduleTickHandler({
    resolveAdministrator: jest.fn().mockResolvedValue({ id: 'admin-user-123', role: 'USER' }),
    submit,
  });

  await expect(handler({ ...baseTick, kind: 'BACKUP' }, 'delivery-id-123'))
    .rejects.toBeInstanceOf(WeeklyScheduleActorError);
  expect(submit).not.toHaveBeenCalled();
});

it('turns a media schedule tick into a full catalog scan', async () => {
  const submit = jest.fn().mockResolvedValue({ id: 'job-run-456' });
  const handler = createWeeklyScheduleTickHandler({
    resolveAdministrator: jest.fn().mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' }),
    submit,
    createId: jest.fn().mockReturnValue('correlation-id-123'),
  });

  await handler({
    ...baseTick,
    kind: 'MEDIA_HEALTH',
    schedule: { ...baseTick.schedule, kind: 'MEDIA_HEALTH' },
  }, '850e8400-e29b-41d4-a716-446655440000');

  expect(submit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'media.integrity.scan',
    payload: { scope: 'catalog' },
    target: { type: 'catalog', id: 'published' },
  }));
});
