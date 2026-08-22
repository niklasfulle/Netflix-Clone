# Redis runtime and background-job architecture

- Date: 2026-08-22
- Scope: issue #54; Next.js 16.2.12, Node.js 22, Prisma 5.20,
  PostgreSQL 18, Docker Compose, Ansible, staging, and production
- Status: architecture decision for the 1.13 implementation tickets

## Decision

Use **`redis@6.2.1` (node-redis)** for cache and non-authoritative runtime
coordination, and **`pg-boss@12.27.0`** for durable background jobs. Run the
job processor as a separate long-lived Node.js worker container built from the
same application image. Do not run workers inside the Next.js process and do
not import either library into the Edge runtime. Next.js uses the Node.js
runtime by default and its Edge runtime lacks the full Node.js API surface
needed by these clients.
([current runtime](../../package.json), [current container](../../Dockerfile),
[Next.js runtime reference](https://nextjs.org/docs/app/api-reference/edge))

This split deliberately keeps PostgreSQL as the only durable system of record.
Redis may be restarted, flushed, bypassed, or upgraded without losing accepted
work or user-visible state. PostgreSQL already has environment isolation,
pre-migration backup/restore verification, versioned migrations, and rollback
checks in this repository; pg-boss is designed for teams already operating
PostgreSQL and supports atomic enqueueing, retries, dead-letter queues, and
PostgreSQL 13 or newer on Node.js 22.12 or newer.
([staging isolation](../deployment/staging.md),
[pg-boss project and requirements](https://github.com/timgit/pg-boss),
[PostgreSQL 18 image](https://hub.docker.com/_/postgres))

Pin the exact package versions above. Pin a current **Redis 7.2.z Alpine image
by digest** when implementation starts; do not deploy a floating `7.2`,
`alpine`, or `latest` tag. Redis 7.2 is in node-redis's tested matrix and its
published Redis Open Source lifecycle runs through December 2029.
([node-redis supported Redis versions](https://github.com/redis/node-redis/blob/master/packages/redis/README.md#supported-redis-versions),
[Redis version lifecycle](https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/),
[official Redis image](https://hub.docker.com/_/redis))

### Why not BullMQ for 1.13

BullMQ remains the strongest Redis-backed alternative, but it is not the
production baseline for this release:

- BullMQ 5.81.2 is mature and feature-rich, but its documented connection path
  uses ioredis. ioredis describes its maintenance as best effort and recommends
  node-redis for new projects; Redis also recommends node-redis for most new
  JavaScript work.
  ([BullMQ 5.81.2 release](https://github.com/taskforcesh/bullmq/releases/tag/v5.81.2),
  [BullMQ 5 connections](https://docs.bullmq.io/guide/connections),
  [ioredis project status](https://github.com/redis/ioredis),
  [Redis client guidance](https://redis.io/docs/latest/develop/clients/))
- BullMQ 6 introduced pluggable backends and made ioredis optional only on
  2026-07-30; 6.2.0 was released on 2026-08-21, one day before this decision.
  The node-redis adapter is promising, but this new backend boundary has not had
  enough soak time for a production architecture decision.
  ([BullMQ 6.0.0 release](https://github.com/taskforcesh/bullmq/releases/tag/v6.0.0),
  [BullMQ 6.2.0 release](https://github.com/taskforcesh/bullmq/releases/tag/v6.2.0),
  [node-redis adapter source](https://github.com/taskforcesh/bullmq/blob/master/src/classes/redis-connection.ts))
- A Redis queue would require queue persistence, `noeviction`, queue-specific
  recovery and backup procedures, and an application-level PostgreSQL outbox to
  close the PostgreSQL/Redis dual-write gap. pg-boss instead enqueues in the
  existing database transaction and provides a native dead-letter path.
  ([pg-boss capabilities](https://github.com/timgit/pg-boss),
  [pg-boss queue options](https://github.com/timgit/pg-boss/blob/master/docs/api/queues.md))

Re-evaluate BullMQ 6 in a separate dependency decision only after the selected
minor has had at least 30 days of release age, passes the complete fault suite
below, and has no open blocker in the node-redis adapter for the project's
single-node topology. That re-evaluation must not silently change the durable
job model.

### Compared options

| Concern | Option | Compatibility and maintenance | Decision |
| --- | --- | --- | --- |
| General Redis client | `redis` / node-redis 6.2.1 | Redis's recommended JavaScript client; Node.js >=20; tested with Redis 7.2/7.4/8.0 | **Use and pin** |
| General Redis client | ioredis 6 | Node.js >=20 and Redis >=6.2, but best-effort maintenance and node-redis recommended for new work | Do not introduce for application code |
| Redis queue | BullMQ 5.81.2 | Maintained and operationally proven, but tied to ioredis in the documented v5 path | Rejected for 1.13 |
| Redis/pluggable queue | BullMQ 6.2.0 | Compatible with the runtime and exposes a node-redis adapter, but its backend abstraction is less than one month old | Revisit after soak, not production baseline |
| PostgreSQL queue | pg-boss 12.27.0 | Node.js >=22.12, PostgreSQL >=13, active releases, atomic enqueue, retries, DLQ, cancellation | **Use and pin** |
| General scheduler | Agenda 6 | Active, but adds a broader backend abstraction and scheduling surface not needed here | Rejected |

The version/runtime facts come from the projects' own package metadata and
release records.
([node-redis 6.2.1 package metadata](https://github.com/redis/node-redis/blob/redis%406.2.1/packages/redis/package.json),
[node-redis 6.2.1 release](https://github.com/redis/node-redis/releases/tag/redis%406.2.1),
[ioredis 6 metadata](https://github.com/redis/ioredis/blob/v6.0.0/README.md),
[pg-boss 12.27.0 release](https://github.com/timgit/pg-boss/releases/tag/12.27.0),
[Agenda project](https://github.com/agenda/agenda))

## Runtime topology

Use four long-lived services per environment:

1. `proxy`: the existing Caddy ingress.
2. `app`: the existing Next.js Node.js server; it reads/writes PostgreSQL,
   reads/writes the Redis cache, and submits jobs to pg-boss.
3. `worker`: the same versioned application image with a dedicated worker
   entrypoint; it reads pg-boss jobs and accesses only the mounts and services
   required by its processors.
4. `redis-runtime`: one standalone Redis cache/coordination process.

The existing dedicated staging and production LXCs remain separate failure and
security domains. Each receives its own Compose project, Redis container,
credentials, ACL file, key namespace, and (if a volume is retained for
diagnostics) volume. Never share a Redis instance, password, network, or volume
between staging and production. Do not use Redis database numbers for this
isolation: Redis documents logical databases as namespacing within one persisted
instance, advises against using them for unrelated applications, and Redis
Cluster supports only database zero.
([current staging model](../deployment/staging.md),
[Redis `SELECT`](https://redis.io/docs/latest/commands/select/))

Create explicit Compose `frontend` and `backend` networks. Only Caddy joins
`frontend`; app joins both; worker and Redis join only `backend`. Set
`backend.internal: true`. Publish no Redis port on the LXC or LAN. Docker
Compose supports service-name discovery and an `internal` network prevents
external connectivity.
([Compose networks](https://docs.docker.com/reference/compose-file/networks/),
[Compose networking](https://docs.docker.com/compose/how-tos/networking/))

Do not add Sentinel or Redis Cluster in 1.13. A single LXC is one failure
domain; placing a replica and multiple Sentinel processes on it does not survive
host failure while adding a misleading HA control plane. Sentinel is a
distributed system intended to have multiple cooperating processes. If the
availability target later requires Redis HA, use at least three independent
failure domains and make that a separate operational design.
([Redis Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/))

## Redis security and LAN assumptions

- Keep Redis reachable only on the private Docker backend network and retain
  protected mode. Network isolation is the first control; Redis warns that an
  exposed port permits destructive administrative commands.
- Disable the default user. Create separate named ACL users for `app` and any
  administrative health probe, with random credentials stored only in the
  existing root-owned environment/secret area. Restrict application access to
  its key prefix and required command categories; deny `FLUSHALL`, `FLUSHDB`,
  `CONFIG`, `ACL`, `MODULE`, `DEBUG`, replication, and shutdown commands.
- Do not place credentials in Compose arguments, repository files, healthcheck
  command lines, or logs. For `redis-cli`, pass authentication through
  `REDISCLI_AUTH`, which the official CLI documentation recommends over `-a`.

Redis 6 and newer ACLs support named users, command restrictions, key patterns,
and password authentication.
([Redis security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/),
[Redis ACLs](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/),
[redis-cli authentication](https://redis.io/docs/latest/develop/tools/cli/))

No Redis TLS is required while client and server remain on the same LXC's
private Docker bridge and no port is published. This is an explicit trust
boundary, not a claim that a LAN is intrinsically trusted. If Redis moves to
another host, joins a shared network, or publishes a host port, require TLS,
validate the certificate against an environment-specific CA and hostname, and
never disable certificate verification. Password authentication alone is not
confidential because Redis commands, including `AUTH`, are otherwise sent
unencrypted. Redis supports TLS on client, replication, and cluster channels.
([Redis security and TLS](https://redis.io/docs/latest/operate/oss_and_stack/management/security/),
[Redis TLS setup](https://redis.io/docs/latest/operate/oss_and_stack/management/security/encryption/))

## Persistence, eviction, memory, and upgrades

Redis is **not persistent** in this design: disable both AOF and RDB. Every key
must be reconstructable or safely expendable. PostgreSQL owns accepted jobs,
security state, and user-visible state. Redis officially supports a no-
persistence cache mode; AOF/RDB are needed only when Redis itself owns data that
must survive restart.
([Redis persistence options](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/))

Initial limits for the single-instance LXC deployment:

- Redis container memory limit: **256 MiB**.
- Redis `maxmemory`: **160 MiB**, leaving headroom for allocator overhead,
  client buffers, fragmentation, and the container process.
- `maxmemory-policy allkeys-lfu`.
- All application keys must have TTLs; the cache repository rejects writes
  without a bounded TTL.
- Alert at 70% and 85% of `maxmemory`, on sustained evictions, connection
  errors, latency, or `used_memory_rss` approaching the container limit.

Redis documents `maxmemory`, `allkeys-lfu`, and the distinction between dataset
memory and RSS/overhead. The initial numbers are a conservative budget, not an
unmeasured capacity promise; staging load results may lower or raise them while
preserving headroom.
([Redis eviction policies](https://redis.io/docs/latest/develop/reference/eviction/),
[Redis `INFO` memory fields](https://redis.io/docs/latest/commands/info/),
[Redis administration memory guidance](https://redis.io/docs/latest/operate/oss_and_stack/management/admin/))

Upgrade procedure:

1. Pin the proposed exact Redis patch image and digest in staging.
2. Run compatibility, eviction, outage, restart, and load tests.
3. Recreate the staging cache and prove the app rebuilds it without a restore.
4. Promote the same digest to production during the normal deployment.
5. Keep the prior image digest for rollback; no cache-data downgrade is needed.

For a future major Redis upgrade, review breaking changes and client support,
then repeat the destructive-cache rehearsal. Redis recommends practicing
upgrades in a controlled environment and backing up durable datasets; this
architecture intentionally makes the Redis dataset disposable.
([standalone Redis upgrade](https://redis.io/docs/latest/operate/oss_and_stack/install/upgrade/standalone/))

pg-boss schema changes are different: run `pg-boss migrate` explicitly in the
Ansible migration phase after the verified PostgreSQL backup and before the new
worker starts. Do not let `worker.start()` perform an unreviewed production
migration. Run `pg-boss doctor` after migration. Test every pg-boss upgrade on a
restored PostgreSQL 18 staging copy and confirm the previous application
version's rollback compatibility before promotion.
([pg-boss release migration metadata](https://github.com/timgit/pg-boss/releases),
[repository backup verification](../operations/postgres-backup-verification.md))

## Data classification

| Class | Examples | Authority, retention, and Redis rule |
| --- | --- | --- |
| Durable PostgreSQL state | users, credentials, sessions, profiles, catalog, favorites, audit events, media scan runs/findings, job status visible to users/admins | PostgreSQL only; versioned migration and normal backup/restore policy |
| Rebuildable Redis cache | catalog cards, derived counts, sanitized admin read models, feature metadata | Cache-aside, versioned key, bounded TTL; no secrets, raw tokens, passwords, MFA material, full job payload, or media bytes |
| Distributed coordination | cache stampede lease, short duplicate-work hint, worker liveness hint | Redis may optimize only; PostgreSQL unique constraints/advisory locks remain authoritative, so eviction/restart cannot violate an invariant |
| Rate-limit counters | general low-risk API counters and cache-abuse hints | Redis may provide a fast first layer; existing PostgreSQL `AuthRateLimit` remains authoritative for login and recovery controls |
| Queued work | email/media/integrity job input, state, retry schedule, cancellation, DLQ | pg-boss/PostgreSQL; payload contains stable IDs and versions, not credentials, large blobs, or a snapshot of mutable domain objects |

The existing authentication limiter already performs an atomic PostgreSQL
upsert and bounded cleanup. Keep it in place. Redis failure must never weaken
login, registration, verification, password reset, MFA, passkey, or QR approval
throttling.
([current authentication limiter](../../data/auth-rate-limit.ts),
[PostgreSQL 18 `INSERT ... ON CONFLICT`](https://www.postgresql.org/docs/18/sql-insert.html))

The current media-scan uniqueness constraint likewise remains authoritative;
do not replace it with a Redis lock. Redis coordination may avoid an unnecessary
database attempt, but the PostgreSQL partial unique index is the final guard.
([current media scan lock migration](../../prisma/migrations/20260814170000_media_scan_concurrency/migration.sql))

## Cache contract and invalidation

Use a small server-only cache repository around node-redis rather than exposing
the client throughout the application. It provides typed `get`, `set`,
`delete`, and `withCache` operations, adds the environment/schema-version key
prefix, enforces TTLs and value-size limits, records hit/miss/error metrics, and
owns connection/reconnect behavior.

Use cache-aside for read-heavy catalog and sanitized admin summaries:

1. Read Redis with a short command timeout.
2. On miss or Redis error, read PostgreSQL.
3. Return the PostgreSQL result regardless of a failed cache write.
4. Populate with TTL plus jitter.
5. On a successful domain write, delete affected keys after commit. Versioned
   keys and TTL bound stale data if invalidation fails.

Redis documents cache-aside as falling back to the primary store on a miss and
repopulating a TTL-bound entry. node-redis production guidance also documents
timeouts, reconnection, and disabling the offline queue when replay of an
ambiguous command would be unsafe. Use `disableOfflineQueue: true` for request-
path cache operations so a stale request does not replay later.
([Redis cache-aside](https://redis.io/docs/latest/develop/use-cases/cache-aside/nodejs/),
[node-redis production usage](https://redis.io/docs/latest/develop/clients/nodejs/produsage/))

## Controlled degradation

| User path | Redis unavailable | PostgreSQL unavailable | Worker/queue unavailable |
| --- | --- | --- | --- |
| Login and recovery | Continue through PostgreSQL-backed auth limiter; do not reduce any security limit | Fail closed with a generic retryable error; do not authenticate from cache | Login remains available; durable notification work may remain pending |
| Catalog reads | Open the cache circuit briefly and read PostgreSQL directly; cache writes are best effort | Return the existing bounded error/empty-state contract, never stale Redis as authority | No effect on ordinary reads |
| Admin pages | Read durable data from PostgreSQL; show Redis health as unavailable and cache metrics as stale | Deny mutations and show unavailable; do not infer state from Redis | Show last durable job state/backlog warning; disable controls that require a live worker |
| Long-running job submission | No effect because pg-boss uses PostgreSQL | Return 503 and do not claim the job was accepted | Accept into PostgreSQL, show queued/degraded status, alert on backlog age |
| Existing long-running job | Redis loss does not cancel or duplicate it | Processor fails/retries according to its queue policy | Another worker resumes expired work; operator can retry/redrive after recovery |

Implement a per-process Redis circuit breaker with a small connection/command
timeout and cooldown. It prevents every request from waiting on the same dead
cache. Health must distinguish `ok`, `degraded` (Redis/worker unavailable but
core PostgreSQL paths work), and `unhealthy` (PostgreSQL/core path unavailable).
Do not make the public app container unhealthy solely because the optional
cache is down; expose the degraded dependency separately for monitoring.

## Job correctness and lifecycle

### Atomic creation and idempotency

Create an application-owned `JobRun` record and the pg-boss job in one
PostgreSQL transaction. Give `JobRun` a unique `(jobType, idempotencyKey)` and
store the pg-boss job ID, requested actor, target IDs, state, timestamps,
attempt count, progress, cancellation request, and a bounded sanitized error.
Use a small `pg` transaction repository for this boundary; pg-boss's published
Prisma adapter requires Prisma 7, while this repository is pinned to Prisma 5.
Do not fake atomicity with a Prisma transaction followed by `boss.send()`.
([current Prisma version](../../package.json),
[pg-boss transaction adapters](https://github.com/timgit/pg-boss#orm-transaction-adapters))

PostgreSQL unique constraints and `ON CONFLICT` provide the idempotency guard.
If dispatch work is ever separated through an outbox, claim rows in ordered
batches with `FOR UPDATE SKIP LOCKED`; PostgreSQL explicitly identifies that as
a queue-like use case.
([PostgreSQL 18 constraints](https://www.postgresql.org/docs/18/ddl-constraints.html),
[PostgreSQL 18 `SELECT ... SKIP LOCKED`](https://www.postgresql.org/docs/18/sql-select.html))

Every processor is idempotent even though pg-boss advertises exactly-once job
delivery. Retries, process death after an external side effect, operator
redrive, and timeout races can still repeat application work. Before each side
effect, check the durable JobRun state and use a destination idempotency key or
an atomic PostgreSQL transition. Write files to a temporary path, validate, and
publish with atomic rename; never overwrite the last valid artifact in place.
pg-boss itself warns that retry-enabled work should retain the general
idempotency rule.
([pg-boss delivery semantics](https://github.com/timgit/pg-boss/blob/master/docs/readme.md),
[BullMQ idempotency pattern, corroborating queue semantics](https://docs.bullmq.io/patterns/idempotent-jobs))

### Retries and dead-letter handling

Define policy per queue, not ad hoc in handlers:

- Validation, authorization, missing target, unsupported input, and explicit
  cancellation: no retry.
- Transient database/network/service failure: `retryLimit: 3`, exponential
  backoff, initial delay 5 seconds, capped at 5 minutes, with jitter.
- Long media work: process bounded chunks, heartbeat, and retry only the
  incomplete chunk.
- Every production queue has a dedicated dead-letter queue. Retain DLQ and
  durable JobRun failure metadata for 30 days, alert immediately on arrival,
  and require an admin reason/audit event for redrive or discard.

pg-boss supports retry limits, exponential backoff with jitter, maximum delay,
heartbeats, expiry, dead-letter source metadata, and redrive.
([pg-boss queue configuration](https://github.com/timgit/pg-boss/blob/master/docs/api/queues.md),
[pg-boss job operations](https://github.com/timgit/pg-boss/blob/master/docs/api/jobs.md))

### Cancellation and timeouts

Cancellation is cooperative and durable:

1. An authorized request sets `JobRun.cancelRequestedAt` and calls
   `boss.cancel()` for pending/active work.
2. The processor receives an `AbortSignal`, polls the durable flag at bounded
   phase boundaries when necessary, and passes the signal into `fetch`, file,
   and child-process APIs.
3. It cleans temporary resources, records `CANCELLED`, and does not retry.
4. Cancellation of an irreversible external side effect is reported as
   `CANCEL_REQUESTED` until reconciliation proves the outcome.

Set `expireInSeconds` per queue to a measured worst-case bound and
`heartbeatSeconds` to detect dead workers. Also use an in-process
`AbortController` timeout so resources are released promptly; database expiry
is the recovery guard, not a mechanism that can forcibly stop JavaScript.
pg-boss cancellation is best effort for a set of jobs and its heartbeat/expiry
options define recovery timing.
([pg-boss cancellation and heartbeat](https://github.com/timgit/pg-boss/blob/master/docs/api/jobs.md),
[pg-boss expiry guidance](https://github.com/timgit/pg-boss/blob/master/docs/api/queues.md))

### Deployment draining

The worker handles `SIGTERM` and `SIGINT` once:

1. mark readiness false and stop fetching new jobs;
2. abort only work whose declared drain budget cannot finish;
3. call `boss.stop({ graceful: true, timeout: 90_000 })`;
4. close Redis and database clients; and
5. exit after logs/metrics are flushed.

Set the worker's Compose `stop_grace_period` to **105 seconds**, longer than the
90-second application drain budget. Compose otherwise sends `SIGKILL` after
the grace period (10 seconds by default). pg-boss documents a graceful stop
that stops new work and waits up to a configured timeout.
([Compose `stop_grace_period`](https://docs.docker.com/reference/compose-file/services/#stop_grace_period),
[pg-boss graceful stop](https://github.com/timgit/pg-boss/blob/master/docs/readme.md))

Ansible deployment order becomes: verify PostgreSQL backup; signal and verify
worker drain; stop the old app/worker; run reviewed Prisma and pg-boss
migrations; start Redis, app, and worker; wait for Redis/app/worker health;
verify pg-boss schema and queue access; then publish successful deployment
status. New submissions during a worker drain remain durable in PostgreSQL.
Rollback must never run an older worker against an incompatible pg-boss schema.

## Test strategy

### Unit tests without services

- Cache key/version/TTL/value-size rules, serialization, timeout, circuit
  breaker, error classification, metrics, and invalidation.
- Job idempotency keys, retry classification, timeout/cancellation state
  machine, sanitized failures, and graceful signal handling with fake clocks.
- Repository ports are mocked; no unit test should depend on a developer's
  installed Redis or PostgreSQL.

### Real PostgreSQL 18 and Redis integration tests

Add a dedicated test Compose stack using exact pinned images for PostgreSQL
18.4 and Redis 7.2.z. PostgreSQL 18 changed the official image's `PGDATA` and
volume layout, so mount `/var/lib/postgresql` and test the same layout intended
for deployment.
([PostgreSQL 18 official-image volume change](https://hub.docker.com/_/postgres/))

Run serial integration suites that prove:

- ACL success/failure, forbidden administrative commands, TTL enforcement,
  LFU eviction under the configured limit, reconnect, restart, `FLUSHDB`, slow
  response, and complete Redis outage.
- Cache-aside hit/miss/invalidate/jitter, concurrent stampede control, and
  PostgreSQL fallback without response corruption.
- pg-boss migration/doctor, transaction rollback, duplicate idempotency keys,
  concurrent submissions, retry/backoff, heartbeat expiry, cancellation,
  worker death mid-job, DLQ arrival, redrive, retention, and graceful drain.
- Existing PostgreSQL authentication throttling is unchanged with Redis
  healthy, stopped, flushed, and memory constrained.
- PostgreSQL loss never returns an accepted job; Redis loss never loses an
  accepted job.

Use unique database/schema and key prefixes per test run and tear down only
that exact Compose project. Never load staging or production credentials.

### Ansible and deployment tests

Extend the existing Python contract tests to assert that rendered Compose and
the playbook provide:

- exact image digests, environment labels, separate credentials, internal
  network, no Redis host port, read-only containers where possible, resource
  limits, Redis health, app health, worker readiness, and the 105-second worker
  stop grace period;
- backup verification before Prisma/pg-boss migration;
- drain before migration and start, health, `ACL WHOAMI`, Redis `INFO`,
  `pg-boss doctor`, queue submission/consumption, and deployment-status checks
  after migration;
- a failed Redis health check degrades the app but a failed PostgreSQL or
  worker migration prevents promotion; and
- rollback refuses schema-incompatible worker versions.

Compose can wait for dependencies marked `service_healthy`, and the Ansible
Compose module can pass `--wait`; retain explicit assertions because startup
ordering alone is not readiness.
([Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/),
[Ansible Compose wait](https://docs.ansible.com/projects/ansible/latest/collections/community/docker/docker_compose_v2_module.html))

Run the full staging deployment twice to prove idempotence, then kill Redis and
the worker independently and verify automatic recovery, durable backlog, and
monitoring. Rehearse a Redis image upgrade/rollback and a pg-boss schema upgrade
on a restored PostgreSQL 18 backup before production promotion.

### Playwright acceptance

Keep the existing serial desktop/mobile projects and external-staging mode.
Playwright's `webServer` facility is suitable for starting the local app, while
the integration wrapper starts PostgreSQL, Redis, and the worker first.
([current Playwright configuration](../../playwright.config.ts),
[Playwright web server](https://playwright.dev/docs/test-webserver),
[Playwright project dependencies](https://playwright.dev/docs/api/class-testproject#test-project-dependencies))

Add browser-visible journeys for:

- catalog reads/search with warm cache, cold cache, and Redis stopped;
- successful login and enforced lockout/retry timing while Redis is stopped,
  proving PostgreSQL auth throttling remains authoritative;
- admin dependency status showing Redis degraded without hiding durable data;
- submit, observe progress, cancel, retry, and redrive a deterministic test job;
- worker stopped after submission: UI remains queued, then completes after the
  worker returns; and
- a deliberately failed job appears in the DLQ/admin view with sanitized error
  text and an audited redrive action.

Playwright must assert only public/admin contracts, not query Redis directly.
Database-mutating helpers retain the current staging marker and isolated-
database-name checks.

## Observability and release gates

Expose and alert on Redis connection state, command latency/errors, hit ratio,
evictions, `used_memory`, `used_memory_rss`, and circuit state; pg-boss ready,
active, retry, failed, DLQ, oldest-ready age, processing duration, heartbeat
expiry, and drain duration; and PostgreSQL pool saturation and queue query
latency. Redis `INFO` publishes memory, persistence, clients, stats, and
replication sections; pg-boss can persist queue-depth statistics and warnings.
([Redis `INFO`](https://redis.io/docs/latest/commands/info/),
[pg-boss queue statistics](https://github.com/timgit/pg-boss/blob/master/docs/api/constructor.md))

Release 1.13 may enable the architecture in production only when:

1. package and container versions are exact and digest-pinned;
2. PostgreSQL 18 restore plus pg-boss migration/doctor succeeds;
3. Redis loss passes login, catalog, admin, and job-submission degradation
   tests;
4. worker kill/retry/idempotency/DLQ/cancellation/drain tests pass;
5. staging survives the same Ansible deployment twice and an upgrade/rollback
   rehearsal; and
6. dashboards and alerts expose Redis degradation and job backlog before users
   report them.

## Open risks requiring implementation evidence

1. **Prisma 5 transaction boundary.** pg-boss's shipped Prisma adapter targets
   Prisma 7. The implementation must prove a small `pg`-based atomic JobRun +
   enqueue repository or defer the queue work until a separately reviewed
   Prisma upgrade. This is the largest code-level risk.
2. **Node patch pin.** pg-boss requires Node 22.12 or newer, while the Dockerfile
   currently uses floating `node:22-slim`. Pin an eligible exact Node image and
   digest before adding pg-boss.
3. **Shared PostgreSQL capacity.** Queue polling, maintenance, and job history
   share the existing database. Establish a connection budget, bounded worker
   concurrency, queue indexes, backlog alert, and load-test evidence so jobs
   cannot starve authentication/catalog traffic.
4. **pg-boss schema ownership.** Automatic startup migration would exceed the
   worker's runtime privileges and conflict with the existing deployment
   contract. Use an explicit migration role/phase and verify rollback
   compatibility.
5. **Redis sizing.** 160 MiB is an initial cache budget. Measure real catalog
   object sizes, RSS fragmentation, hit ratio, and eviction rate before treating
   it as final.
6. **Single-host availability.** App, worker, Redis, and media mounts remain in
   one LXC. This decision provides controlled degradation and restart recovery,
   not host-level high availability.
7. **BullMQ future.** BullMQ 6 may become the better choice after its pluggable
   backend and node-redis adapter mature. Switching later requires a new
   migration/failure analysis, not a package-only replacement.

These risks are explicit release gates; none is permission to weaken the
PostgreSQL authentication limiter, cache isolation, TLS boundary, idempotency,
or deployment drain contract.
