/** @jest-environment node */

import { createMediaHealthReader } from '../media-health';

describe('media health reader', () => {
  it('returns availability, progress, latest persisted result, and filtered findings', async () => {
    const repository = {
      findRunning: jest.fn().mockResolvedValue({
        id: 'running-1',
        scope: 'CATALOG',
        requestedContentId: null,
        status: 'RUNNING',
        startedAt: new Date('2026-08-14T11:55:00.000Z'),
        completedAt: null,
        contentCount: 0,
        findingCount: 0,
        criticalCount: 0,
        warningCount: 0,
      }),
      findLatest: jest.fn().mockResolvedValue({
        id: 'scan-1',
        scope: 'CATALOG',
        requestedContentId: null,
        status: 'COMPLETED',
        startedAt: new Date('2026-08-14T11:00:00.000Z'),
        completedAt: new Date('2026-08-14T11:05:00.000Z'),
        contentCount: 10,
        findingCount: 1,
        criticalCount: 1,
        warningCount: 0,
      }),
      findFindings: jest.fn().mockResolvedValue({
        findings: [{
          id: 'finding-1',
          contentId: 'movie-1',
          contentTitle: 'Movie one',
          contentType: 'Movie',
          resourceKind: 'VIDEO',
          severity: 'CRITICAL',
          code: 'VIDEO_MISSING',
          metadata: null,
          createdAt: new Date('2026-08-14T11:05:00.000Z'),
        }],
        total: 1,
      }),
    };
    const reader = createMediaHealthReader({
      repository,
      checkAvailability: async () => true,
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    const result = await reader.read({ severity: 'CRITICAL', contentType: 'Movie' });

    expect(result).toMatchObject({
      availability: 'AVAILABLE',
      stale: false,
      runningScan: { id: 'running-1', stale: false },
      lastScan: { id: 'scan-1', status: 'COMPLETED' },
      total: 1,
    });
    expect(result.findings[0]).toMatchObject({ contentTitle: 'Movie one', code: 'VIDEO_MISSING' });
    expect(repository.findLatest).toHaveBeenCalledWith(undefined);
    expect(repository.findFindings).toHaveBeenCalledWith('scan-1', {
      severity: 'CRITICAL',
      resourceKind: undefined,
      contentType: 'Movie',
    });
  });

  it('reports unavailable and stale states without querying findings when no result exists', async () => {
    const repository = {
      findRunning: jest.fn().mockResolvedValue(null),
      findLatest: jest.fn().mockResolvedValue(null),
      findFindings: jest.fn(),
    };
    const reader = createMediaHealthReader({
      repository,
      checkAvailability: async () => false,
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    await expect(reader.read({ scanStatus: 'FAILED' })).resolves.toEqual({
      availability: 'UNAVAILABLE',
      stale: true,
      runningScan: null,
      lastScan: null,
      findings: [],
      total: 0,
    });
    expect(repository.findLatest).toHaveBeenCalledWith('FAILED');
    expect(repository.findFindings).not.toHaveBeenCalled();
  });

  it('marks old completed and long-running scans as stale', async () => {
    const repository = {
      findRunning: jest.fn().mockResolvedValue({
        id: 'running-old',
        scope: 'CATALOG',
        requestedContentId: null,
        status: 'RUNNING',
        startedAt: new Date('2026-08-13T10:00:00.000Z'),
        completedAt: null,
        contentCount: 0,
        findingCount: 0,
        criticalCount: 0,
        warningCount: 0,
      }),
      findLatest: jest.fn().mockResolvedValue({
        id: 'scan-old',
        scope: 'CATALOG',
        requestedContentId: null,
        status: 'COMPLETED',
        startedAt: new Date('2026-08-12T10:00:00.000Z'),
        completedAt: new Date('2026-08-12T10:05:00.000Z'),
        contentCount: 10,
        findingCount: 0,
        criticalCount: 0,
        warningCount: 0,
      }),
      findFindings: jest.fn().mockResolvedValue({ findings: [], total: 0 }),
    };
    const reader = createMediaHealthReader({
      repository,
      checkAvailability: async () => true,
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    const result = await reader.read({});

    expect(result.stale).toBe(true);
    expect(result.runningScan?.stale).toBe(true);
  });
});
