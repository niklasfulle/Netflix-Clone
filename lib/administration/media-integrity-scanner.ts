export type MediaResourceKind = 'VIDEO' | 'THUMBNAIL';

export type MediaFindingSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export const MEDIA_FINDING_CODES = [
  'RESOURCE_INSPECTION_FAILED',
  'DUPLICATE_VIDEO_REFERENCE',
  'DUPLICATE_THUMBNAIL_REFERENCE',
  'VIDEO_REFERENCE_UNSAFE',
  'VIDEO_MISSING',
  'VIDEO_UNREADABLE',
  'VIDEO_EMPTY',
  'VIDEO_UNSUPPORTED_TYPE',
  'VIDEO_PROBE_INVALID',
  'VIDEO_PROBE_TIMEOUT',
  'VIDEO_PROBE_FAILED',
  'VIDEO_INSPECTION_FAILED',
  'VIDEO_NO_VIDEO_STREAM',
  'VIDEO_NO_AUDIO_STREAM',
  'VIDEO_CODEC_UNSUPPORTED',
  'AUDIO_CODEC_UNSUPPORTED',
  'VIDEO_CONTAINER_UNKNOWN',
  'VIDEO_DURATION_MISMATCH',
  'THUMBNAIL_REFERENCE_UNSAFE',
  'THUMBNAIL_MISSING',
  'THUMBNAIL_UNREADABLE',
  'THUMBNAIL_EMPTY',
  'THUMBNAIL_TOO_LARGE',
  'THUMBNAIL_UNSUPPORTED_TYPE',
  'THUMBNAIL_INVALID',
  'THUMBNAIL_EXTERNAL_NOT_INSPECTED',
  'THUMBNAIL_INSPECTION_FAILED',
  'ORPHAN_VIDEO_RESOURCE',
  'ORPHAN_SCAN_FAILED',
] as const;

export type MediaFindingCode = typeof MEDIA_FINDING_CODES[number];

export class MediaScanAlreadyRunningError extends Error {
  constructor(readonly scope: 'CATALOG' | 'CONTENT') {
    super('A matching media scan is already running');
    this.name = 'MediaScanAlreadyRunningError';
  }
}

export type MediaFinding = {
  contentId: string | null;
  resourceKind: MediaResourceKind;
  severity: MediaFindingSeverity;
  code: MediaFindingCode;
  metadata?: Record<string, string | number | boolean | null>;
};

export type MediaCatalogItem = {
  id: string;
  type: 'Movie' | 'Serie';
  videoReference: string;
  thumbnailReference: string;
  expectedDurationSeconds: number | null;
};

export type MediaScanResult = {
  id: string;
  scope: 'CATALOG' | 'CONTENT';
  requestedContentId: string | null;
  status: 'COMPLETED';
  startedAt: Date;
  completedAt: Date;
  contentCount: number;
  findingCount: number;
  criticalCount: number;
  warningCount: number;
  findings: MediaFinding[];
};

export type MediaScanRunRepository = {
  start(input: {
    scope: 'CATALOG' | 'CONTENT';
    requestedContentId: string | null;
    startedAt: Date;
  }): Promise<{ id: string }>;
  complete(runId: string, result: Omit<MediaScanResult, 'id'>): Promise<void>;
  fail(runId: string, completedAt: Date): Promise<void>;
};

type ScannerDependencies = {
  catalog: {
    listPublished(contentId?: string): Promise<MediaCatalogItem[]>;
  };
  inspector: {
    inspect(item: MediaCatalogItem): Promise<MediaFinding[]>;
    findOrphans?(items: MediaCatalogItem[]): Promise<MediaFinding[]>;
  };
  runs: MediaScanRunRepository;
  now?: () => Date;
  inspectionConcurrency?: number;
};

function normalizeReference(reference: string): string {
  return reference.trim().replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase();
}

function duplicateFindings(items: MediaCatalogItem[]): MediaFinding[] {
  const findings: MediaFinding[] = [];

  const definitions: Array<{
    key: 'videoReference' | 'thumbnailReference';
    resourceKind: MediaResourceKind;
    code: MediaFindingCode;
  }> = [
    { key: 'videoReference' as const, resourceKind: 'VIDEO' as const, code: 'DUPLICATE_VIDEO_REFERENCE' },
    { key: 'thumbnailReference' as const, resourceKind: 'THUMBNAIL' as const, code: 'DUPLICATE_THUMBNAIL_REFERENCE' },
  ];
  for (const definition of definitions) {
    const groups = new Map<string, MediaCatalogItem[]>();
    for (const item of items) {
      const normalized = normalizeReference(item[definition.key]);
      if (!normalized) continue;
      const group = groups.get(normalized) ?? [];
      group.push(item);
      groups.set(normalized, group);
    }

    for (const group of groups.values()) {
      if (group.length < 2) continue;
      for (const item of group.slice(1)) {
        findings.push({
          contentId: item.id,
          resourceKind: definition.resourceKind,
          severity: 'WARNING',
          code: definition.code,
          metadata: { duplicateCount: group.length },
        });
      }
    }
  }

  return findings;
}

async function inspectItems(
  items: MediaCatalogItem[],
  inspector: ScannerDependencies['inspector'],
  requestedConcurrency: number,
): Promise<MediaFinding[][]> {
  const results: MediaFinding[][] = Array.from({ length: items.length });
  let nextIndex = 0;
  const concurrency = Math.min(Math.max(Math.trunc(requestedConcurrency) || 1, 1), 8, items.length || 1);

  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      try {
        results[index] = await inspector.inspect(item);
      } catch {
        results[index] = [{
          contentId: item.id,
          resourceKind: 'VIDEO',
          severity: 'WARNING',
          code: 'RESOURCE_INSPECTION_FAILED',
        }];
      }
    }
  }));

  return results;
}

export function createMediaIntegrityScanner({
  catalog,
  inspector,
  runs,
  now = () => new Date(),
  inspectionConcurrency = 4,
}: ScannerDependencies) {
  return {
    async scan({ contentId }: { contentId?: string } = {}): Promise<MediaScanResult> {
      const startedAt = now();
      const scope: MediaScanResult['scope'] = contentId ? 'CONTENT' : 'CATALOG';
      const requestedContentId = contentId ?? null;
      const run = await runs.start({ scope, requestedContentId, startedAt });

      try {
        const items = await catalog.listPublished(contentId);
        const inspected = await inspectItems(items, inspector, inspectionConcurrency);
        const findings = [...duplicateFindings(items), ...inspected.flat()];

        if (!contentId && inspector.findOrphans) {
          findings.push(...await inspector.findOrphans(items));
        }

        const completedAt = now();
        const result = {
          scope,
          requestedContentId,
          status: 'COMPLETED' as const,
          startedAt,
          completedAt,
          contentCount: items.length,
          findingCount: findings.length,
          criticalCount: findings.filter(({ severity }) => severity === 'CRITICAL').length,
          warningCount: findings.filter(({ severity }) => severity === 'WARNING').length,
          findings,
        };

        await runs.complete(run.id, result);
        return { id: run.id, ...result };
      } catch (error) {
        await runs.fail(run.id, now());
        throw error;
      }
    },
  };
}
