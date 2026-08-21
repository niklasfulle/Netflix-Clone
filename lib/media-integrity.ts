import path from 'node:path';

import { createPrismaMediaScanRunRepository, type MediaScanDatabase } from '@/lib/administration/media-integrity-repository';
import { createMediaIntegrityScanner } from '@/lib/administration/media-integrity-scanner';
import { db } from '@/lib/db';
import { getMediaFolders } from '@/lib/media-files';
import { createFileMediaInspector } from '@/lib/media-integrity-resources';
import { createFfprobe } from '@/lib/media-probe';

export function durationTextToSeconds(value: string): number | null {
  const parts = value.trim().split(':').map(Number);
  if (parts.length < 1 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return Number.isFinite(seconds) ? seconds : null;
}

const { movieFolder, seriesFolder } = getMediaFolders();

export const mediaIntegrityScanner = createMediaIntegrityScanner({
  catalog: {
    async listPublished(contentId) {
      const movies = await db.movie.findMany({
        where: {
          status: 'PUBLISHED',
          ...(contentId ? { id: contentId } : {}),
        },
        select: {
          id: true,
          type: true,
          videoUrl: true,
          thumbnailUrl: true,
          duration: true,
        },
      });
      return movies.map((movie) => ({
        id: movie.id,
        type: movie.type === 'Serie' ? 'Serie' as const : 'Movie' as const,
        videoReference: movie.videoUrl,
        thumbnailReference: movie.thumbnailUrl,
        expectedDurationSeconds: durationTextToSeconds(movie.duration),
      }));
    },
  },
  inspector: createFileMediaInspector({
    roots: {
      movies: movieFolder,
      series: seriesFolder,
      thumbnails: path.resolve(/* turbopackIgnore: true */ process.cwd(), 'public'),
    },
    probe: createFfprobe(),
  }),
  runs: createPrismaMediaScanRunRepository(db as unknown as MediaScanDatabase),
});
