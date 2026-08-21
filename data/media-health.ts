import { Prisma } from '@prisma/client';

import type {
  MediaHealthFinding,
  MediaHealthQuery,
  MediaHealthRepository,
  MediaHealthScan,
} from '@/lib/administration/media-health';
import {
  MEDIA_FINDING_CODES,
  type MediaFindingCode,
  type MediaFindingSeverity,
  type MediaResourceKind,
} from '@/lib/administration/media-integrity-scanner';
import { db } from '@/lib/db';

const FINDING_LIMIT = 200;
const FINDING_CODES = new Set<string>(MEDIA_FINDING_CODES);
const SEVERITIES = new Set<string>(['INFO', 'WARNING', 'CRITICAL']);
const RESOURCE_KINDS = new Set<string>(['VIDEO', 'THUMBNAIL']);

const scanSelect = {
  id: true,
  scope: true,
  requestedContentId: true,
  status: true,
  startedAt: true,
  completedAt: true,
  contentCount: true,
  findingCount: true,
  criticalCount: true,
  warningCount: true,
} as const;

type RawScan = {
  id: string;
  scope: string;
  requestedContentId: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  contentCount: number;
  findingCount: number;
  criticalCount: number;
  warningCount: number;
};

function scanRecord(record: RawScan | null): MediaHealthScan | null {
  if (!record) return null;
  const scope = record.scope === 'CONTENT' ? 'CONTENT' : 'CATALOG';
  const status = record.status === 'RUNNING' || record.status === 'FAILED' ? record.status : 'COMPLETED';
  return { ...record, scope, status };
}

type RawFinding = {
  id: string;
  contentId: string | null;
  contentTitle: string | null;
  contentType: string | null;
  resourceKind: string;
  severity: string;
  code: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

function safeMetadata(value: Prisma.JsonValue | null): MediaHealthFinding['metadata'] {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const entries = Object.entries(value).filter((entry): entry is [string, string | number | boolean | null] => {
    const item = entry[1];
    return item === null || ['string', 'number', 'boolean'].includes(typeof item);
  });
  return Object.fromEntries(entries);
}

function findingRecord(record: RawFinding): MediaHealthFinding | null {
  if (!FINDING_CODES.has(record.code) || !SEVERITIES.has(record.severity) || !RESOURCE_KINDS.has(record.resourceKind)) {
    return null;
  }
  return {
    ...record,
    contentType: record.contentType === 'Movie' || record.contentType === 'Serie' ? record.contentType : null,
    resourceKind: record.resourceKind as MediaResourceKind,
    severity: record.severity as MediaFindingSeverity,
    code: record.code as MediaFindingCode,
    metadata: safeMetadata(record.metadata),
  };
}

function findingConditions(
  scanRunId: string,
  filters: Pick<MediaHealthQuery, 'severity' | 'resourceKind' | 'contentType'>,
) {
  const conditions = [Prisma.sql`finding."scanRunId" = ${scanRunId}`];
  if (filters.severity) conditions.push(Prisma.sql`finding."severity" = ${filters.severity}`);
  if (filters.resourceKind) conditions.push(Prisma.sql`finding."resourceKind" = ${filters.resourceKind}`);
  if (filters.contentType) conditions.push(Prisma.sql`content."type" = ${filters.contentType}`);
  return Prisma.join(conditions, ' AND ');
}

export const mediaHealthRepository: MediaHealthRepository = {
  async findRunning() {
    return scanRecord(await db.mediaIntegrityScanRun.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { startedAt: 'desc' },
      select: scanSelect,
    }));
  },

  async findLatest(status) {
    return scanRecord(await db.mediaIntegrityScanRun.findFirst({
      where: status ? { status } : { status: { in: ['COMPLETED', 'FAILED'] } },
      orderBy: { startedAt: 'desc' },
      select: scanSelect,
    }));
  },

  async findFindings(scanRunId, filters) {
    const conditions = findingConditions(scanRunId, filters);
    const [rows, countRows] = await Promise.all([
      db.$queryRaw<RawFinding[]>(Prisma.sql`
        SELECT
          finding."id",
          finding."contentId",
          content."title" AS "contentTitle",
          content."type" AS "contentType",
          finding."resourceKind",
          finding."severity",
          finding."code",
          finding."metadata",
          finding."createdAt"
        FROM "MediaIntegrityFinding" AS finding
        LEFT JOIN "Movie" AS content ON content."id" = finding."contentId"
        WHERE ${conditions}
        ORDER BY
          CASE finding."severity"
            WHEN 'CRITICAL' THEN 1
            WHEN 'WARNING' THEN 2
            ELSE 3
          END,
          finding."createdAt" DESC
        LIMIT ${FINDING_LIMIT}
      `),
      db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "MediaIntegrityFinding" AS finding
        LEFT JOIN "Movie" AS content ON content."id" = finding."contentId"
        WHERE ${conditions}
      `),
    ]);
    return {
      findings: rows.flatMap((row) => {
        const finding = findingRecord(row);
        return finding ? [finding] : [];
      }),
      total: Number(countRows[0]?.count ?? 0),
    };
  },
};
