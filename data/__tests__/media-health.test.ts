/** @jest-environment node */

const mockFindFirst = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    mediaIntegrityScanRun: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

import { mediaHealthRepository } from '@/data/media-health';

const startedAt = new Date('2026-08-14T10:00:00.000Z');
const createdAt = new Date('2026-08-14T10:05:00.000Z');

function rawScan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scan-1',
    scope: 'CATALOG',
    requestedContentId: null,
    status: 'COMPLETED',
    startedAt,
    completedAt: createdAt,
    contentCount: 5,
    findingCount: 1,
    criticalCount: 0,
    warningCount: 1,
    ...overrides,
  };
}

function rawFinding(overrides: Record<string, unknown> = {}) {
  return {
    id: 'finding-1',
    contentId: 'movie-1',
    contentTitle: 'Movie',
    contentType: 'Movie',
    resourceKind: 'VIDEO',
    severity: 'WARNING',
    code: 'VIDEO_MISSING',
    metadata: { path: 'movie.mp4', size: 42, valid: true, empty: null },
    createdAt,
    ...overrides,
  };
}

describe('media health persistence adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the running scan and preserves supported scope and status values', async () => {
    mockFindFirst.mockResolvedValue(rawScan({ scope: 'CONTENT', status: 'RUNNING' }));

    await expect(mediaHealthRepository.findRunning()).resolves.toEqual(
      expect.objectContaining({ id: 'scan-1', scope: 'CONTENT', status: 'RUNNING' }),
    );
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'RUNNING' },
      orderBy: { startedAt: 'desc' },
    }));
  });

  it('normalizes legacy scan values and handles an empty result', async () => {
    mockFindFirst
      .mockResolvedValueOnce(rawScan({ scope: 'UNKNOWN', status: 'UNKNOWN' }))
      .mockResolvedValueOnce(null);

    await expect(mediaHealthRepository.findLatest()).resolves.toEqual(
      expect.objectContaining({ scope: 'CATALOG', status: 'COMPLETED' }),
    );
    await expect(mediaHealthRepository.findRunning()).resolves.toBeNull();
    expect(mockFindFirst).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { status: { in: ['COMPLETED', 'FAILED'] } },
    }));
  });

  it('requests a specific latest status and keeps failed scans', async () => {
    mockFindFirst.mockResolvedValue(rawScan({ status: 'FAILED' }));

    await expect(mediaHealthRepository.findLatest('FAILED')).resolves.toEqual(
      expect.objectContaining({ status: 'FAILED' }),
    );
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'FAILED' },
    }));
  });

  it('returns valid findings, sanitizes metadata, and reports the full result count', async () => {
    mockQueryRaw
      .mockResolvedValueOnce([
        rawFinding({
          metadata: {
            text: 'value',
            count: 2,
            enabled: false,
            empty: null,
            nested: { private: true },
            list: ['private'],
          },
        }),
        rawFinding({ id: 'finding-2', contentType: 'Serie', resourceKind: 'THUMBNAIL', severity: 'CRITICAL' }),
        rawFinding({ id: 'finding-3', contentType: 'Other', metadata: null }),
        rawFinding({ id: 'invalid-code', code: 'UNKNOWN' }),
        rawFinding({ id: 'invalid-severity', severity: 'UNKNOWN' }),
        rawFinding({ id: 'invalid-kind', resourceKind: 'UNKNOWN' }),
      ])
      .mockResolvedValueOnce([{ count: 9 }]);

    const result = await mediaHealthRepository.findFindings('scan-1', {
      severity: 'WARNING',
      resourceKind: 'VIDEO',
      contentType: 'Movie',
    });

    expect(result.total).toBe(9);
    expect(result.findings).toHaveLength(3);
    expect(result.findings[0]).toEqual(expect.objectContaining({
      contentType: 'Movie',
      metadata: { text: 'value', count: 2, enabled: false, empty: null },
    }));
    expect(result.findings[1]).toEqual(expect.objectContaining({
      contentType: 'Serie',
      resourceKind: 'THUMBNAIL',
      severity: 'CRITICAL',
    }));
    expect(result.findings[2]).toEqual(expect.objectContaining({
      contentType: null,
      metadata: null,
    }));
    expect(mockQueryRaw).toHaveBeenCalledTimes(2);
  });

  it('handles non-object metadata and a missing count row', async () => {
    mockQueryRaw
      .mockResolvedValueOnce([
        rawFinding({ id: 'array', metadata: ['value'] }),
        rawFinding({ id: 'scalar', metadata: 'value' }),
      ])
      .mockResolvedValueOnce([]);

    await expect(mediaHealthRepository.findFindings('scan-1', {})).resolves.toEqual({
      findings: [
        expect.objectContaining({ id: 'array', metadata: null }),
        expect.objectContaining({ id: 'scalar', metadata: null }),
      ],
      total: 0,
    });
  });
});
