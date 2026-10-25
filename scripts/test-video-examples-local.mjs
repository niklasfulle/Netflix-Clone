import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundled = await build({ entryPoints: ['lib/video-examples/service.ts'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-marker', setup(context) {
    context.onResolve({ filter: /^server-only$/ }, () => ({ path: 'marker', namespace: 'empty' }));
    context.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
const check = String.raw`
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { appendFile, rm } = require('node:fs/promises');
const assert = require('node:assert/strict');
const prisma = new PrismaClient();
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  const marker = 'example-check-' + randomUUID();
  const file = '/movies/' + marker + '.mp4';
  let movie, category;
  try {
    const actor = await prisma.user.findFirst({ where: { role: 'ADMIN', isBlocked: false }, select: { id: true } });
    assert(actor);
    execFileSync('/usr/local/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-f', 'lavfi', '-i', 'testsrc2=size=480x270:rate=24', '-t', '8', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', file]);
    movie = await prisma.movie.create({ data: { title: marker, description: 'Neutral test fixture', videoUrl: marker + '.mp4', thumbnailUrl: '/placeholder.jpg', type: 'Movie', genre: 'Documentary', duration: '00:08', status: 'DRAFT' } });
    category = await prisma.category.create({ data: { name: marker, nameEn: marker, normalizedName: marker } });
    const source = await module.exports.readVideoExamples(movie.id);
    const input = { movieId: movie.id, requestId: randomUUID(), sourceFingerprint: source.sourceFingerprint, startSeconds: 1.25, endSeconds: 3.75, labels: [{ categoryId: category.id, verdict: 'PRESENT' }], note: 'Neutral fixture' };
    const created = await module.exports.saveVideoExample(input, actor.id);
    assert.equal((await module.exports.saveVideoExample(input, actor.id)).id, created.id);
    let saved = await module.exports.readVideoExamples(movie.id);
    assert.equal(saved.examples.length, 1);
    assert.equal(saved.examples[0].labels[0].nameEn, marker);
    assert.equal(await prisma.movieCategory.count({ where: { movieId: movie.id } }), 0);
    await prisma.category.delete({ where: { id: category.id } });
    const { requestId, ...fields } = input;
    const updated = await module.exports.saveVideoExample({ ...fields, id: created.id, version: 1, labels: [{ categoryId: category.id, verdict: 'ABSENT' }] }, actor.id);
    assert.equal(updated.version, 2);
    await assert.rejects(module.exports.saveVideoExample({ ...fields, id: created.id, version: 1 }, actor.id), error => error.code === 'EXAMPLE_CONFLICT');
    await appendFile(file, Buffer.from([0]));
    saved = await module.exports.readVideoExamples(movie.id);
    assert.equal(saved.examples[0].stale, true);
    await assert.rejects(module.exports.saveVideoExample({ ...fields, id: created.id, version: 2 }, actor.id), error => error.code === 'VIDEO_CHANGED');
    await module.exports.removeVideoExample(created.id, 2);
    assert.equal(await prisma.videoExample.count({ where: { movieId: movie.id } }), 0);
    console.log('PASS: real media bounds, bilingual snapshots, duplicate-request protection, version conflicts, stale-file detection, versioned deletion and no automatic category assignment');
  } finally {
    if (movie) await prisma.movie.deleteMany({ where: { id: movie.id } });
    if (category) await prisma.category.deleteMany({ where: { id: category.id } });
    await rm(file, { force: true });
    await prisma.$disconnect();
  }
})().then(() => process.exit(0), error => { console.error(error.code || error.message); process.exit(1); });
`;
try {
  process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], { input: `${bundled.outputFiles[0].text}\n${check}`, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 }));
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  process.exitCode = 1;
}
