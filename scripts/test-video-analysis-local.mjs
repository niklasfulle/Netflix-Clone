// Requires the local app, jobs-worker and analysis profile to be running.
// Creates and removes its own neutral video and database fixtures only.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundle = await build({
  stdin: { contents: "export { submitVideoAnalysis, reviewVideoSuggestions } from './lib/video-analysis/service'; export { classifyVideoFrames, translateCategoryName } from './lib/video-analysis/model';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node',
  format: 'cjs', packages: 'external', write: false,
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
const prisma = new PrismaClient();
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  const marker = 'analysis-check-' + randomUUID();
  const file = '/movies/' + marker + '.mp4';
  let movie, jobId, categoryId;
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isBlocked: false }, select: { id: true } });
    assert(admin, 'Local administrator required');
    const frame = run('/usr/local/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=512x288:rate=1', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1']);
    const negativeLabel = process.env.VIDEO_ANALYSIS_NEGATIVE_LABEL || 'Unrelated category';
    const negative = await module.exports.classifyVideoFrames([frame, frame, frame], [negativeLabel]);
    assert(!negative.tags.some(tag => tag.name.toLowerCase() === negativeLabel.toLowerCase()), 'A technical test pattern must not match the configured negative-control label');
    assert(negative.tags.every(tag => tag.name && tag.nameEn));
    const translated = await module.exports.translateCategoryName('Outdoor scene');
    assert(translated.name && translated.nameEn);
    assert.notEqual(translated.name.toLowerCase(), translated.nameEn.toLowerCase());
    console.log('PASS: neutral negative control and bilingual metadata translation');
    run('/usr/local/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24', '-t', '12', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', file]);
    movie = await prisma.movie.create({ data: { title: marker, description: 'Neutral integration fixture', videoUrl: marker + '.mp4', thumbnailUrl: '/placeholder.jpg', type: 'Movie', genre: 'Drama', duration: '00:12', status: 'DRAFT' } });
    const submitted = await module.exports.submitVideoAnalysis(movie.id, admin.id);
    jobId = submitted.jobRunId;
    console.log('Synthetic video queued');
    let job;
    for (let attempt = 0; attempt < 300; attempt++) {
      job = await prisma.jobRun.findUnique({ where: { id: jobId } });
      if (['SUCCEEDED', 'FAILED', 'DEAD_LETTER', 'CANCELLED'].includes(job.status)) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const analysis = await prisma.videoAnalysis.findUnique({ where: { id: submitted.analysisId }, include: { samples: true, suggestions: true } });
    console.log(JSON.stringify({ job: job.status, errorCode: job.errorCode, analysis: analysis.status, analysisError: analysis.errorCode, processed: analysis.processedCount, samples: analysis.samples.length, suggestions: analysis.suggestions.length }));
    assert.equal(job.status, 'SUCCEEDED');
    assert.equal(analysis.samples.length, 12);
    assert.equal(analysis.samplingProfile, 'thorough-v1');
    assert.equal(analysis.processedCount, 12);
    assert(analysis.samples.every(sample => Array.isArray(sample.tags.tags) && typeof sample.tags.uncertain === 'boolean' && sample.tags.tags.every(tag => tag.name && tag.nameEn)));
    const cached = await module.exports.submitVideoAnalysis(movie.id, admin.id);
    assert(cached.duplicate && cached.analysisId === analysis.id);
    // The model may legitimately return no categories for a neutral test pattern.
    // A controlled suggestion tests the explicit review independently of its labels.
    const name = 'QA Videoanalyse ' + randomUUID();
    const suggestion = await prisma.videoCategorySuggestion.create({ data: { analysisId: analysis.id, name, nameEn: name, normalizedName: name.toLowerCase(), confidence: 0.9, evidence: [1] } });
    assert.equal(await prisma.movieCategory.count({ where: { movieId: movie.id } }), 0);
    const accepted = await module.exports.reviewVideoSuggestions(analysis.id, [suggestion.id], 'ACCEPT');
    assert.equal(accepted.changed, 1);
    categoryId = (await prisma.category.findUnique({ where: { normalizedName: name.toLowerCase() } })).id;
    assert.equal((await prisma.category.findUnique({ where: { id: categoryId } })).nameEn, name);
    assert(await prisma.movieCategory.findUnique({ where: { movieId_categoryId: { movieId: movie.id, categoryId } } }));
    assert.equal((await module.exports.reviewVideoSuggestions(analysis.id, [suggestion.id], 'ACCEPT')).changed, 0);
    console.log('PASS: real GPU queue, twelve thorough-profile samples, cache reuse, explicit category creation and assignment, idempotent acceptance');
  } finally {
    // Never remove an active job's input; retain the fixture for diagnosis on timeout.
    const job = jobId ? await prisma.jobRun.findUnique({ where: { id: jobId }, select: { status: true } }) : null;
    if (!job || !['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(job.status)) {
      if (movie) await prisma.movie.delete({ where: { id: movie.id } });
      if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
      if (jobId) await prisma.jobRun.delete({ where: { id: jobId } });
      await rm(file, { force: true });
    } else console.log('Fixture retained because its job is still active');
    await prisma.$disconnect();
  }
})().then(() => process.exit(0), error => { console.error(error.message); process.exit(1); });
`;

try {
  process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], {
    input: `${bundle.outputFiles[0].text}\n${check}`, encoding: 'utf8', timeout: 350_000, maxBuffer: 1024 * 1024,
  }));
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  process.exitCode = 1;
}
