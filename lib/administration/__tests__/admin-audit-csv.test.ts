import { createAdminAuditCsv } from '../admin-audit-csv';

describe('administrator audit CSV export', () => {
  it('exports stable columns while neutralizing spreadsheet formulas and quoting values', () => {
    const csv = createAdminAuditCsv([{
      id: 'event-1',
      actorUserId: 'admin-1',
      actorName: '=HYPERLINK("unsafe")',
      actorRole: 'ADMIN',
      action: 'content.publish',
      targetType: 'content',
      targetId: 'movie,1',
      outcome: 'SUCCEEDED',
      correlationId: 'correlation-1',
      metadata: { changedFields: ['status'] },
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
    }]);

    expect(csv).toContain('Created At,Actor,Actor ID,Role,Action,Target Type,Target ID,Outcome,Correlation ID,Metadata');
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('"movie,1"');
    expect(csv).toContain('2026-08-14T10:00:00.000Z');
    expect(csv).not.toContain('\r');
  });
});
