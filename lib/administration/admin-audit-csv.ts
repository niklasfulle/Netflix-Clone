import type { AdminAuditReadEvent } from './admin-audit-reader';

const COLUMNS = [
  'Created At',
  'Actor',
  'Actor ID',
  'Role',
  'Action',
  'Target Type',
  'Target ID',
  'Outcome',
  'Correlation ID',
  'Metadata',
] as const;

function csvCell(value: unknown) {
  let text = '';
  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    text = value.toString();
  } else if (value instanceof Date) {
    text = value.toISOString();
  } else if (value !== null && value !== undefined) {
    text = JSON.stringify(value) ?? '';
  }
  if (/^[=+\-@]/u.test(text)) text = `'${text}`;
  if (/[",\n\r]/u.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function createAdminAuditCsv(events: readonly AdminAuditReadEvent[]) {
  const rows = events.map((event) => [
    event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    event.actorName,
    event.actorUserId,
    event.actorRole,
    event.action,
    event.targetType,
    event.targetId,
    event.outcome,
    event.correlationId,
    event.metadata === null ? '' : JSON.stringify(event.metadata),
  ].map(csvCell).join(','));

  return [COLUMNS.join(','), ...rows].join('\n');
}
