import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import type {
  MediaCatalogItem,
  MediaFinding,
  MediaFindingCode,
  MediaResourceKind,
} from '@/lib/administration/media-integrity-scanner';
import { resolveVideoFile } from '@/lib/video-stream';

export type MediaProbeResult = {
  durationSeconds: number | null;
  container: string | null;
  streams: Array<{ type: 'video' | 'audio' | 'other'; codec: string }>;
};

export type MediaProbeFailureReason = 'INVALID_OUTPUT' | 'TIMEOUT' | 'EXECUTION_FAILED';

export class MediaProbeFailure extends Error {
  constructor(readonly reason: MediaProbeFailureReason) {
    super('Media probe failed');
    this.name = 'MediaProbeFailure';
  }
}

type FileMediaInspectorOptions = {
  roots: {
    movies: string;
    series: string;
    thumbnails: string;
  };
  probe(filePath: string, timeoutMs?: number): Promise<MediaProbeResult>;
};

function finding(
  item: MediaCatalogItem,
  resourceKind: MediaResourceKind,
  severity: MediaFinding['severity'],
  code: MediaFindingCode,
  metadata?: MediaFinding['metadata'],
): MediaFinding {
  return { contentId: item.id, resourceKind, severity, code, ...(metadata ? { metadata } : {}) };
}

const SUPPORTED_VIDEO_CODECS = new Set(['av1', 'h264', 'hevc', 'vp8', 'vp9']);
const SUPPORTED_AUDIO_CODECS = new Set(['aac', 'ac3', 'eac3', 'mp3', 'opus', 'vorbis']);
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['.avi', '.mkv', '.mov', '.mp4', '.webm']);
const SUPPORTED_THUMBNAIL_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const PROBE_FAILURE_CODES: Record<MediaProbeFailureReason, MediaFindingCode> = {
  TIMEOUT: 'VIDEO_PROBE_TIMEOUT',
  INVALID_OUTPUT: 'VIDEO_PROBE_INVALID',
  EXECUTION_FAILED: 'VIDEO_PROBE_FAILED',
};
const MAX_LIBRARY_ENTRIES = 10_000;

function probeFindings(item: MediaCatalogItem, probe: MediaProbeResult): MediaFinding[] {
  const findings: MediaFinding[] = [];
  const videoStreams = probe.streams.filter(({ type }) => type === 'video');
  const audioStreams = probe.streams.filter(({ type }) => type === 'audio');

  if (!probe.container) {
    findings.push(finding(item, 'VIDEO', 'WARNING', 'VIDEO_CONTAINER_UNKNOWN'));
  }

  if (videoStreams.length === 0) {
    findings.push(finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_NO_VIDEO_STREAM'));
  } else if (videoStreams.some(({ codec }) => !SUPPORTED_VIDEO_CODECS.has(codec.toLowerCase()))) {
    findings.push(finding(item, 'VIDEO', 'WARNING', 'VIDEO_CODEC_UNSUPPORTED'));
  }

  if (audioStreams.length === 0) {
    findings.push(finding(item, 'VIDEO', 'WARNING', 'VIDEO_NO_AUDIO_STREAM'));
  } else if (audioStreams.some(({ codec }) => !SUPPORTED_AUDIO_CODECS.has(codec.toLowerCase()))) {
    findings.push(finding(item, 'VIDEO', 'WARNING', 'AUDIO_CODEC_UNSUPPORTED'));
  }

  const expected = item.expectedDurationSeconds;
  const actual = probe.durationSeconds;
  if (expected !== null && actual !== null) {
    const tolerance = Math.max(5, expected * 0.05);
    if (Math.abs(expected - actual) > tolerance) {
      findings.push(finding(item, 'VIDEO', 'WARNING', 'VIDEO_DURATION_MISMATCH', {
        expectedSeconds: Math.round(expected),
        actualSeconds: Math.round(actual),
      }));
    }
  }

  return findings;
}

function resolveContained(root: string, reference: string, allowWebRoot = false): string | null {
  const absoluteForHost = path.isAbsolute(reference) || path.win32.isAbsolute(reference);
  const allowedWebRoot = allowWebRoot && path.posix.isAbsolute(reference) && !path.win32.isAbsolute(reference);
  if (!reference || (absoluteForHost && !allowedWebRoot)) return null;

  const normalizedRoot = path.resolve(/* turbopackIgnore: true */ root);
  const candidate = path.resolve(
    /* turbopackIgnore: true */ normalizedRoot,
    allowWebRoot ? reference.replace(/^[/\\]+/, '') : reference,
  );
  const relative = path.relative(normalizedRoot, candidate);

  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    return candidate;
  }

  return null;
}

function videoInspectionFailure(item: MediaCatalogItem, error: unknown): MediaFinding[] {
  if (error instanceof MediaProbeFailure) {
    return [finding(item, 'VIDEO', 'WARNING', PROBE_FAILURE_CODES[error.reason])];
  }

  const code = (error as NodeJS.ErrnoException).code;
  if (code === 'ENOENT') return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_MISSING')];
  if (code === 'EACCES' || code === 'EPERM') {
    return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_UNREADABLE')];
  }
  return [finding(item, 'VIDEO', 'WARNING', 'VIDEO_INSPECTION_FAILED')];
}

async function inspectVideo(
  item: MediaCatalogItem,
  options: FileMediaInspectorOptions,
): Promise<MediaFinding[]> {
  const root = item.type === 'Serie' ? options.roots.series : options.roots.movies;
  const requestedFilePath = resolveContained(root, item.videoReference);
  if (!requestedFilePath) return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_REFERENCE_UNSAFE')];

  const filePath = path.extname(requestedFilePath)
    ? requestedFilePath
    : resolveVideoFile(root, item.videoReference);
  if (!filePath) return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_MISSING')];
  if (!SUPPORTED_VIDEO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_UNSUPPORTED_TYPE')];
  }

  try {
    const stats = await fs.stat(/* turbopackIgnore: true */ filePath);
    if (!stats.isFile()) return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_MISSING')];
    if (stats.size === 0) return [finding(item, 'VIDEO', 'CRITICAL', 'VIDEO_EMPTY')];
    const probe = await options.probe(filePath, 5_000);
    return probeFindings(item, probe);
  } catch (error) {
    return videoInspectionFailure(item, error);
  }
}

function normalizedRelativeReference(reference: string): string | null {
  if (!reference || path.isAbsolute(reference) || path.win32.isAbsolute(reference)) return null;
  const normalized = path.posix.normalize(reference.replaceAll('\\', '/')).replace(/^\.\//, '');
  if (normalized === '..' || normalized.startsWith('../')) return null;
  return normalized.toLowerCase();
}

async function listSupportedFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const pending = [''];

  while (pending.length > 0 && files.length < MAX_LIBRARY_ENTRIES) {
    const relativeDirectory = pending.shift() ?? '';
    const directory = path.join(/* turbopackIgnore: true */ root, relativeDirectory);
    const entries = await fs.readdir(/* turbopackIgnore: true */ directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const relative = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        pending.push(relative);
      } else if (entry.isFile() && SUPPORTED_VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(relative.replaceAll('\\', '/'));
      }
      if (files.length >= MAX_LIBRARY_ENTRIES) break;
    }
  }

  return files;
}

function referenceMatchesFile(reference: string, file: string): boolean {
  if (reference === file) return true;
  return path.posix.extname(reference) === ''
    && reference === file.slice(0, -path.posix.extname(file).length);
}

async function findOrphanVideos(
  items: MediaCatalogItem[],
  roots: FileMediaInspectorOptions['roots'],
): Promise<MediaFinding[]> {
  const findings: MediaFinding[] = [];
  for (const library of [
    { name: 'MOVIES', type: 'Movie', root: roots.movies },
    { name: 'SERIES', type: 'Serie', root: roots.series },
  ] as const) {
    const references = items
      .filter((item) => item.type === library.type)
      .map((item) => normalizedRelativeReference(item.videoReference))
      .filter((value): value is string => value !== null);
    try {
      const files = await listSupportedFiles(library.root);
      for (const file of files) {
        const normalizedFile = file.toLowerCase();
        if (!references.some((reference) => referenceMatchesFile(reference, normalizedFile))) {
          findings.push({
            contentId: null,
            resourceKind: 'VIDEO',
            severity: 'INFO',
            code: 'ORPHAN_VIDEO_RESOURCE',
            metadata: { library: library.name, resource: file },
          });
        }
      }
    } catch {
      findings.push({
        contentId: null,
        resourceKind: 'VIDEO',
        severity: 'WARNING',
        code: 'ORPHAN_SCAN_FAILED',
        metadata: { library: library.name },
      });
    }
  }
  return findings;
}

async function validateImageBuffer(item: MediaCatalogItem, buffer: Buffer): Promise<MediaFinding[]> {
  if (buffer.length === 0) return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_EMPTY')];
  try {
    const metadata = await sharp(buffer, { failOn: 'error', limitInputPixels: 100_000_000 }).metadata();
    if (!metadata.width || !metadata.height || !metadata.format) {
      return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_INVALID')];
    }
    return [];
  } catch {
    return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_INVALID')];
  }
}

async function inspectThumbnail(
  item: MediaCatalogItem,
  options: FileMediaInspectorOptions,
): Promise<MediaFinding[]> {
  if (!item.thumbnailReference) {
    return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_MISSING')];
  }

  if (/^https?:\/\//i.test(item.thumbnailReference)) {
    return [finding(item, 'THUMBNAIL', 'INFO', 'THUMBNAIL_EXTERNAL_NOT_INSPECTED')];
  }

  if (item.thumbnailReference.startsWith('data:image/')) {
    const match = /^data:image\/(?:avif|gif|jpeg|png|webp);base64,([a-z\d+/=]+)$/i.exec(item.thumbnailReference);
    if (!match || match[1].length > 20_000_000) {
      return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_INVALID')];
    }
    return validateImageBuffer(item, Buffer.from(match[1], 'base64'));
  }

  const filePath = resolveContained(options.roots.thumbnails, item.thumbnailReference, true);
  if (!filePath) return [finding(item, 'THUMBNAIL', 'CRITICAL', 'THUMBNAIL_REFERENCE_UNSAFE')];
  if (!SUPPORTED_THUMBNAIL_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_UNSUPPORTED_TYPE')];
  }

  try {
    const stats = await fs.stat(/* turbopackIgnore: true */ filePath);
    if (!stats.isFile()) return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_MISSING')];
    if (stats.size === 0) return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_EMPTY')];
    if (stats.size > 20_000_000) return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_TOO_LARGE')];
    return validateImageBuffer(item, await fs.readFile(/* turbopackIgnore: true */ filePath));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_MISSING')];
    if (code === 'EACCES' || code === 'EPERM') {
      return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_UNREADABLE')];
    }
    return [finding(item, 'THUMBNAIL', 'WARNING', 'THUMBNAIL_INSPECTION_FAILED')];
  }
}

export function createFileMediaInspector(options: FileMediaInspectorOptions) {
  return {
    async inspect(item: MediaCatalogItem): Promise<MediaFinding[]> {
      const [video, thumbnail] = await Promise.all([
        inspectVideo(item, options),
        inspectThumbnail(item, options),
      ]);
      return [...video, ...thumbnail];
    },
    findOrphans(items: MediaCatalogItem[]): Promise<MediaFinding[]> {
      return findOrphanVideos(items, options.roots);
    },
  };
}
