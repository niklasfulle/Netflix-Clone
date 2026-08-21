import { createAdminMutationAudit } from '../admin-mutation-audit';

describe('administrator mutation audit module', () => {
  it('records a successful mutation with one generated correlation identifier', async () => {
    const audit = {
      record: jest.fn().mockResolvedValue({ id: 'event-1' }),
      recordAuthorizationDenial: jest.fn(),
    };
    const mutationAudit = createAdminMutationAudit({
      audit,
      createCorrelationId: () => 'correlation-1',
      reportFailure: jest.fn(),
    });

    const operation = mutationAudit.begin('content.update');
    await operation.succeeded({
      target: { type: 'content', id: 'movie-1' },
      metadata: { changedFields: ['title'] },
    });

    expect(operation.correlationId).toBe('correlation-1');
    expect(audit.record).toHaveBeenCalledWith({
      action: 'content.update',
      target: { type: 'content', id: 'movie-1' },
      outcome: 'SUCCEEDED',
      correlationId: 'correlation-1',
      metadata: { changedFields: ['title'] },
    });
  });

  it('records authorization denials without a target and only accepts the first outcome', async () => {
    const audit = {
      record: jest.fn(),
      recordAuthorizationDenial: jest.fn().mockResolvedValue({ id: 'event-1' }),
    };
    const mutationAudit = createAdminMutationAudit({
      audit,
      createCorrelationId: () => 'correlation-1',
      reportFailure: jest.fn(),
    });

    const operation = mutationAudit.begin('actor.delete');
    await operation.denied();
    await operation.failed({ target: { type: 'actor', id: 'actor-secret' } });

    expect(audit.recordAuthorizationDenial).toHaveBeenCalledWith({
      action: 'actor.delete',
      correlationId: 'correlation-1',
    });
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('reports audit persistence failures without changing the mutation result', async () => {
    const persistenceError = new Error('database unavailable');
    persistenceError.name = 'AdminAuditPersistenceError';
    const audit = {
      record: jest.fn().mockRejectedValue(persistenceError),
      recordAuthorizationDenial: jest.fn(),
    };
    const reportFailure = jest.fn();
    const mutationAudit = createAdminMutationAudit({
      audit,
      createCorrelationId: () => 'correlation-1',
      reportFailure,
    });

    await expect(mutationAudit.begin('backup.restore').failed({
      target: { type: 'backup', id: 'uploaded' },
    })).resolves.toBeUndefined();
    expect(reportFailure).toHaveBeenCalledWith({
      action: 'backup.restore',
      outcome: 'FAILED',
      correlationId: 'correlation-1',
      errorName: 'AdminAuditPersistenceError',
    });
  });
});
