/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { promises: fs } = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { randomUUID, createHash } = require('node:crypto');
const sharp = require('sharp');
const { SnapshotError, fixtureName } = require('./model');
const execute = promisify(execFile);

function mediaRoot(type, environment) {
  const root = type === 'Movie' ? environment.MOVIE_FOLDER : environment.SERIES_FOLDER;
  if (!root) throw new SnapshotError('MOVIE_FOLDER and SERIES_FOLDER are required.');
  return path.resolve(root);
}

async function probe(file, environment) {
  const { stdout } = await execute(environment.FFPROBE_PATH || 'ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type', '-of', 'json', file,
  ], { timeout: 30000, maxBuffer: 1024 * 1024 });
  const data = JSON.parse(stdout);
  const seconds = Number(data.format?.duration);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 86400 || !data.streams?.some(stream => stream.codec_type === 'video')) {
    throw new SnapshotError('A media file has no valid video duration.');
  }
  return { seconds, streams: data.streams };
}

async function sourceDuration(movie, environment) {
  const root = await fs.realpath(mediaRoot(movie.type, environment));
  if (path.isAbsolute(movie.videoUrl)) throw new SnapshotError('A source video path is not relative.');
  const candidates = path.extname(movie.videoUrl) ? [movie.videoUrl] : [movie.videoUrl, `${movie.videoUrl}.mp4`, `${movie.videoUrl}.mkv`];
  for (const candidate of candidates) {
    const file = await fs.realpath(path.resolve(root, candidate)).catch(() => null);
    if (!file) continue;
    const relative = path.relative(root, file);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new SnapshotError('A source video resolves outside its media root.');
    }
    return (await probe(file, environment)).seconds;
  }
  throw new SnapshotError('A source video is missing; export stopped to avoid inaccurate timeline durations.');
}

async function validFixture(file, seconds, environment) {
  try {
    const info = await probe(file, environment);
    return Math.abs(info.seconds - seconds) <= 0.55
      && info.seconds >= seconds - 0.005
      && info.streams.some(stream => stream.codec_name === 'h264')
      && info.streams.some(stream => stream.codec_name === 'aac');
  } catch { return false; }
}

async function ensureFixture(movie, environment) {
  const root = mediaRoot(movie.type, environment);
  await fs.mkdir(root, { recursive: true });
  const file = path.join(root, fixtureName(movie.durationSeconds));
  const stat = await fs.lstat(file).catch(() => null);
  if (stat?.isSymbolicLink()) throw new SnapshotError('A fixture path is a symbolic link.');
  if (stat && await validFixture(file, movie.durationSeconds, environment)) return;
  // Existing files are never overwritten; only this tool's new files are published.
  if (stat) throw new SnapshotError('An existing fixture is invalid. Move it aside before retrying.');
  const temporary = path.join(root, `.snapshot-${randomUUID()}.mp4`);
  try {
    await execute(environment.FFMPEG_PATH || 'ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-n',
      '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=2',
      '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono',
      '-t', String(Math.ceil(movie.durationSeconds * 1000) / 1000),
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '38', '-g', '2', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '16k', '-movflags', '+faststart', temporary,
    ], { timeout: 30 * 60 * 1000, maxBuffer: 1024 * 1024 });
    if (!await validFixture(temporary, movie.durationSeconds, environment)) throw new SnapshotError('Generated fixture failed validation.');
    await fs.link(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

async function thumbnail(movie) {
  const hash = createHash('sha256').update(movie.id).digest('hex');
  const color = `#${hash.slice(0, 6)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${color}"/><rect x="24" y="24" width="592" height="312" rx="18" fill="#18181b"/><text x="320" y="155" fill="white" font-size="32" text-anchor="middle">TEST VIDEO</text><text x="320" y="215" fill="#a1a1aa" font-size="22" text-anchor="middle">${hash.slice(0, 8)} / ${Math.round(movie.durationSeconds)} s</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function prepareMedia(snapshot, environment, report = () => {}) {
  const completed = new Set();
  const movies = [];
  for (const row of snapshot.data.movies) {
    const key = `${row.type}:${fixtureName(row.durationSeconds)}`;
    if (!completed.has(key)) {
      await ensureFixture(row, environment);
      completed.add(key);
      report({ preparedMediaFiles: completed.size });
    }
    const { durationSeconds, ...movie } = row;
    movies.push({ ...movie, videoUrl: fixtureName(durationSeconds), thumbnailUrl: await thumbnail(row) });
  }
  return movies;
}

module.exports = { mediaRoot, sourceDuration, probe, ensureFixture, prepareMedia };
