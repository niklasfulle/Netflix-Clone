/** @jest-environment node */

import { createWeeklyScheduleService, parseWeeklyScheduleTick } from '@/lib/jobs/weekly-schedules';

describe('weekly background job schedules', () => {
  it('rejects queue deliveries whose job kind disagrees with their schedule configuration', () => {
    expect(() => parseWeeklyScheduleTick({ schemaVersion: 1, kind: 'BACKUP', actorUserId: 'admin-user-123', environment: 'staging', schedule: { kind: 'MEDIA_HEALTH', weekdays: [1], time: '03:00', timezone: 'UTC' } })).toThrow('Schedule tick kind does not match its configuration');
  });
  it('restores a valid stored schedule only for its matching schedule kind', async () => {
    const service = createWeeklyScheduleService({
      getSchedules: jest.fn().mockResolvedValue([{ data: { schemaVersion: 1, kind: 'BACKUP', actorUserId: 'admin-user-123', environment: 'staging', schedule: { kind: 'BACKUP', weekdays: [1], time: '03:00', timezone: 'Europe/Berlin' } } }]),
      schedule: jest.fn(), unschedule: jest.fn(),
    });
    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ kind: 'BACKUP', enabled: true, weekdays: [1], time: '03:00' }),
      expect.objectContaining({ kind: 'MEDIA_HEALTH', enabled: false, time: '04:00' }),
    ]);
  });
  it('returns safe disabled defaults when no schedule exists', async () => {
    const service = createWeeklyScheduleService({
      getSchedules: jest.fn().mockResolvedValue([]),
      schedule: jest.fn(),
      unschedule: jest.fn(),
    });

    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ kind: 'BACKUP', enabled: false, time: '03:00' }),
      expect.objectContaining({ kind: 'MEDIA_HEALTH', enabled: false, time: '04:00' }),
    ]);
  });

  it('stores an enabled multi-day schedule with a deterministic cron expression', async () => {
    const store = {
      getSchedules: jest.fn().mockResolvedValue([]),
      schedule: jest.fn().mockResolvedValue(undefined),
      unschedule: jest.fn(),
    };
    const service = createWeeklyScheduleService(store);

    await service.update({
      configuration: {
        kind: 'BACKUP',
        enabled: true,
        weekdays: [5, 1, 3],
        time: '02:15',
        timezone: 'Europe/Berlin',
      },
      actorUserId: 'admin-user-123',
      environment: 'staging',
    });

    expect(store.schedule).toHaveBeenCalledWith(
      'weekly.schedule.tick',
      '15 2 * * 1,3,5',
      expect.objectContaining({
        schemaVersion: 1,
        kind: 'BACKUP',
        actorUserId: 'admin-user-123',
        environment: 'staging',
      }),
      { tz: 'Europe/Berlin', key: 'admin-weekly-backup' },
    );
  });

  it('removes a disabled schedule without deleting other schedule kinds', async () => {
    const store = {
      getSchedules: jest.fn().mockResolvedValue([]),
      schedule: jest.fn(),
      unschedule: jest.fn().mockResolvedValue(undefined),
    };
    const service = createWeeklyScheduleService(store);

    await service.update({
      configuration: {
        kind: 'MEDIA_HEALTH',
        enabled: false,
        weekdays: [0],
        time: '04:00',
        timezone: 'UTC',
      },
      actorUserId: 'admin-user-123',
      environment: 'production',
    });

    expect(store.unschedule).toHaveBeenCalledWith(
      'weekly.schedule.tick',
      'admin-weekly-media-health',
    );
    expect(store.schedule).not.toHaveBeenCalled();
  });
});
