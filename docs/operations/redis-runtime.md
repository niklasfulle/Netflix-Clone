# Redis runtime operations

This runbook covers the isolated, non-durable Redis runtime introduced for
version 1.13. The architecture and failure-policy rationale are recorded in
[`docs/research/redis-runtime-and-job-architecture.md`](../research/redis-runtime-and-job-architecture.md).

Redis is an optional cache and coordination dependency. PostgreSQL remains the
authority for authentication throttling, accepted jobs, and business data.
Staging and production use different LXCs, Docker networks, ACL credentials,
key prefixes, and environment labels.

## Application runtime contract

Server-side features use the shared `RedisRuntime` boundary in
`lib/redis/runtime.ts`; they do not construct node-redis clients directly. The
runtime is lazy, so importing the module or building the application never
contacts Redis.

- `REDIS_URL` and `REDIS_KEY_PREFIX` are provisioned in `redis-app.env`.
  `REDIS_KEY_PREFIX` must exactly equal
  `netflix:${DEPLOYMENT_ENVIRONMENT}:`, otherwise startup of the adapter fails
  closed before a connection is attempted.
- `REDIS_ENABLED=false` explicitly disables the adapter. `REDIS_ENABLED=true`
  requires a URL. With neither flag nor URL, Redis is unconfigured and behaves
  as an optional disabled dependency.
- `REDIS_CONNECT_TIMEOUT_MS`, `REDIS_COMMAND_TIMEOUT_MS`, and
  `REDIS_CIRCUIT_COOLDOWN_MS` may override bounded defaults of 500 ms, 250 ms,
  and 5 seconds.
- Keys contain environment, schema version, a short feature namespace, and a
  SHA-256-derived identity hash. Raw emails, tokens, and feature payloads do not
  appear in keys or telemetry.
- Values are JSON, limited to 64 KiB, and every write requires a TTL between
  one second and seven days. Redis is never an authoritative data store.
- Three consecutive connection or command failures open the circuit. Calls
  then return an immediate fallback until the cooldown expires. Recovery uses
  one reused client, bounded reconnect attempts, and transition-only logs.

The public health endpoint reports Redis as `disabled`, `ok`, or `degraded`.
Because Redis is optional, degradation is visible without turning an otherwise
healthy PostgreSQL-backed application into an HTTP 503 response.

The authenticated system overview reports command count, cache hits and
misses, average latency, errors, timeouts, reconnects, and fallbacks. A hit is
counted only after a stored value is decoded successfully; an absent key is a
miss, while invalid data remains an error. These adapter counters are
process-local and reset whenever the application container restarts.

## Catalog metadata cache

Authenticated movie and series catalog reads use Redis as a five-minute
read-through cache. The shared boundary covers the main catalog, newest-title,
and actor-filtered rows that use `getMoviesWithWatchTime`.

- Cache entries contain only profile-independent card metadata such as title,
  description, genre, duration, creation time, and actor names.
- Profile watch time is deliberately excluded and is read from PostgreSQL for
  every response.
- Entries expire after 300 seconds. A miss reloads PostgreSQL and refills
  Redis.
- A Redis timeout, connection failure, open circuit, disabled adapter, or
  rejected write never prevents a PostgreSQL-backed response.
- Invalid cached JSON is rejected, reloaded from PostgreSQL, and replaced with
  validated metadata.
- Thumbnail and video payloads are not copied into Redis. Catalog responses
  continue to use the dedicated thumbnail resource URL.

## Authentication throttling

Authentication attempts use Redis as an atomic first-line limiter while the
existing PostgreSQL `AuthRateLimit` table remains authoritative.

- Account and shared-IP counters are incremented together by one bounded Lua
  command. Every key uses the environment namespace, an explicit schema
  version, hashed identities, and the configured fixed-window TTL.
- An exhausted Redis budget is rejected immediately, which keeps repeated
  abusive attempts away from PostgreSQL after the limit has been reached.
- Every attempt still allowed by Redis is recorded and decided atomically in
  PostgreSQL. This preserves effective limits across rolling deployments,
  Redis eviction, an empty cache, and Redis restarts.
- A Redis timeout, unavailable connection, disabled adapter, or open circuit
  falls back to the same PostgreSQL decision. PostgreSQL failure is fail-closed;
  a Redis result alone never authorizes authentication.
- Successful authentication resets only the account budget in both stores.
  The shared-IP budget remains in place, matching the existing policy.

The Redis counters contain neither raw email addresses nor client addresses.
The authentication throttle hashes both subjects with the authentication
secret before the Redis runtime applies its environment-scoped key hash.

## Security and resource contract

- Redis has no published host or LAN port and joins only the internal Compose
  `backend` network.
- The container runs as UID/GID `999:1000`, read-only, with all capabilities
  dropped and `no-new-privileges` enabled.
- `/root/netflix-secrets/redis-users.acl`, `redis-app.env`, and
  `redis-health.env` are generated together, root-owned, and mode `0600`.
  A partial set or a set belonging to the other environment stops deployment.
- The default Redis user is disabled. The application user is restricted to
  the environment key/channel prefix; the health user can only run `PING`,
  `INFO`, and `ACL WHOAMI`.
- The container limit is 256 MiB; Redis `maxmemory` is 160 MiB with
  `allkeys-lfu`. Alert before container RSS reaches its limit and on sustained
  eviction or health failures.
- TLS is unnecessary only while Redis remains on the same LXC's unexposed
  private Docker bridge. Cross-host, shared-network, or published-port access
  requires certificate-validated TLS and a separate design review.

## Local executable checks

Run the rendered Compose/Ansible contract:

```powershell
python -m unittest ansible.tests.test_redis_provisioning_contract -v
```

Run the real isolated Redis checks, which create and remove temporary
containers and volumes:

```powershell
$env:RUN_REDIS_INTEGRATION=1
python -m unittest ansible.tests.test_redis_runtime_integration -v
```

Run the TypeScript adapter tests and its real outage/recovery drill:

```powershell
yarn jest lib/redis/__tests__/runtime.test.ts lib/redis/__tests__/runtime-connected.test.ts --runInBand --coverage=false
yarn test:redis-integration
```

On Linux or in WSL, set `RUN_REDIS_INTEGRATION=1` for the same integration
suite. It proves ACL isolation, idempotent credential generation, environment
binding, lack of port publication, authenticated health, and cache loss after
restart.

## First deployment

1. Run both local suites above.
2. Deploy staging through the normal `deploy.ps1`/Ansible path. The playbook
   creates all three Redis secret files atomically when none exist.
3. Confirm the playbook reports a healthy `netflix-redis-runtime`, the
   `com.netflix-clone.environment=staging` label, health identity `health`,
   `maxmemory:167772160`, and `maxmemory_policy:allkeys-lfu`.
4. Confirm `docker port netflix-redis-runtime` produces no output.
5. Exercise application health through canonical HTTPS before promotion.

If only some Redis secret files already exist, deployment fails closed. Do not
repair this by copying credentials from the other environment. Inspect the
files locally on the target, remove the entire incomplete set only after
confirming that no deployed app still uses it, and rerun the deployment.

## Repeat deployment

Run the same staging deployment a second time without deleting credentials.
The provisioner must report `unchanged`, and the secret files must retain their
owner, mode, and environment prefix. Compose may recreate containers, but it
must reuse the same environment-local credentials and exact Redis digest.

Repeat deployment is also the recovery path after an interrupted image pull:
the existing app is not stopped until all pinned images have been pulled and
inspected successfully.

## Redis unavailable

For a staging outage drill:

```bash
cd /root/netflix-clone
docker compose stop redis-runtime
docker inspect netflix-redis-runtime --format '{{.State.Status}}'
docker compose start redis-runtime
docker inspect netflix-redis-runtime --format '{{.State.Health.Status}}'
```

During deployment, an unhealthy or wrongly labelled Redis container prevents
promotion and enters the existing rollback block. At runtime, core
PostgreSQL-backed login and read paths report degraded Redis health and use
their feature-defined fallback rather than treating Redis as durable state.

Memory pressure uses bounded LFU eviction rather than persistence or an
unbounded allocation. A running-but-evicting cache is a degraded capacity
signal; it is not permission to bypass PostgreSQL authentication limits.

## Upgrade

1. Select an official Redis 7.2 patch supported by node-redis.
2. Resolve its multi-platform manifest digest and update the exact tag plus
   digest in the manual Compose file, Ansible variable, and contract tests.
3. Run the contract and real integration suites.
4. Deploy staging twice, run the outage drill, and verify memory/ACL identity.
5. Promote the identical digest to production. Never promote a floating
   `7.2`, `alpine`, or `latest` tag.

Redis does not require a backup in this architecture. AOF and RDB are disabled,
`/data` is tmpfs, and every key must be rebuildable or expendable. Back up and
restore PostgreSQL through the existing verified process because it owns all
durable state.

## Rollback and recovery

Before replacement, Ansible preserves the previous Compose definition and
Redis configuration. If Redis readiness, application health, HTTPS, or
monitoring fails, the rescue block captures Redis diagnostics, stops the failed
stack, restores both files, and starts the previous stack. On a first-deploy
failure it removes the newly installed Redis configuration instead of claiming
a rollback succeeded.

For manual recovery, restore the matching previous Compose and
`redis-runtime.conf` files together, ensure the referenced image digest remains
local, then run `docker compose up -d --no-build`. Do not restore Redis data:
restart with an empty cache and verify PostgreSQL-backed paths. Do not delete or
rotate only one credential file; rotation is a coordinated replacement of the
ACL, application URL, and health credential followed by a full staging drill.
