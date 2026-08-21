# PostgreSQL backup verification

Netflix Clone treats a PostgreSQL dump as recoverable only after it has been
restored successfully into a disposable PostgreSQL instance and the restored
schema has passed representative checks.

## Backup types

- `.nfbak` is the encrypted, application-level export available in the admin
  area. It is intended for manual application-data transfer.
- `.dump` is the PostgreSQL custom-format artifact created on the LXC host before
  a deployment migration or by the host-owned schedule. This is the artifact
  covered by isolated restore verification.

The deployment dumps remain below `/root/netflix-database-backups`. They are
never mounted into the application container.

## Verification flow

1. `backup-postgres.sh` writes the dump to a temporary artifact, validates its
   archive list, and publishes it atomically.
2. `run-postgres-backup-verification.sh` obtains the host lock
   `/run/lock/netflix-backup-verification.lock` and validates that the selected
   file is a regular, non-symlinked `.dump` directly below the dedicated backup
   directory.
3. The runner mounts the backup directory read-only into `postgres:18-alpine`.
   The container has no network, is read-only, and receives a bounded `/tmp`
   filesystem for its disposable database.
4. `verify-postgres-backup.sh` validates the custom archive, checksum, source and
   tool versions, initializes a local PostgreSQL server with
   `listen_addresses=''`, restores into a newly created database, and checks the
   Prisma migration table plus representative `User` and `Movie` tables.
5. Temporary data and sockets are removed after success, failure, timeout, or
   interruption. The source dump is never deleted or modified.
6. A bounded status file is published atomically under
   `/var/lib/netflix-backup-status/verification/latest.json`.

Before migrations, Ansible runs this complete flow synchronously. A failed
restore check stops the deployment before the schema or application container is
changed and therefore enters the existing rollback-safe failure path.

## Manual verification

Administrators can select **Verify Latest PostgreSQL Backup** on
`/admin/backups`. The application writes only a versioned request marker to the
mounted backup-status directory. `netflix-backup-verification.path` notices the
marker and starts the privileged host service. The browser and application
container never receive Docker access or a database URL.

The host can start the same request manually:

```bash
systemctl start netflix-backup-verification.service
systemctl status netflix-backup-verification.service
journalctl -u netflix-backup-verification.service --since today
```

## Result contract

The admin area distinguishes these results:

| Result | Meaning |
| --- | --- |
| `VERIFIED` | Archive, restore, schema, and representative checks succeeded |
| `CORRUPT` | The artifact is not a readable PostgreSQL custom archive |
| `TRUNCATED` | The archive is incomplete or ended unexpectedly |
| `INCOMPATIBLE` | The dump/archive version is newer than the restore tooling |
| `TIMEOUT` | Restore exceeded its configured time budget |
| `FAILED` | Restore infrastructure or schema checks failed |
| `INTERRUPTED` | The verifier received an interruption signal and cleaned up |
| `BUSY` | Another verification currently owns the bounded host lock |

Status metadata contains the filename, format, size, SHA-256 checksum,
PostgreSQL versions, timestamps, stable diagnostic code, and bounded counts.
Raw PostgreSQL output, database URLs, credentials, environment values, SQL data,
and backup contents are never included.

Only the most recent bounded verification result is retained; a new result
atomically replaces `latest.json`. Verification never deletes PostgreSQL dump
artifacts. Their retention remains a separate host backup policy, so result
retention cannot accidentally remove recovery data.

## Automatic schedule and retention

Ansible provisions `netflix-postgres-backup.service` and
`netflix-postgres-backup.timer` on staging and production. The default calendar
is 03:15 Europe/Berlin with a bounded randomized delay. `Persistent=true` means
systemd catches up one missed run after a powered-off host returns; overlapping
catch-up and deployment runs are serialized through
`/run/lock/netflix-postgres-backup.lock`.

Each scheduled run:

1. creates `scheduled-<environment>-<UTC timestamp>.dump` through PostgreSQL 18
   client tooling and the same atomic temporary-file publisher used by deploys;
2. creates the SHA-256 sidecar through a temporary file;
3. performs the isolated network-free restore verification;
4. publishes bounded state at
   `/var/lib/netflix-backup-status/scheduled/latest.json`; and
5. applies daily, weekly, and monthly retention only after verification.

The newest verified artifact and the configured minimum copy count are always
protected. Cleanup accepts only regular, non-symlinked scheduled filenames
directly below `/root/netflix-database-backups`; it never follows a path, broad
glob, or directory deletion. Staging and production filenames, databases,
status, and policies remain environment-bound.

Policy defaults are declared at the top of `update-netflix-clone.yml`:

- `postgres_backup_schedule` and `postgres_backup_timezone`;
- dump, service, and lock timeouts;
- `postgres_backup_minimum_copies`;
- daily days, weekly weeks, and monthly months.

Inspect or trigger the schedule on a target host:

```bash
systemctl list-timers netflix-postgres-backup.timer
systemctl start netflix-postgres-backup.service
systemctl status netflix-postgres-backup.service
journalctl -u netflix-postgres-backup.service --since today
```

A lock timeout, dump timeout, dump failure, restore failure, or storage-full
write leaves a non-healthy stable diagnostic code in both the backup admin area
and deployment overview. A partial dump is left unpublished by the helper and
is never selected as verified recovery evidence.

## Compatibility and recovery drills

The PostgreSQL verifier image major version must be at least as new as both the
source server and `pg_dump` major versions recorded in the archive. The current
deployment uses PostgreSQL 18 tooling and accepts valid older custom archives.

A green status proves that the archive can be restored in isolation; it does not
authorize an automatic restore over staging or production. A real recovery must
use a separately selected target, preserve the failed database, verify the dump
again, restore with matching-or-newer tooling, run application health checks,
and record the recovery evidence. Periodic human recovery drills belong to the
1.12 release checklist.

At least quarterly, copy one retained verified dump to an isolated recovery
host, verify its checksum, run the isolated verifier, start the application
against the restored database, and record migration plus health results. Never
practice by overwriting the live staging or production database.
