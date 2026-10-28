import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundled = await build({ entryPoints: ['lib/category-import.ts'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-marker', setup(context) {
    context.onResolve({ filter: /^server-only$/ }, () => ({ path: 'marker', namespace: 'empty' }));
    context.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
const check = String.raw`
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const prisma = new PrismaClient();
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  const marker = 'category-check-' + randomUUID();
  const firstName = marker + '-one';
  const secondName = marker + '-two';
  let movie, category;
  try {
    category = await prisma.category.create({ data: { name: firstName, nameEn: 'Original English name', normalizedName: firstName, color: '#38BDF8' } });
    movie = await prisma.movie.create({ data: { title: marker, description: 'Neutral integration fixture', videoUrl: 'local-demo.mp4', thumbnailUrl: '/placeholder.jpg', type: 'Movie', genre: 'Documentary', duration: '00:12', status: 'DRAFT' } });
    await prisma.movieCategory.create({ data: { movieId: movie.id, categoryId: category.id } });
    const document = { schemaVersion: 1, categories: [{ name: firstName, nameEn: 'Updated English name', color: '#FB7185' }, { name: secondName, nameEn: 'New English name' }] };
    assert.deepEqual(await module.exports.importCategories(document), { created: 1, updated: 1, unchanged: 0, total: 2 });
    const updated = await prisma.category.findUnique({ where: { normalizedName: firstName } });
    assert.equal(updated.id, category.id);
    assert.equal(updated.nameEn, 'Updated English name');
    assert.equal(updated.color, '#FB7185');
    const created = await prisma.category.findUnique({ where: { normalizedName: secondName } });
    assert.match(created.color, /^#[0-9A-F]{6}$/);
    assert(await prisma.movieCategory.findUnique({ where: { movieId_categoryId: { movieId: movie.id, categoryId: category.id } } }));
    assert.deepEqual(await module.exports.importCategories(document), { created: 0, updated: 0, unchanged: 2, total: 2 });
    const legacy = { ...document, categories: document.categories.map(({ name, nameEn }) => ({ name, nameEn })) };
    assert.deepEqual(await module.exports.importCategories(legacy), { created: 0, updated: 0, unchanged: 2, total: 2 });
    assert.equal((await prisma.category.findUnique({ where: { normalizedName: firstName } })).color, '#FB7185');
    console.log('PASS: stored colors, automatic colors, legacy imports preserve colors, bilingual updates, stable IDs and assignments, idempotent imports');
  } finally {
    if (movie) await prisma.movie.deleteMany({ where: { id: movie.id } });
    await prisma.category.deleteMany({ where: { normalizedName: { in: [firstName, secondName] } } });
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
