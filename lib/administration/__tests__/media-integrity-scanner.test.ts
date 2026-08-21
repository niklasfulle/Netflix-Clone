/** @jest-environment node */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createMediaIntegrityScanner, type MediaCatalogItem } from '../media-integrity-scanner';
import {
  createFileMediaInspector,
  MediaProbeFailure,
} from '@/lib/media-integrity-resources';

const validProbe = {
  durationSeconds: 60,
  container: 'mov,mp4,m4a,3gp,3g2,mj2',
  streams: [
    { type: 'video' as const, codec: 'h264' },
    { type: 'audio' as const, codec: 'aac' },
  ],
};

function memoryRuns() {
  return {
    start: jest.fn().mockResolvedValue({ id: 'scan-1' }),
    complete: jest.fn().mockResolvedValue(undefined),
    fail: jest.fn().mockResolvedValue(undefined),
  };
}

function catalogItem(overrides: Partial<MediaCatalogItem> = {}): MediaCatalogItem {
  return {
    id: 'movie-1',
    type: 'Movie',
    videoReference: 'movie.mp4',
    thumbnailReference: 'poster.png',
    expectedDurationSeconds: 60,
    ...overrides,
  };
}

describe('media integrity scanner', () => {
  let root: string;
  let movies: string;
  let series: string;
  let thumbnails: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'netflix-integrity-'));
    movies = path.join(root, 'movies');
    series = path.join(root, 'series');
    thumbnails = path.join(root, 'public');
    await Promise.all([fs.mkdir(movies), fs.mkdir(series), fs.mkdir(thumbnails)]);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('reports traversal without inspecting a file outside an approved root', async () => {
    await fs.writeFile(path.join(root, 'outside.mp4'), 'not catalog media');
    const probe = jest.fn(async () => validProbe);
    const scanner = createMediaIntegrityScanner({
      catalog: {
        listPublished: async () => [{
          id: 'movie-1',
          type: 'Movie',
          videoReference: '../outside.mp4',
          thumbnailReference: '',
          expectedDurationSeconds: 60,
        }],
      },
      inspector: createFileMediaInspector({ roots: { movies, series, thumbnails }, probe }),
      runs: memoryRuns(),
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    const result = await scanner.scan({ contentId: 'movie-1' });

    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentId: 'movie-1',
        resourceKind: 'VIDEO',
        severity: 'CRITICAL',
        code: 'VIDEO_REFERENCE_UNSAFE',
      }),
    ]));
    expect(probe).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(root);
  });

  it.each([
    ['missing.mp4', 'VIDEO_MISSING'],
    ['empty.mp4', 'VIDEO_EMPTY'],
    ['notes.txt', 'VIDEO_UNSUPPORTED_TYPE'],
  ])('reports an unusable video reference %s with %s', async (videoReference, expectedCode) => {
    if (videoReference !== 'missing.mp4') {
      await fs.writeFile(path.join(movies, videoReference), videoReference === 'empty.mp4' ? '' : 'text');
    }
    const probe = jest.fn(async () => validProbe);
    const inspector = createFileMediaInspector({ roots: { movies, series, thumbnails }, probe });

    const findings = await inspector.inspect(catalogItem({ videoReference }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: expectedCode, resourceKind: 'VIDEO' }),
    ]));
    expect(probe).not.toHaveBeenCalled();
  });

  it('resolves an extensionless video reference like the player does', async () => {
    await fs.writeFile(path.join(series, 'episode.mp4'), 'video');
    const probe = jest.fn(async () => validProbe);
    const inspector = createFileMediaInspector({ roots: { movies, series, thumbnails }, probe });

    const findings = await inspector.inspect(catalogItem({
      type: 'Serie',
      videoReference: 'episode',
    }));

    expect(findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'VIDEO_UNSUPPORTED_TYPE', resourceKind: 'VIDEO' }),
    ]));
    expect(probe).toHaveBeenCalledWith(path.join(series, 'episode.mp4'), 5_000);
  });

  it.each([
    ['INVALID_OUTPUT', 'VIDEO_PROBE_INVALID'],
    ['TIMEOUT', 'VIDEO_PROBE_TIMEOUT'],
  ] as const)('maps a %s probe failure to %s', async (reason, expectedCode) => {
    await fs.writeFile(path.join(movies, 'movie.mp4'), 'video');
    const probe = jest.fn(async () => {
      throw new MediaProbeFailure(reason);
    });
    const inspector = createFileMediaInspector({ roots: { movies, series, thumbnails }, probe });

    const findings = await inspector.inspect(catalogItem());

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: expectedCode, resourceKind: 'VIDEO' }),
    ]));
    expect(JSON.stringify(findings)).not.toContain(root);
  });

  it('continues a catalog scan when one inspector call fails unexpectedly', async () => {
    const runs = memoryRuns();
    const scanner = createMediaIntegrityScanner({
      catalog: {
        listPublished: async () => [catalogItem({ id: 'broken' }), catalogItem({ id: 'healthy' })],
      },
      inspector: {
        inspect: async (item) => {
          if (item.id === 'broken') throw new Error(`private path: ${root}`);
          return [];
        },
      },
      runs,
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    const result = await scanner.scan();

    expect(result.status).toBe('COMPLETED');
    expect(result.contentCount).toBe(2);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentId: 'broken',
        code: 'RESOURCE_INSPECTION_FAILED',
        severity: 'WARNING',
      }),
    ]));
    expect(JSON.stringify(result)).not.toContain(root);
  });

  it('reports invalid streams, codecs, and a material duration mismatch', async () => {
    await fs.writeFile(path.join(movies, 'movie.mp4'), 'video');
    const probe = jest.fn(async () => ({
      durationSeconds: 91,
      container: 'mov,mp4,m4a,3gp,3g2,mj2',
      streams: [
        { type: 'video' as const, codec: 'unsupported-video' },
        { type: 'audio' as const, codec: 'unsupported-audio' },
      ],
    }));
    const inspector = createFileMediaInspector({ roots: { movies, series, thumbnails }, probe });

    const findings = await inspector.inspect(catalogItem({ expectedDurationSeconds: 60 }));

    expect(findings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'VIDEO_CODEC_UNSUPPORTED',
      'AUDIO_CODEC_UNSUPPORTED',
      'VIDEO_DURATION_MISMATCH',
    ]));
  });

  it('reports missing video and audio streams', async () => {
    await fs.writeFile(path.join(movies, 'movie.mp4'), 'video');
    const probe = jest.fn(async () => ({
      durationSeconds: 60,
      container: 'mp4',
      streams: [],
    }));
    const inspector = createFileMediaInspector({ roots: { movies, series, thumbnails }, probe });

    const findings = await inspector.inspect(catalogItem());

    expect(findings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'VIDEO_NO_VIDEO_STREAM',
      'VIDEO_NO_AUDIO_STREAM',
    ]));
  });

  it('reports duplicate catalog references without disclosing resolved paths', async () => {
    const runs = memoryRuns();
    const scanner = createMediaIntegrityScanner({
      catalog: {
        listPublished: async () => [
          catalogItem({ id: 'movie-1' }),
          catalogItem({ id: 'movie-2', videoReference: '.\\movie.mp4' }),
        ],
      },
      inspector: { inspect: async () => [] },
      runs,
      now: () => new Date('2026-08-14T12:00:00.000Z'),
    });

    const result = await scanner.scan();

    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentId: 'movie-2',
        resourceKind: 'VIDEO',
        code: 'DUPLICATE_VIDEO_REFERENCE',
      }),
    ]));
    expect(result.findings[0]?.metadata).toEqual({ duplicateCount: 2 });
  });

  it.each([
    ['../outside.png', 'THUMBNAIL_REFERENCE_UNSAFE'],
    ['missing.png', 'THUMBNAIL_MISSING'],
    ['poster.txt', 'THUMBNAIL_UNSUPPORTED_TYPE'],
    ['poster.png', 'THUMBNAIL_INVALID'],
  ])('reports an unusable thumbnail reference %s with %s', async (thumbnailReference, expectedCode) => {
    await fs.writeFile(path.join(movies, 'movie.mp4'), 'video');
    if (thumbnailReference === 'poster.txt' || thumbnailReference === 'poster.png') {
      await fs.writeFile(path.join(thumbnails, thumbnailReference), 'not an image');
    }
    const inspector = createFileMediaInspector({
      roots: { movies, series, thumbnails },
      probe: async () => validProbe,
    });

    const findings = await inspector.inspect(catalogItem({ thumbnailReference }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: expectedCode, resourceKind: 'THUMBNAIL' }),
    ]));
    expect(JSON.stringify(findings)).not.toContain(root);
  });

  it('accepts a valid thumbnail below the configured root', async () => {
    await fs.writeFile(path.join(movies, 'movie.mp4'), 'video');
    const onePixelPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    await fs.writeFile(path.join(thumbnails, 'poster.png'), onePixelPng);
    const inspector = createFileMediaInspector({
      roots: { movies, series, thumbnails },
      probe: async () => validProbe,
    });

    const findings = await inspector.inspect(catalogItem());

    expect(findings).toEqual([]);
  });

  it('reports supported orphan videos only during a full catalog scan', async () => {
    await Promise.all([
      fs.writeFile(path.join(movies, 'movie.mp4'), 'referenced'),
      fs.writeFile(path.join(movies, 'orphan.mkv'), 'orphan'),
      fs.writeFile(path.join(movies, 'notes.txt'), 'not media'),
    ]);
    const runs = memoryRuns();
    const inspector = createFileMediaInspector({
      roots: { movies, series, thumbnails },
      probe: async () => validProbe,
    });
    const scanner = createMediaIntegrityScanner({
      catalog: { listPublished: async () => [catalogItem()] },
      inspector,
      runs,
    });

    const catalogResult = await scanner.scan();
    const contentResult = await scanner.scan({ contentId: 'movie-1' });

    expect(catalogResult.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentId: null,
        resourceKind: 'VIDEO',
        code: 'ORPHAN_VIDEO_RESOURCE',
        metadata: { library: 'MOVIES', resource: 'orphan.mkv' },
      }),
    ]));
    expect(contentResult.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ORPHAN_VIDEO_RESOURCE' }),
    ]));
    expect(JSON.stringify(catalogResult)).not.toContain(root);
  });

  it('bounds concurrent resource inspections', async () => {
    let active = 0;
    let maximumActive = 0;
    const scanner = createMediaIntegrityScanner({
      catalog: {
        listPublished: async () => Array.from({ length: 8 }, (_, index) => catalogItem({
          id: `movie-${index}`,
          videoReference: `movie-${index}.mp4`,
          thumbnailReference: `poster-${index}.png`,
        })),
      },
      inspector: {
        inspect: async () => {
          active += 1;
          maximumActive = Math.max(maximumActive, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return [];
        },
      },
      runs: memoryRuns(),
      inspectionConcurrency: 2,
    });

    await scanner.scan();

    expect(maximumActive).toBe(2);
  });
});
