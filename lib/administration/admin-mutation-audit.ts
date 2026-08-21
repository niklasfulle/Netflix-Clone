import type {
  AdminAudit,
  AdminAuditAction,
  AdminAuditMetadata,
  AdminAuditTargetType,
} from './admin-audit';

type AdminMutationAuditDetails = {
  target?: { type: AdminAuditTargetType; id: string };
  metadata?: AdminAuditMetadata;
};

type AdminMutationAuditDependencies = {
  audit: Pick<AdminAudit, 'record' | 'recordAuthorizationDenial'>;
  createCorrelationId(): string;
  reportFailure(details: {
    action: AdminAuditAction;
    outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED';
    correlationId: string;
    errorName: string;
  }): void;
};

export function createAdminMutationAudit(dependencies: AdminMutationAuditDependencies) {
  return {
    begin(action: AdminAuditAction) {
      const correlationId = dependencies.createCorrelationId();
      let completed = false;

      async function complete(
        outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED',
        details: AdminMutationAuditDetails = {},
      ) {
        if (completed) return;
        completed = true;

        try {
          if (outcome === 'DENIED') {
            await dependencies.audit.recordAuthorizationDenial({ action, correlationId });
            return;
          }
          await dependencies.audit.record({
            action,
            ...details,
            outcome,
            correlationId,
          });
        } catch (error) {
          dependencies.reportFailure({
            action,
            outcome,
            correlationId,
            errorName: error instanceof Error ? error.name : typeof error,
          });
        }
      }

      return {
        correlationId,
        async succeeded(details: AdminMutationAuditDetails = {}) {
          await complete('SUCCEEDED', details);
        },
        async denied() {
          await complete('DENIED');
        },
        async failed(details: AdminMutationAuditDetails = {}) {
          await complete('FAILED', details);
        },
      };
    },
  };
}
