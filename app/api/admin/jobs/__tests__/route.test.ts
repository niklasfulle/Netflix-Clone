/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/jobs/administration-runtime', () => ({
  backgroundJobAdministration: { list: jest.fn(), health: jest.fn() },
}));

import { currentUser } from '@/lib/auth';
import { InvalidJobListCursorError } from '@/lib/jobs/administration';
import { backgroundJobAdministration } from '@/lib/jobs/administration-runtime';
import { GET } from '../route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedList = backgroundJobAdministration.list as jest.MockedFunction<
  typeof backgroundJobAdministration.list
>;
const mockedHealth = backgroundJobAdministration.health as jest.MockedFunction<
  typeof backgroundJobAdministration.health
>;

beforeEach(() => {
  jest.resetAllMocks();
  mockedCurrentUser.mockResolvedValue({
    id: 'admin-user-123',
    role: 'ADMIN',
  } as Awaited<ReturnType<typeof currentUser>>);
});

it('returns a bounded filtered job page without caching it', async () => {
  mockedList.mockResolvedValue({ items: [], nextCursor: null });
  mockedHealth.mockResolvedValue({
    worker: {
      status: 'healthy',
      state: 'ACTIVE',
      startedAt: new Date('2026-08-25T09:00:00.000Z'),
      heartbeatAt: new Date('2026-08-25T10:00:00.000Z'),
      stoppedAt: null,
      heartbeatAgeMs: 0,
    },
    queue: { depth: 0, oldestQueuedAt: null, oldestQueuedAgeMs: null },
    counts: {
      QUEUED: 0,
      RUNNING: 0,
      SUCCEEDED: 0,
      FAILED: 0,
      CANCEL_REQUESTED: 0,
      CANCELLED: 0,
      DEAD_LETTER: 0,
    },
    observedAt: new Date('2026-08-25T10:00:00.000Z'),
  });

  const response = await GET(new Request(
    'http://localhost/api/admin/jobs?status=FAILED&jobType=media.integrity.scan&limit=20',
  ));

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  await expect(response.clone().json()).resolves.toMatchObject({
    items: [],
    health: { worker: { status: 'healthy' }, queue: { depth: 0 } },
  });
  expect(mockedList).toHaveBeenCalledWith(
    { userId: 'admin-user-123', role: 'ADMIN' },
    { status: 'FAILED', jobType: 'media.integrity.scan', cursor: undefined, limit: 20 },
  );
  expect(mockedHealth).toHaveBeenCalledWith({ userId: 'admin-user-123', role: 'ADMIN' });
});

it('rejects invalid filters before querying PostgreSQL', async () => {
  const response = await GET(new Request(
    'http://localhost/api/admin/jobs?status=NOT_A_JOB_STATUS&limit=500',
  ));

  expect(response.status).toBe(400);
  expect(mockedList).not.toHaveBeenCalled();
});

it('returns a client error for a malformed pagination cursor', async () => {
  mockedList.mockRejectedValue(new InvalidJobListCursorError());
  mockedHealth.mockResolvedValue({} as Awaited<ReturnType<typeof backgroundJobAdministration.health>>);

  const response = await GET(new Request('http://localhost/api/admin/jobs?cursor=broken'));

  expect(response.status).toBe(400);
});

it('rejects non-administrators', async () => {
  mockedCurrentUser.mockResolvedValue({
    id: 'regular-user-123',
    role: 'USER',
  } as Awaited<ReturnType<typeof currentUser>>);

  const response = await GET(new Request('http://localhost/api/admin/jobs'));

  expect(response.status).toBe(403);
  expect(mockedList).not.toHaveBeenCalled();
});
