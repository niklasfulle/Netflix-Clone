/** @jest-environment node */

jest.mock('@/lib/redis/runtime', () => {
  const runtime = {
    key: jest.fn((namespace: string, version: number, identities: readonly string[]) => (
      `netflix:staging:v${version}:${namespace}:${identities.join(':')}`
    )),
    get: jest.fn(),
    set: jest.fn(),
    incrementFixedWindowCounters: jest.fn(),
    delete: jest.fn(),
    health: jest.fn(),
    close: jest.fn(),
  };
  return { getRedisRuntime: () => runtime };
});

import {
  invalidateAdminSummaries,
} from '@/lib/administration/admin-summary-runtime';
import { getRedisRuntime } from '@/lib/redis/runtime';

const mockedRedis = getRedisRuntime() as jest.Mocked<ReturnType<typeof getRedisRuntime>>;

describe('administrator summary cache runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRedis.delete.mockResolvedValue({ status: 'ok', value: true, latencyMs: 0 });
  });

  it('invalidates the overview and every bounded analytics period', async () => {
    await invalidateAdminSummaries();

    expect(mockedRedis.delete).toHaveBeenCalledTimes(5);
    expect(mockedRedis.delete.mock.calls.map(([key]) => key)).toEqual([
      'netflix:staging:v1:admin-overview:global',
      'netflix:staging:v1:admin-analytics:days:7',
      'netflix:staging:v1:admin-analytics:days:30',
      'netflix:staging:v1:admin-analytics:days:90',
      'netflix:staging:v1:admin-analytics:days:365',
    ]);
  });
});
