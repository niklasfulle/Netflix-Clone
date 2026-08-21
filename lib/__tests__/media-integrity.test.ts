/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: { movie: { findMany: jest.fn() } },
}));
jest.mock('@/lib/media-files', () => ({
  getMediaFolders: () => ({ movieFolder: '/movies', seriesFolder: '/series' }),
}));
jest.mock('@/lib/media-integrity-resources', () => ({
  createFileMediaInspector: jest.fn(() => ({ inspect: jest.fn() })),
}));
jest.mock('@/lib/media-probe', () => ({
  createFfprobe: jest.fn(() => jest.fn()),
}));
jest.mock('@/lib/administration/media-integrity-repository', () => ({
  createPrismaMediaScanRunRepository: jest.fn(() => ({ create: jest.fn() })),
}));
jest.mock('@/lib/administration/media-integrity-scanner', () => ({
  createMediaIntegrityScanner: jest.fn((dependencies: unknown) => dependencies),
}));

import { db } from '@/lib/db';
import { createFileMediaInspector } from '@/lib/media-integrity-resources';
import { durationTextToSeconds, mediaIntegrityScanner } from '@/lib/media-integrity';
import { createFfprobe } from '@/lib/media-probe';

type ScannerDependencies = {
  catalog: { listPublished(contentId?: string): Promise<unknown[]> };
  inspector: unknown;
  runs: unknown;
};

const dependencies = mediaIntegrityScanner as unknown as ScannerDependencies;
const mockFindMany = db.movie.findMany as jest.Mock;
const mockInspector = (createFileMediaInspector as jest.Mock).mock.results[0].value;
const mockProbe = (createFfprobe as jest.Mock).mock.results[0].value;
const inspectorInput = (createFileMediaInspector as jest.Mock).mock.calls[0][0];

describe('media integrity composition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['42', 42],
    ['02:03', 123],
    ['1:02:03', 3723],
    [' 00:00:05 ', 5],
  ])('converts supported duration %s to seconds', (value, expected) => {
    expect(durationTextToSeconds(value)).toBe(expected);
  });

  it.each(['1:2:3:4', 'invalid', '-1:20', '1:Infinity'])('rejects invalid duration %s', (value) => {
    expect(durationTextToSeconds(value)).toBeNull();
  });

  it('rejects a duration whose accumulated seconds overflow', () => {
    expect(durationTextToSeconds(`${Number.MAX_VALUE}:${Number.MAX_VALUE}:${Number.MAX_VALUE}`)).toBeNull();
  });

  it('loads and maps the published catalog, optionally scoped to one item', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'movie-1',
        type: 'Movie',
        videoUrl: 'movie.mp4',
        thumbnailUrl: 'movie.jpg',
        duration: '01:30',
      },
      {
        id: 'series-1',
        type: 'Serie',
        videoUrl: 'episode.mp4',
        thumbnailUrl: 'series.jpg',
        duration: 'unknown',
      },
    ]);

    await expect(dependencies.catalog.listPublished('movie-1')).resolves.toEqual([
      {
        id: 'movie-1',
        type: 'Movie',
        videoReference: 'movie.mp4',
        thumbnailReference: 'movie.jpg',
        expectedDurationSeconds: 90,
      },
      {
        id: 'series-1',
        type: 'Serie',
        videoReference: 'episode.mp4',
        thumbnailReference: 'series.jpg',
        expectedDurationSeconds: null,
      },
    ]);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', id: 'movie-1' },
    }));
  });

  it('loads the full published catalog when no content id is supplied', async () => {
    mockFindMany.mockResolvedValue([]);

    await expect(dependencies.catalog.listPublished()).resolves.toEqual([]);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED' },
    }));
  });

  it('wires the fixed media roots, probe, inspector, and persistence adapter', () => {
    expect(inspectorInput).toEqual({
      roots: {
        movies: '/movies',
        series: '/series',
        thumbnails: expect.stringMatching(/[\\/]public$/),
      },
      probe: mockProbe,
    });
    expect(dependencies.inspector).toBe(mockInspector);
    expect(dependencies.runs).toEqual(expect.objectContaining({ create: expect.any(Function) }));
  });
});
