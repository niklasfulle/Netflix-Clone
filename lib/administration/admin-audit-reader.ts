import {
  ADMIN_AUDIT_ACTIONS,
  type AdminAuditAction,
  type AdminAuditOutcome,
  type AdminAuditTargetType,
  type StoredAdminAuditEvent,
} from './admin-audit';

export type AdminAuditReadEvent = StoredAdminAuditEvent & {
  actorName: string | null;
};

export type AdminAuditSearchQuery = {
  page: number;
  pageSize: number;
  actor?: string;
  action?: AdminAuditAction;
  targetType?: AdminAuditTargetType;
  outcome?: AdminAuditOutcome;
  from?: Date;
  to?: Date;
};

export interface AdminAuditReadRepository {
  search(query: AdminAuditSearchQuery): Promise<{
    events: AdminAuditReadEvent[];
    total: number;
  }>;
}

type AdminAuditSearchInput = Partial<Record<
  'page' | 'pageSize' | 'actor' | 'action' | 'targetType' | 'outcome' | 'from' | 'to',
  unknown
>>;

type AdminAuditReadDependencies = {
  repository: AdminAuditReadRepository;
  resolveActor(): Promise<{ userId: string; role: 'ADMIN' | 'USER' } | null>;
};

const TARGET_TYPES = new Set<AdminAuditTargetType>([
  'content',
  'actor',
  'user',
  'backup',
  'media_scan',
  'deployment',
  'security_settings',
]);
const OUTCOMES = new Set<AdminAuditOutcome>(['SUCCEEDED', 'DENIED', 'FAILED']);
const ACTIONS = new Set<AdminAuditAction>(ADMIN_AUDIT_ACTIONS);

export class AdminAuditReadAuthorizationError extends Error {
  constructor() {
    super('Administrator access is required to read audit events');
    this.name = 'AdminAuditReadAuthorizationError';
  }
}

function boundedInteger(value: unknown, fallback: number, maximum: number) {
  let parsed = Number.NaN;
  if (typeof value === 'number') parsed = value;
  if (typeof value === 'string') parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.trunc(parsed), 1), maximum)
    : fallback;
}

function boundedText(value: unknown, maximumLength: number) {
  if (typeof value !== 'string') return undefined;
  const text = Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, maximumLength);
  return text || undefined;
}

function dateValue(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function enumValue<T extends string>(value: unknown, allowed: ReadonlySet<T>) {
  return typeof value === 'string' && allowed.has(value as T) ? value as T : undefined;
}

function normalizeSearch(input: AdminAuditSearchInput): AdminAuditSearchQuery {
  return {
    page: boundedInteger(input.page, 1, 100_000),
    pageSize: boundedInteger(input.pageSize, 20, 100),
    actor: boundedText(input.actor, 191),
    action: enumValue(input.action, ACTIONS),
    targetType: enumValue(input.targetType, TARGET_TYPES),
    outcome: enumValue(input.outcome, OUTCOMES),
    from: dateValue(input.from),
    to: dateValue(input.to),
  };
}

export function createAdminAuditReader(dependencies: AdminAuditReadDependencies) {
  return {
    async search(input: AdminAuditSearchInput) {
      const actor = await dependencies.resolveActor();
      if (actor?.role !== 'ADMIN') {
        throw new AdminAuditReadAuthorizationError();
      }

      const query = normalizeSearch(input);
      const result = await dependencies.repository.search(query);
      return {
        ...result,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      };
    },
  };
}

export type AdminAuditReader = ReturnType<typeof createAdminAuditReader>;
