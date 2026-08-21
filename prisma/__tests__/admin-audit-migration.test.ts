/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('administrator audit migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const auditModel = schema.match(/model AdminAuditEvent \{[\s\S]*?\n\}/)?.[0] ?? '';
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260814100000_add_admin_audit_events',
    'migration.sql',
  );

  it('defines an append-only audit record without cascading actor deletion', () => {
    expect(auditModel).toContain('model AdminAuditEvent');
    expect(auditModel).toMatch(/actorUserId\s+String/);
    expect(auditModel).toMatch(/actorRole\s+String/);
    expect(auditModel).toMatch(/action\s+String/);
    expect(auditModel).toMatch(/outcome\s+String/);
    expect(auditModel).toMatch(/metadata\s+Json\?/);
    expect(auditModel).not.toContain('@relation');
  });

  it('creates indexes for retention, actor, action, outcome, and target queries', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('CREATE TABLE "AdminAuditEvent"');
    expect(migration).toContain('"metadata" JSONB');
    expect(migration).toContain('CREATE INDEX "AdminAuditEvent_createdAt_idx"');
    expect(migration).toContain('CREATE INDEX "AdminAuditEvent_actorUserId_createdAt_idx"');
    expect(migration).toContain('CREATE INDEX "AdminAuditEvent_action_outcome_createdAt_idx"');
    expect(migration).toContain('CREATE INDEX "AdminAuditEvent_targetType_targetId_createdAt_idx"');
    expect(migration).not.toContain('FOREIGN KEY ("actorUserId")');
  });

  it('prevents updates while retaining bounded deletion support', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('CREATE FUNCTION "prevent_admin_audit_event_update"()');
    expect(migration).toContain('CREATE TRIGGER "AdminAuditEvent_prevent_update"');
    expect(migration).toContain('BEFORE UPDATE ON "AdminAuditEvent"');
    expect(migration).not.toContain('BEFORE DELETE ON "AdminAuditEvent"');
  });
});
