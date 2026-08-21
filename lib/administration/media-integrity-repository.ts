import type {
  MediaFinding,
  MediaScanResult,
  MediaScanRunRepository,
} from './media-integrity-scanner';
import { MediaScanAlreadyRunningError } from './media-integrity-scanner';

type ScanRunCreateInput = Parameters<MediaScanRunRepository['start']>[0];
type ScanCompletion = Omit<MediaScanResult, 'id'>;

type ScanRunOperations = {
  create(args: {
    data: ScanRunCreateInput & { status: 'RUNNING'; lockKey: string };
    select: { id: true };
  }): Promise<{ id: string }>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  updateMany(args: {
    where: {
      lockKey: string;
      status: 'RUNNING';
      startedAt: { lt: Date };
    };
    data: { status: 'FAILED'; completedAt: Date };
  }): Promise<unknown>;
  findMany(args: {
    where: { status: { in: Array<'COMPLETED' | 'FAILED'> } };
    orderBy: { startedAt: 'desc' };
    skip: number;
    take: number;
    select: { id: true };
  }): Promise<Array<{ id: string }>>;
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<unknown>;
};

type FindingOperations = {
  deleteMany(args: { where: { scanRunId: string } }): Promise<unknown>;
  createMany(args: {
    data: Array<Omit<MediaFinding, 'metadata'> & {
      scanRunId: string;
      metadata: MediaFinding['metadata'] | null;
    }>;
  }): Promise<unknown>;
};

type Transaction = {
  mediaIntegrityScanRun: ScanRunOperations;
  mediaIntegrityFinding: FindingOperations;
};

export type MediaScanDatabase = {
  mediaIntegrityScanRun: Pick<ScanRunOperations, 'update'>;
  $transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
};

type RepositoryOptions = {
  retainedRuns?: number;
  cleanupBatchSize?: number;
};

function findingData(scanRunId: string, finding: MediaFinding) {
  return {
    scanRunId,
    contentId: finding.contentId,
    resourceKind: finding.resourceKind,
    severity: finding.severity,
    code: finding.code,
    metadata: finding.metadata ?? null,
  };
}

export function createPrismaMediaScanRunRepository(
  database: MediaScanDatabase,
  { retainedRuns = 25, cleanupBatchSize = 100 }: RepositoryOptions = {},
): MediaScanRunRepository {
  return {
    async start(input) {
      const lockKey = input.scope === 'CATALOG'
        ? 'CATALOG'
        : `CONTENT:${input.requestedContentId}`;
      const staleBefore = new Date(input.startedAt.getTime() - 30 * 60_000);
      try {
        return await database.$transaction(async (transaction) => {
          await transaction.mediaIntegrityScanRun.updateMany({
            where: { lockKey, status: 'RUNNING', startedAt: { lt: staleBefore } },
            data: { status: 'FAILED', completedAt: input.startedAt },
          });
          return transaction.mediaIntegrityScanRun.create({
            data: { ...input, status: 'RUNNING', lockKey },
            select: { id: true },
          });
        });
      } catch (error) {
        if ((error as { code?: unknown }).code === 'P2002') {
          throw new MediaScanAlreadyRunningError(input.scope);
        }
        throw error;
      }
    },

    async complete(scanRunId: string, result: ScanCompletion) {
      await database.$transaction(async (transaction) => {
        await transaction.mediaIntegrityFinding.deleteMany({ where: { scanRunId } });
        if (result.findings.length > 0) {
          await transaction.mediaIntegrityFinding.createMany({
            data: result.findings.map((entry) => findingData(scanRunId, entry)),
          });
        }
        await transaction.mediaIntegrityScanRun.update({
          where: { id: scanRunId },
          data: {
            status: result.status,
            completedAt: result.completedAt,
            contentCount: result.contentCount,
            findingCount: result.findingCount,
            criticalCount: result.criticalCount,
            warningCount: result.warningCount,
          },
        });

        const expired = await transaction.mediaIntegrityScanRun.findMany({
          where: { status: { in: ['COMPLETED', 'FAILED'] } },
          orderBy: { startedAt: 'desc' },
          skip: retainedRuns,
          take: cleanupBatchSize,
          select: { id: true },
        });
        if (expired.length > 0) {
          await transaction.mediaIntegrityScanRun.deleteMany({
            where: { id: { in: expired.map(({ id }) => id) } },
          });
        }
      });
    },

    async fail(scanRunId, completedAt) {
      await database.mediaIntegrityScanRun.update({
        where: { id: scanRunId },
        data: { status: 'FAILED', completedAt },
      });
    },
  };
}
