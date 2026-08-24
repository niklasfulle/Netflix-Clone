# Redis administrator summary cache

Ticket: GitHub #61

## Selected reads

Two administrator-only aggregates are shared across administrators and are
expensive enough to cache:

| Endpoint | PostgreSQL work before caching | Redis policy |
| --- | ---: | --- |
| `/api/admin/overview` | 11 queries, or 12 when top content exists | key v1, 30-second TTL, 48 KiB maximum |
| `/api/statistics/admin-overview?days=N` | 7 queries | one v1 key per 7/30/90/365-day period, 60-second TTL, 48 KiB maximum |

The live system endpoint is not stored in Redis because its database, Redis,
container, and host state is expected to be current. Concurrent identical
requests are deduplicated only while the first read is active.

All cache access happens after administrator authorization. Keys are generated
by the Redis runtime and therefore include the deployment environment. Cached
values contain only shared administrator aggregates, never a user's session or
role decision. PostgreSQL and the system-monitor snapshot remain the sources of
truth.

## Fallback and invalidation

- Disabled, unavailable, timed-out, or circuit-open Redis falls back to the
  original PostgreSQL queries.
- Invalid cached JSON is deleted and rebuilt.
- Concurrent misses share one loader promise per versioned key.
- Content, actor, role, and account-block mutations invalidate the overview
  and all four analytics periods.
- Invalidation advances an in-process generation so an older in-flight loader
  cannot write stale data after a mutation.
- Redis itself enforces a 64 KiB serialization ceiling; this cache applies a
  stricter explicit 48 KiB ceiling.

## Measurement

Baseline measurements were taken on authenticated staging version 1.13.0 on
2026-08-24. Each value measures navigation until the page heading was visible,
with static assets already warm:

| Page | Five baseline runs | Median | Mean |
| --- | --- | ---: | ---: |
| Administrator overview | 109, 234, 183, 166, 166 ms | 166 ms | 171.6 ms |
| Analytics, 30 days | 104, 155, 176, 165, 171 ms | 165 ms | 154.2 ms |

The same measurement was repeated after deployment on 2026-08-24:

| Page | Five post-deployment runs | Median | Mean |
| --- | --- | ---: | ---: |
| Administrator overview | 111, 212, 250, 241, 203 ms | 212 ms | 203.4 ms |
| Analytics, 30 days | 174, 145, 159, 172, 169 ms | 169 ms | 163.8 ms |

These whole-page navigation figures include routing and rendering. They do not
show a meaningful browser-latency improvement at this staging data size; the
administrator overview also showed higher run-to-run variance. The database
work is nevertheless reduced deterministically: on a Redis hit, the endpoints
execute zero PostgreSQL queries instead of 11–12 and 7 respectively. During
the staging check Redis remained connected with a closed circuit breaker, no
errors, timeouts, reconnects, or fallbacks, and its runtime hit counter
increased while the cached pages were revisited.

Responses additionally expose `X-Admin-Cache` and `Server-Timing` headers for
direct API-level profiling in an HTTP client that has an administrator session.
