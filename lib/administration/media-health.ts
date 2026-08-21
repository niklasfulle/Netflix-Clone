import type {
  MediaFindingCode,
  MediaFindingSeverity,
  MediaResourceKind,
} from './media-integrity-scanner';

export type MediaHealthQuery = {
  severity?: MediaFindingSeverity;
  resourceKind?: MediaResourceKind;
  contentType?: 'Movie' | 'Serie';
  scanStatus?: 'RUNNING' | 'COMPLETED' | 'FAILED';
};

export type MediaHealthScan = {
  id: string;
  scope: 'CATALOG' | 'CONTENT';
  requestedContentId: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt: Date | null;
  contentCount: number;
  findingCount: number;
  criticalCount: number;
  warningCount: number;
};

export type MediaHealthFinding = {
  id: string;
  contentId: string | null;
  contentTitle: string | null;
  contentType: 'Movie' | 'Serie' | null;
  resourceKind: MediaResourceKind;
  severity: MediaFindingSeverity;
  code: MediaFindingCode;
  metadata: Record<string, string | number | boolean | null> | null;
  createdAt: Date;
};

export interface MediaHealthRepository {
  findRunning(): Promise<MediaHealthScan | null>;
  findLatest(status?: MediaHealthQuery['scanStatus']): Promise<MediaHealthScan | null>;
  findFindings(
    scanRunId: string,
    filters: Pick<MediaHealthQuery, 'severity' | 'resourceKind' | 'contentType'>,
  ): Promise<{ findings: MediaHealthFinding[]; total: number }>;
}

type MediaHealthDependencies = {
  repository: MediaHealthRepository;
  checkAvailability(): Promise<boolean>;
  now?: () => Date;
  staleAfterMs?: number;
  runningStaleAfterMs?: number;
};

export function createMediaHealthReader({
  repository,
  checkAvailability,
  now = () => new Date(),
  staleAfterMs = 24 * 60 * 60_000,
  runningStaleAfterMs = 30 * 60_000,
}: MediaHealthDependencies) {
  return {
    async read(query: MediaHealthQuery) {
      const [available, running, lastScan] = await Promise.all([
        checkAvailability(),
        repository.findRunning(),
        repository.findLatest(query.scanStatus),
      ]);
      const findingsResult = lastScan
        ? await repository.findFindings(lastScan.id, {
          severity: query.severity,
          resourceKind: query.resourceKind,
          contentType: query.contentType,
        })
        : { findings: [], total: 0 };
      const checkedAt = now();
      const completedAt = lastScan?.completedAt;
      const stale = !completedAt || checkedAt.getTime() - completedAt.getTime() > staleAfterMs;

      return {
        availability: available ? 'AVAILABLE' as const : 'UNAVAILABLE' as const,
        stale,
        runningScan: running ? {
          ...running,
          stale: checkedAt.getTime() - running.startedAt.getTime() > runningStaleAfterMs,
        } : null,
        lastScan,
        findings: findingsResult.findings,
        total: findingsResult.total,
      };
    },
  };
}

export type MediaHealthReader = ReturnType<typeof createMediaHealthReader>;
