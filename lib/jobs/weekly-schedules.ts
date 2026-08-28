import { z } from 'zod';

import { JOB_NAMES } from '@/lib/jobs/contracts';

export const WEEKLY_SCHEDULE_KINDS = ['BACKUP', 'MEDIA_HEALTH'] as const;
export type WeeklyScheduleKind = typeof WEEKLY_SCHEDULE_KINDS[number];

const scheduleConfiguration = z.object({
  kind: z.enum(WEEKLY_SCHEDULE_KINDS),
  enabled: z.boolean(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7)
    .refine((days) => new Set(days).size === days.length, 'Weekdays must be unique'),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.enum(['Europe/Berlin', 'UTC']),
}).strict();

const scheduleTick = z.object({
  schemaVersion: z.literal(1),
  kind: z.enum(WEEKLY_SCHEDULE_KINDS),
  actorUserId: z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
  environment: z.enum(['staging', 'production']),
  schedule: scheduleConfiguration.omit({ enabled: true }),
}).strict().refine((value) => value.kind === value.schedule.kind, {
  message: 'Schedule tick kind does not match its configuration',
});

export type WeeklyScheduleConfiguration = z.infer<typeof scheduleConfiguration>;
export type WeeklyScheduleTick = z.infer<typeof scheduleTick>;

export type StoredSchedule = {
  data?: unknown;
};

export type WeeklyScheduleStore = {
  getSchedules(name?: string, key?: string): Promise<StoredSchedule[]>;
  schedule(
    name: string,
    cron: string,
    data: object,
    options: { tz: string; key: string },
  ): Promise<void>;
  unschedule(name: string, key?: string): Promise<void>;
};

const DEFAULT_SCHEDULES: Record<WeeklyScheduleKind, WeeklyScheduleConfiguration> = {
  BACKUP: {
    kind: 'BACKUP',
    enabled: false,
    weekdays: [0],
    time: '03:00',
    timezone: 'Europe/Berlin',
  },
  MEDIA_HEALTH: {
    kind: 'MEDIA_HEALTH',
    enabled: false,
    weekdays: [1],
    time: '04:00',
    timezone: 'Europe/Berlin',
  },
};

function scheduleKey(kind: WeeklyScheduleKind): string {
  return `admin-weekly-${kind.toLowerCase().replace('_', '-')}`;
}

function cronExpression(configuration: WeeklyScheduleConfiguration): string {
  const [hour, minute] = configuration.time.split(':').map(Number);
  const weekdays = [...configuration.weekdays].sort((left, right) => left - right).join(',');
  return `${minute} ${hour} * * ${weekdays}`;
}

function configurationFromStored(
  kind: WeeklyScheduleKind,
  schedules: StoredSchedule[],
): WeeklyScheduleConfiguration {
  const candidate = schedules[0]?.data;
  const parsed = scheduleTick.safeParse(candidate);
  if (!parsed.success || parsed.data.kind !== kind) return { ...DEFAULT_SCHEDULES[kind] };
  return { ...parsed.data.schedule, enabled: true };
}

export function parseWeeklyScheduleConfiguration(value: unknown): WeeklyScheduleConfiguration {
  return scheduleConfiguration.parse(value);
}

export function parseWeeklyScheduleTick(value: unknown): WeeklyScheduleTick {
  return scheduleTick.parse(value);
}

export function createWeeklyScheduleService(store: WeeklyScheduleStore) {
  return {
    async list(): Promise<WeeklyScheduleConfiguration[]> {
      return Promise.all(WEEKLY_SCHEDULE_KINDS.map(async (kind) => configurationFromStored(
        kind,
        await store.getSchedules(JOB_NAMES.weeklyScheduleTick, scheduleKey(kind)),
      )));
    },

    async update(input: {
      configuration: unknown;
      actorUserId: string;
      environment: 'staging' | 'production';
    }): Promise<void> {
      const configuration = parseWeeklyScheduleConfiguration(input.configuration);
      const key = scheduleKey(configuration.kind);
      if (!configuration.enabled) {
        await store.unschedule(JOB_NAMES.weeklyScheduleTick, key);
        return;
      }

      const tick = parseWeeklyScheduleTick({
        schemaVersion: 1,
        kind: configuration.kind,
        actorUserId: input.actorUserId,
        environment: input.environment,
        schedule: {
          kind: configuration.kind,
          weekdays: configuration.weekdays,
          time: configuration.time,
          timezone: configuration.timezone,
        },
      });
      await store.schedule(
        JOB_NAMES.weeklyScheduleTick,
        cronExpression(configuration),
        tick,
        { tz: configuration.timezone, key },
      );
    },
  };
}
