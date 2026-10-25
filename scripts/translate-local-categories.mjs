// Add missing bilingual metadata through the private local model, preserving IDs.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const bundled = await build({ entryPoints: ['lib/video-analysis/model.ts'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const execute = String.raw`
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  if (process.env.DEPLOYMENT_ENVIRONMENT !== 'local') throw Error('Local environment required');
  let categories = 0, suggestions = 0;
  try {
    const existing = await prisma.category.findMany({ where: { nameEn: '' }, select: { id: true, name: true } });
    for (const category of existing) {
      const translated = await module.exports.translateCategoryName(category.name);
      const result = await prisma.category.updateMany({ where: { id: category.id, name: category.name, nameEn: '' }, data: { ...translated, normalizedName: translated.name.toLowerCase() } });
      categories += result.count;
    }
    const pending = await prisma.videoCategorySuggestion.findMany({ where: { nameEn: '', state: 'PENDING' }, select: { id: true, name: true } });
    for (const suggestion of pending) {
      const translated = await module.exports.translateCategoryName(suggestion.name);
      // Suggestions were generated in German. Preserve those review labels and
      // their unique keys: a translator may canonicalize two German synonyms
      // to the same wording even though they are separate pending suggestions.
      const result = await prisma.videoCategorySuggestion.updateMany({ where: { id: suggestion.id, name: suggestion.name, nameEn: '', state: 'PENDING' }, data: { nameEn: translated.nameEn } });
      suggestions += result.count;
    }
    console.log(JSON.stringify({ translatedCategories: categories, translatedSuggestions: suggestions }));
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error('Category translation failed', error.code || 'MODEL_OR_DATABASE_ERROR'); process.exitCode = 1; });
`;
try {
  process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], {
    input: `${bundled.outputFiles[0].text}\n${execute}`, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 1024 * 1024,
  }));
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  process.exitCode = 1;
}
