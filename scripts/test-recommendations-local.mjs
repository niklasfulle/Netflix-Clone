// Creates and removes only neutral catalog fixtures; never prints catalog names.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundled = await build({
  stdin: { contents: "export { videoRecommendations } from './lib/recommendations/service';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-marker', setup(context) {
    context.onResolve({ filter: /^server-only$/ }, () => ({ path: 'marker', namespace: 'empty' }));
    context.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
const check = String.raw`
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const recommendationCheckDb = new PrismaClient();
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  const marker = 'recommendation-check-' + randomUUID();
  const ids = [];
  let actor, category;
  try {
    actor = await recommendationCheckDb.actor.create({ data: { name: marker } });
    category = await recommendationCheckDb.category.create({ data: { name: marker, nameEn: marker, normalizedName: marker } });
    for (let i = 0; i < 9; i++) {
      const hasActor = [0, 1, 2, 7, 8].includes(i);
      const hasCategory = i === 0 || i >= 3;
      const movie = await recommendationCheckDb.movie.create({ data: {
        title: 'Neutral recommendation fixture ' + i, description: 'Local integration fixture',
        videoUrl: 'local-demo.mp4', thumbnailUrl: '/images/hero.jpg', type: i % 2 ? 'Serie' : 'Movie',
        genre: 'Drama', duration: '00:12', status: i === 7 ? 'DRAFT' : i === 8 ? 'ARCHIVED' : 'PUBLISHED',
        ...(hasActor ? { actors: { create: [{ actorId: actor.id }] } } : {}),
        ...(hasCategory && i % 2 === 0 ? { categories: { create: [{ categoryId: category.id }] } } : {}),
        ...(hasCategory && i % 2 === 1 ? { categorySegments: { create: [{ categoryId: category.id, startSeconds: 1, endSeconds: 5 }] } } : {}),
      } });
      ids.push(movie.id);
    }
    const result = await module.exports.videoRecommendations(ids[0]);
    assert.equal(result.length, 6); assert.equal(new Set(result.map(item => item.id)).size, 6);
    assert.deepEqual(new Set(result.slice(0, 2).map(item => item.id)), new Set([ids[1], ids[2]]));
    assert(result.slice(0, 2).every(item => item.reason === 'same-actor'));
    assert(result.slice(2).every(item => item.reason === 'similar-categories'));
    assert(result.every(item => ids.slice(1, 7).includes(item.id)));
    assert.equal(await module.exports.videoRecommendations(ids[7]), null);
    console.log('PASS: six unique published suggestions, first two share an actor, global and interval categories matched, source/drafts/archives excluded');
  } finally {
    if (ids.length) {
      await recommendationCheckDb.movieActor.deleteMany({ where: { movieId: { in: ids } } });
      await recommendationCheckDb.movie.deleteMany({ where: { id: { in: ids } } });
    }
    if (actor) await recommendationCheckDb.actor.delete({ where: { id: actor.id } });
    if (category) await recommendationCheckDb.category.delete({ where: { id: category.id } });
    await recommendationCheckDb.$disconnect();
  }
})().then(() => process.exit(0), error => { console.error(error.code || 'Recommendation integration check failed'); process.exit(1); });
`;
process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], {
  input: `${bundled.outputFiles[0].text}\n${check}`, encoding: 'utf8', timeout: 60_000, maxBuffer: 256 * 1024,
}));
