// Creates a neutral synthetic video and categories; removes only its own fixtures.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundled = await build({
  stdin: { contents: "export { readCategorization, saveCategorization } from './lib/manual-categorization/service';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-marker', setup(context) {
    context.onResolve({ filter: /^server-only$/ }, () => ({ path: 'marker', namespace: 'empty' }));
    context.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
const check = String.raw`
const { PrismaClient } = require('@prisma/client');
const { execFileSync: run } = require('node:child_process');
const { rm } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const manualCheckDb = new PrismaClient();
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  const marker = 'manual-check-' + randomUUID();
  const file = '/movies/' + marker + '.mp4';
  let movie; const categories = [];
  try {
    run('/usr/local/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24', '-t', '12', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-timecode', '00:00:00:00', file]);
    const metadata = JSON.parse(run('/usr/local/bin/ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name', '-of', 'json', '--', file], { encoding: 'utf8' }));
    assert(metadata.streams.some(stream => stream.codec_type === 'data' && stream.codec_name === undefined), 'Fixture must include a timecode stream without a codec name');
    movie = await manualCheckDb.movie.create({ data: { title: 'Manual timeline fixture', description: 'Neutral integration fixture', videoUrl: marker + '.mp4', thumbnailUrl: '/images/hero.jpg', type: 'Movie', genre: 'Drama', duration: '00:12', status: 'DRAFT' } });
    for (const label of ['Forest', 'City']) categories.push(await manualCheckDb.category.create({ data: { name: label + ' ' + marker, nameEn: label + ' ' + marker, normalizedName: (label + ' ' + marker).toLowerCase() } }));
    const input = { movieId: movie.id, version: 0, categoryIds: [categories[0].id], segments: [{ categoryId: categories[1].id, startSeconds: 2, endSeconds: 5 }], complete: false };
    const saved = await module.exports.saveCategorization(input);
    assert.equal(saved.movie.version, 1);
    assert.deepEqual(saved.movie.categories.map(category => category.id), [categories[0].id]);
    assert.equal(saved.movie.segments.length, 1);
    assert.equal(saved.movie.segments[0].categoryId, categories[1].id);
    await assert.rejects(module.exports.saveCategorization(input), error => error.code === 'CONFLICT');
    await assert.rejects(module.exports.saveCategorization({ ...input, version: 1, segments: [{ ...input.segments[0], endSeconds: 13 }] }), error => error.code === 'INVALID_RANGE');
    await assert.rejects(module.exports.saveCategorization({ ...input, version: 1, categoryIds: ['missing-neutral-category'] }), error => error.code === 'INVALID_CATEGORIES');
    const afterFailure = await module.exports.readCategorization({ movieId: movie.id });
    assert.equal(afterFailure.movie.version, 1); assert.equal(afterFailure.movie.segments.length, 1);
    const segment = await manualCheckDb.movieCategorySegment.findFirst({ where: { movieId: movie.id } });
    await assert.rejects(manualCheckDb.$executeRawUnsafe('UPDATE "MovieCategorySegment" SET "startSeconds"=10, "endSeconds"=5 WHERE "id"=$1', segment.id));
    const completed = await module.exports.saveCategorization({ ...input, version: 1, categoryIds: [], segments: [], complete: true });
    assert(completed.movie.completed); assert.equal(completed.movie.version, 2);
    assert.equal(await manualCheckDb.movie.count({ where: { id: movie.id, categoryReviewedAt: null } }), 0);
    console.log('PASS: timecode metadata, separate global and interval categories, real duration validation, optimistic conflicts, database time-range constraint, empty review completion');
  } finally {
    if (movie) {
      await manualCheckDb.movie.delete({ where: { id: movie.id } });
      assert.equal(await manualCheckDb.movieCategorySegment.count({ where: { movieId: movie.id } }), 0);
    }
    if (categories.length) await manualCheckDb.category.deleteMany({ where: { id: { in: categories.map(category => category.id) } } });
    await rm(file, { force: true });
    await manualCheckDb.$disconnect();
  }
})().then(() => process.exit(0), error => { console.error(error.code || error.message); process.exit(1); });
`;
process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], {
  input: `${bundled.outputFiles[0].text}\n${check}`, encoding: 'utf8', timeout: 60_000, maxBuffer: 256 * 1024,
}));
