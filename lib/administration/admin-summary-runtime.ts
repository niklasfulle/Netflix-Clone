import { getRedisRuntime } from '@/lib/redis/runtime';

import {
  createRequestDeduplicator,
  createSummaryCache,
  type SummaryCacheDefinition,
} from './summary-cache';

export const ADMIN_ANALYTICS_DAYS = [7, 30, 90, 365] as const;
export const ADMIN_SUMMARY_MAX_BYTES = 48 * 1024;

export const adminOverviewCacheIdentity = {
  namespace: 'admin-overview',
  version: 1,
  identities: ['global'],
} as const;

export function adminAnalyticsCacheIdentity(days: number) {
  return {
    namespace: 'admin-analytics',
    version: 1,
    identities: [`days:${days}`],
  } as const;
}

export const adminSummaryCache = createSummaryCache({ redis: getRedisRuntime() });
export const systemOverviewRequests = createRequestDeduplicator();

export async function invalidateAdminSummaries(): Promise<void> {
  const definitions: Array<Pick<SummaryCacheDefinition<unknown>, 'namespace' | 'version' | 'identities'>> = [
    adminOverviewCacheIdentity,
    ...ADMIN_ANALYTICS_DAYS.map(adminAnalyticsCacheIdentity),
  ];
  await adminSummaryCache.invalidate(definitions);
}
