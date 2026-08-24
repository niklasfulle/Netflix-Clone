/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: {} }));
jest.mock('@/lib/administration/admin-summary-runtime', () => ({
  ADMIN_ANALYTICS_DAYS: [7, 30, 90, 365],
  ADMIN_SUMMARY_MAX_BYTES: 48 * 1024,
  adminAnalyticsCacheIdentity: (days: number) => ({
    namespace: 'admin-analytics',
    version: 1,
    identities: [`days:${days}`],
  }),
  adminSummaryCache: { read: jest.fn() },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminSummaryCache } from '@/lib/administration/admin-summary-runtime';
import { GET } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedRead = adminSummaryCache.read as jest.MockedFunction<typeof adminSummaryCache.read>;

const summary = {
  days: 7,
  totalViews: 6,
  periodViews: 6,
  previousPeriodViews: 0,
  changePercent: 100,
  activeUsers: 2,
  users: 2,
  profiles: 2,
  movies: 5,
  series: 2,
  averageProgress: 20,
  viewsTimeline: [],
  monthly: [],
  topContent: [],
  genreDistribution: [],
};

describe('cached administrator analytics API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('authorizes before accessing a period cache', async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET(new Request('http://localhost/api/statistics/admin-overview?days=7'));

    expect(response.status).toBe(403);
    expect(mockedRead).not.toHaveBeenCalled();
  });

  it('scopes the cache identity and telemetry to the bounded period', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedRead.mockResolvedValue({
      value: summary,
      source: 'miss',
      cacheReadMs: 1,
      loadMs: 14,
      stored: true,
    });

    const response = await GET(new Request('http://localhost/api/statistics/admin-overview?days=7'));

    expect(response.headers.get('x-admin-cache')).toBe('miss');
    expect(response.headers.get('server-timing')).toBe('redis;dur=1, postgres;dur=14');
    expect(await response.json()).toEqual(summary);
    expect(mockedRead).toHaveBeenCalledWith(expect.objectContaining({
      namespace: 'admin-analytics',
      version: 1,
      identities: ['days:7'],
      ttlSeconds: 60,
      maxValueBytes: 48 * 1024,
    }));
  });

  it('uses the safe 30-day identity for an unsupported period', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedRead.mockResolvedValue({
      value: { ...summary, days: 30 },
      source: 'hit',
      cacheReadMs: 1,
      loadMs: 0,
      stored: true,
    });

    await GET(new Request('http://localhost/api/statistics/admin-overview?days=999'));

    expect(mockedRead).toHaveBeenCalledWith(expect.objectContaining({ identities: ['days:30'] }));
  });
});
