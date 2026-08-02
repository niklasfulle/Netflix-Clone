# 0001: Production migrations and deployment rollback

- Status: Accepted
- Date: 2026-08-01

## Context

Production deployments can include database schema changes. Starting the new
application before those changes are applied causes runtime failures, while
using `prisma db push` can attempt unsafe changes and does not provide a
versioned deployment history. A failed application rollout must also leave a
recoverable service and database state.

## Decision

Production deployments use committed Prisma migrations and execute
`prisma migrate deploy` before the new application is made available.

The Ansible deployment creates and verifies a database backup before applying
migrations. Migration, container startup, and health verification run in a
single guarded deployment block. If one of those steps fails, the deployment
restores the previously running image and retains diagnostics. Database backup
restoration remains the recovery boundary for schema or data changes that
cannot safely be reversed automatically. Old images are pruned only after a
successful health check.

## Consequences

- Every production schema change requires a committed Prisma migration.
- Deployments stop before serving the new release when migration fails.
- Application rollback is automatic, but destructive or incompatible database
  changes may require restoring the verified backup.
- Backup storage, retention, and restore procedures are operational
  dependencies and must be tested regularly.

