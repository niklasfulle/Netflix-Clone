import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { getMediaFolders } from '@/lib/media-files';
import { resolveVideoFile } from '@/lib/video-stream';
import { VideoAnalysisError } from './contracts';
import { ANALYSIS_FRAME_SIZE } from './profile';

export async function inspectAnalysisSource(movie: { type: string; videoUrl: string }) {
  if (!['Movie', 'Serie'].includes(movie.type)) throw new VideoAnalysisError('UNSUPPORTED_VIDEO_TYPE', true);
  const folders = getMediaFolders();
  const root = movie.type === 'Serie' ? folders.seriesFolder : folders.movieFolder;
  const resolved = resolveVideoFile(root, movie.videoUrl);
  if (!resolved) throw new VideoAnalysisError('VIDEO_NOT_FOUND', true);
  const [base, filePath] = await Promise.all([realpath(root), realpath(resolved)]);
  const relative = path.relative(base, filePath);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) throw new VideoAnalysisError('UNSAFE_VIDEO_PATH', true);
  const metadata = await stat(filePath);
  if (!metadata.isFile() || metadata.size === 0) throw new VideoAnalysisError('VIDEO_NOT_FOUND', true);
  const fingerprint = createHash('sha256').update(JSON.stringify([movie.type, filePath, metadata.dev, metadata.ino, metadata.size, metadata.mtimeMs, metadata.ctimeMs])).digest('hex');
  return { filePath, fingerprint };
}

export function captureAnalysisFrame(filePath: string, seconds: number, signal?: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile('/usr/local/bin/ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'file,pipe',
      '-ss', seconds.toFixed(3), '-i', filePath, '-map', '0:v:0', '-an', '-frames:v', '1',
      '-vf', `scale=${ANALYSIS_FRAME_SIZE}:${ANALYSIS_FRAME_SIZE}:force_original_aspect_ratio=decrease`, '-threads', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1',
    ], { encoding: 'buffer', maxBuffer: 1024 * 1024, timeout: 30_000, signal, windowsHide: true }, (error, stdout) => {
      if (error || stdout.length < 4 || stdout[0] !== 0xff || stdout[1] !== 0xd8) reject(new VideoAnalysisError('FRAME_CAPTURE_FAILED'));
      else resolve(stdout);
    });
  });
}
