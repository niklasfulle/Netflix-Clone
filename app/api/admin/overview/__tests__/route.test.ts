/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: {} }));
jest.mock('@/lib/administration/admin-summary-runtime', () => ({
  ADMIN_SUMMARY_MAX_BYTES: 48 * 1024,
  adminOverviewCacheIdentity: {
    namespace: 'admin-overview',
    version: 1,
    identities: ['global'],
  },
  adminSummaryCache: { read: jest.fn() },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminSummaryCache } from '@/lib/administration/admin-summary-runtime';
import { GET } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedRead = adminSummaryCache.read as jest.MockedFunction<typeof adminSummaryCache.read>;

const summary = {
  counts: {
    users: 2,
    blockedUsers: 0,
    newUsers: 1,
    actors: 7,
    movies: 5,
    series: 2,
    newContent: 3,
    views: 6,
    activeProfiles: 2,
    errors24h: 0,
  },
  topContent: [],
  recentContent: [],
  recentActivity: [],
};

describe('cached administrator overview API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('authorizes before accessing the shared cache', async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockedRead).not.toHaveBeenCalled();
  });

  it('returns cache and timing telemetry only to administrators', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedRead.mockResolvedValue({
      value: summary,
      source: 'hit',
      cacheReadMs: 2,
      loadMs: 0,
      stored: true,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('x-admin-cache')).toBe('hit');
    expect(response.headers.get('server-timing')).toBe('redis;dur=2, postgres;dur=0');
    expect(await response.json()).toEqual(summary);
    expect(mockedRead).toHaveBeenCalledWith(expect.objectContaining({
      namespace: 'admin-overview',
      version: 1,
      identities: ['global'],
      ttlSeconds: 30,
      maxValueBytes: 48 * 1024,
    }));
  });
});
