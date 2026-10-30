# Background job failures

In Administration → Jobs, failed operations show a diagnostic and correlation ID.
**Open logs** opens the application logs with that ID as the search filter.
Every new failed attempt writes a `background_job_failed` entry to both the shared
application log and worker output. Entries include the job ID, queue ID, job type,
attempt count, and terminal status. Raw error messages and job payloads are not
copied into these log entries.

If the shared log volume cannot be written, the worker output remains available:

```sh
docker logs --since 2h netflix-jobs-worker
```

For scheduled backups, inspect the host runner separately:

```sh
systemctl status netflix-postgres-backup.path netflix-postgres-backup.service
journalctl -u netflix-postgres-backup.service --since '2 hours ago'
```

`INVALID_LEASE_TTL` on older failed backup jobs identifies the previous 30-minute
lease configuration, which exceeded the coordinator's 15-minute maximum. The
worker now starts with a 15-minute lease and renews it throughout execution, so
longer backups remain supported. Deploy the updated worker and retry the failed
job through Administration → Jobs. Existing failure history is preserved; it is
not automatically retried or rewritten. No database migration is required.

## Host runner fails with 203/EXEC

`BACKUP_POLL_TIMEOUT` followed by `ScheduledBackupBusyError` can mean that the
host never consumed the request. Inspect the systemd journal before retrying.
If `203/EXEC` reports “No such file or directory” although the runner exists,
check its interpreter line:

```sh
head -n 1 /usr/local/lib/netflix-deploy/run-postgres-backup.sh | od -An -tx1
```

The line must end in `0a`, not `0d 0a`. A CRLF shebang makes Linux look for
`/bin/bash\r`. Repeated startup failures also disable the path watcher with
`unit-start-limit-hit`, leaving the request pending.

Version 1.14.4 normalizes all installed backup helpers before enabling watchers
and resets failed backup units. To repair an existing installation immediately:

```sh
sed -i 's/\r$//' /usr/local/lib/netflix-deploy/{backup-postgres.sh,verify-postgres-backup.sh,run-postgres-backup.sh,run-postgres-backup-verification.sh,run-postgres-backup-retention.sh,manage-postgres-backups.py}
systemctl reset-failed netflix-postgres-backup.service netflix-postgres-backup.path
systemctl restart netflix-postgres-backup.path
journalctl -u netflix-postgres-backup.service -n 40 --no-pager
```

Run these commands in Bash as root. The existing request is retained and should
be picked up by the restarted watcher. Do not delete it to clear the busy error.
Confirm a verified backup before retrying any dead-letter job in Administration.

## Host runner reports an invalid deployment environment

If the journal reports `DEPLOYMENT_ENVIRONMENT must be staging or production`,
the runner starts but exits before consuming the pending request. Version 1.14.4
sets `DEPLOYMENT_ENVIRONMENT` directly from Ansible's validated
`deployment_environment` for backup creation and retention. Host services no
longer load the app environment file; the backup runner still passes that file
directly to its database container for database access.

On an existing production host, apply this temporary override before restarting
the watcher (use `staging` instead for a staging host):

```sh
mkdir -p /etc/systemd/system/netflix-postgres-backup.service.d
printf '[Service]\nEnvironmentFile=\nEnvironment=DEPLOYMENT_ENVIRONMENT=production\n' > /etc/systemd/system/netflix-postgres-backup.service.d/deployment-environment.conf
systemctl daemon-reload
systemctl reset-failed netflix-postgres-backup.service netflix-postgres-backup.path
systemctl restart netflix-postgres-backup.path
journalctl -u netflix-postgres-backup.service -n 30 --no-pager
```

The request stays in place and is consumed by the runner after the watcher
restarts. Remove this temporary override after deploying the corrected unit,
then run `systemctl daemon-reload` so future environment changes use the managed
configuration.
