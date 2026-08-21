export const ADMIN_AUDIT_ACTIONS = [
  'content.create',
  'content.update',
  'content.publish',
  'content.archive',
  'content.delete',
  'actor.create',
  'actor.update',
  'actor.merge',
  'actor.delete',
  'user.role_change',
  'user.block',
  'user.unblock',
  'backup.create',
  'backup.restore',
  'backup.verify',
  'media.scan',
  'deployment.manage',
  'security.settings_change',
] as const;

export type AdminAuditAction = typeof ADMIN_AUDIT_ACTIONS[number];
export type AdminAuditOutcome = 'SUCCEEDED' | 'DENIED' | 'FAILED';
export type AdminAuditTargetType =
  | 'content'
  | 'actor'
  | 'user'
  | 'backup'
  | 'media_scan'
  | 'deployment'
  | 'security_settings';

type AuditMetadataValue = string | number | boolean | string[];
export type AdminAuditMetadata = Record<string, AuditMetadataValue>;

export type StoredAdminAuditEvent = {
  id: string;
  actorUserId: string;
  actorRole: 'ADMIN' | 'USER';
  action: AdminAuditAction;
  targetType: AdminAuditTargetType | null;
  targetId: string | null;
  outcome: AdminAuditOutcome;
  correlationId: string | null;
  metadata: AdminAuditMetadata | null;
  createdAt: Date;
};

export interface AdminAuditRepository {
  append(event: StoredAdminAuditEvent): Promise<void>;
  removeBefore(cutoff: Date, limit: number): Promise<number>;
}

export class AdminAuditAuthorizationError extends Error {
  constructor() {
    super('Administrator audit requires an authenticated administrator');
    this.name = 'AdminAuditAuthorizationError';
  }
}

export class AdminAuditPersistenceError extends Error {
  constructor(cause: unknown) {
    super('Administrator audit event could not be persisted', { cause });
    this.name = 'AdminAuditPersistenceError';
  }
}

export class AdminAuditValidationError extends Error {
  constructor(field: string) {
    super(`Administrator audit ${field} is invalid`);
    this.name = 'AdminAuditValidationError';
  }
}

type AdminAuditDependencies = {
  repository: AdminAuditRepository;
  resolveActor(): Promise<{ userId: string; role: 'ADMIN' | 'USER' } | null>;
  now(): Date;
  createId(): string;
};

type AdminAuditCommand = {
  action: AdminAuditAction;
  target?: { type: AdminAuditTargetType; id: string };
  outcome: AdminAuditOutcome;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

type AdminAuditAuthorizationDenialCommand = {
  action: AdminAuditAction;
  correlationId?: string;
};

const METADATA_KEYS: Record<AdminAuditAction, ReadonlySet<string>> = {
  'content.create': new Set(['contentType', 'initialStatus']),
  'content.update': new Set(['changedFields', 'previousStatus', 'nextStatus']),
  'content.publish': new Set(['previousStatus']),
  'content.archive': new Set(['previousStatus']),
  'content.delete': new Set(['contentType', 'previousStatus']),
  'actor.create': new Set(),
  'actor.update': new Set(['changedFields']),
  'actor.merge': new Set(['mergedCount']),
  'actor.delete': new Set(['associatedContentCount']),
  'user.role_change': new Set(['previousRole', 'nextRole']),
  'user.block': new Set(['reasonCode', 'hasExpiry']),
  'user.unblock': new Set(),
  'backup.create': new Set(['source', 'scheduled']),
  'backup.restore': new Set(['verificationStatus']),
  'backup.verify': new Set(['source']),
  'media.scan': new Set(['scope', 'itemCount']),
  'deployment.manage': new Set(['environment', 'version', 'operation']),
  'security.settings_change': new Set(['changedFields']),
};

const RETENTION_MS = 365 * 24 * 60 * 60_000;
const RETENTION_BATCH_SIZE = 100;
const MAX_IDENTIFIER_LENGTH = 191;
const MAX_CORRELATION_ID_LENGTH = 128;
const MAX_METADATA_STRING_LENGTH = 200;
const MAX_METADATA_ARRAY_ITEMS = 20;
const MAX_METADATA_ARRAY_VALUE_LENGTH = 64;

function boundedText(value: string, maximumLength: number): string {
  return Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, maximumLength);
}

function validatedTarget(target: AdminAuditCommand['target']) {
  if (!target) return null;
  const id = boundedText(target.id, MAX_IDENTIFIER_LENGTH);
  if (!id) throw new AdminAuditValidationError('target ID');
  return { id, type: target.type };
}

function safeMetadataValue(value: unknown): AuditMetadataValue | undefined {
  if (typeof value === 'string') {
    const safeValue = boundedText(value, MAX_METADATA_STRING_LENGTH);
    return safeValue || undefined;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    return undefined;
  }

  const safeValues = value
    .slice(0, MAX_METADATA_ARRAY_ITEMS)
    .map((entry) => boundedText(entry, MAX_METADATA_ARRAY_VALUE_LENGTH))
    .filter(Boolean);
  return safeValues.length > 0 ? safeValues : undefined;
}

function safeMetadata(
  action: AdminAuditAction,
  metadata: Record<string, unknown> | undefined,
): AdminAuditMetadata | null {
  if (!metadata) return null;

  const allowedKeys = METADATA_KEYS[action];
  const safeEntries = Object.entries(metadata).flatMap(([key, value]) => {
    if (!allowedKeys.has(key)) return [];
    const safeValue = safeMetadataValue(value);
    return safeValue === undefined ? [] : [[key, safeValue] as const];
  });
  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : null;
}

export function createAdminAudit(dependencies: AdminAuditDependencies) {
  return {
    async record(command: AdminAuditCommand): Promise<{ id: string }> {
      const actor = await dependencies.resolveActor();
      if (actor?.role !== 'ADMIN') {
        throw new AdminAuditAuthorizationError();
      }

      const actorUserId = boundedText(actor.userId, MAX_IDENTIFIER_LENGTH);
      if (!actorUserId) throw new AdminAuditAuthorizationError();

      const id = boundedText(dependencies.createId(), MAX_IDENTIFIER_LENGTH);
      if (!id) throw new AdminAuditValidationError('event ID');

      const target = validatedTarget(command.target);

      try {
        await dependencies.repository.append({
          id,
          actorUserId,
          actorRole: 'ADMIN',
          action: command.action,
          targetType: target?.type ?? null,
          targetId: target?.id ?? null,
          outcome: command.outcome,
          correlationId: command.correlationId
            ? boundedText(command.correlationId, MAX_CORRELATION_ID_LENGTH) || null
            : null,
          metadata: safeMetadata(command.action, command.metadata),
          createdAt: dependencies.now(),
        });
      } catch (error) {
        throw new AdminAuditPersistenceError(error);
      }
      return { id };
    },

    async recordAuthorizationDenial(
      command: AdminAuditAuthorizationDenialCommand,
    ): Promise<{ id: string }> {
      const actor = await dependencies.resolveActor();
      if (!actor) throw new AdminAuditAuthorizationError();

      const actorUserId = boundedText(actor.userId, MAX_IDENTIFIER_LENGTH);
      if (!actorUserId) throw new AdminAuditAuthorizationError();

      const id = boundedText(dependencies.createId(), MAX_IDENTIFIER_LENGTH);
      if (!id) throw new AdminAuditValidationError('event ID');

      try {
        await dependencies.repository.append({
          id,
          actorUserId,
          actorRole: actor.role,
          action: command.action,
          targetType: null,
          targetId: null,
          outcome: 'DENIED',
          correlationId: command.correlationId
            ? boundedText(command.correlationId, MAX_CORRELATION_ID_LENGTH) || null
            : null,
          metadata: null,
          createdAt: dependencies.now(),
        });
      } catch (error) {
        throw new AdminAuditPersistenceError(error);
      }
      return { id };
    },

    async maintainRetention(): Promise<{ removed: number }> {
      const cutoff = new Date(dependencies.now().getTime() - RETENTION_MS);
      try {
        const removed = await dependencies.repository.removeBefore(
          cutoff,
          RETENTION_BATCH_SIZE,
        );
        return { removed };
      } catch (error) {
        throw new AdminAuditPersistenceError(error);
      }
    },
  };
}

export type AdminAudit = ReturnType<typeof createAdminAudit>;
