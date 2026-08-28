/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/jobs/runtime', () => ({
  weeklyJobSchedules: { list: jest.fn(), update: jest.fn() },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { weeklyJobSchedules } from '@/lib/jobs/runtime';
import { GET, PUT } from '../route';

const mockedAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedList = weeklyJobSchedules.list as jest.MockedFunction<typeof weeklyJobSchedules.list>;
const mockedUpdate = weeklyJobSchedules.update as jest.MockedFunction<typeof weeklyJobSchedules.update>;
const mockedAuditBegin = adminMutationAudit.begin as jest.MockedFunction<typeof adminMutationAudit.begin>;

beforeEach(() => {
  jest.clearAllMocks();
});

it('returns both weekly schedules to an administrator', async () => {
  mockedAdmin.mockResolvedValue(true);
  mockedList.mockResolvedValue([
    { kind: 'BACKUP', enabled: true, weekdays: [1], time: '03:00', timezone: 'Europe/Berlin' },
    { kind: 'MEDIA_HEALTH', enabled: false, weekdays: [0], time: '04:00', timezone: 'UTC' },
  ]);

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ schedules: expect.any(Array) });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});

it('stores and audits a validated schedule for the deployment environment', async () => {
  const previousEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;
  process.env.DEPLOYMENT_ENVIRONMENT = 'staging';
  const audit = {
    correlationId: 'correlation-id-123',
    succeeded: jest.fn().mockResolvedValue(undefined),
    denied: jest.fn().mockResolvedValue(undefined),
    failed: jest.fn().mockResolvedValue(undefined),
  };
  mockedAuditBegin.mockReturnValue(audit);
  mockedCurrentUser.mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' } as never);
  const schedule = {
    kind: 'BACKUP' as const,
    enabled: true,
    weekdays: [1, 3, 5],
    time: '02:15',
    timezone: 'Europe/Berlin' as const,
  };
  mockedUpdate.mockResolvedValue(undefined);

  try {
    const response = await PUT(new Request('http://localhost/api/admin/jobs/schedules', {
      method: 'PUT',
      body: JSON.stringify(schedule),
    }));

    expect(response.status).toBe(200);
    expect(mockedUpdate).toHaveBeenCalledWith({
      configuration: schedule,
      actorUserId: 'admin-user-123',
      environment: 'staging',
    });
    expect(audit.succeeded).toHaveBeenCalledWith(expect.objectContaining({
      target: { type: 'background_job', id: 'weekly-schedule-backup' },
      metadata: expect.objectContaining({ kind: 'BACKUP', enabled: true }),
    }));
  } finally {
    if (previousEnvironment === undefined) delete process.env.DEPLOYMENT_ENVIRONMENT;
    else process.env.DEPLOYMENT_ENVIRONMENT = previousEnvironment;
  }
});

it('rejects malformed schedules before touching the queue', async () => {
  const audit = {
    correlationId: 'correlation-id-123',
    succeeded: jest.fn(),
    denied: jest.fn(),
    failed: jest.fn().mockResolvedValue(undefined),
  };
  mockedAuditBegin.mockReturnValue(audit);
  mockedCurrentUser.mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' } as never);

  const response = await PUT(new Request('http://localhost/api/admin/jobs/schedules', {
    method: 'PUT',
    body: JSON.stringify({ kind: 'BACKUP', enabled: true, weekdays: [], time: '99:00', timezone: 'local' }),
  }));

  expect(response.status).toBe(400);
  expect(mockedUpdate).not.toHaveBeenCalled();
});
