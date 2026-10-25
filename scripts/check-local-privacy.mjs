import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const localConfig = '.env.video-analysis.local';
if (process.argv.includes('--require-local-config') && !existsSync(localConfig)) throw Error('Local privacy configuration is required before pushing.');
if (existsSync(localConfig)) process.loadEnvFile(localConfig);
const files = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const isLocalOnlyPath = file => file.startsWith('.local-private/') || /(^|\/)video-examples-[^/]*\.json$/.test(file) || (/(^|\/)\.env(?:[._]|$)/.test(file) && !file.endsWith('.example'));
const forbiddenFiles = files.filter(isLocalOnlyPath);
if (forbiddenFiles.length) {
  console.error('Local-only files are tracked:', forbiddenFiles.join(', '));
  process.exit(1);
}
const terms = JSON.parse(process.env.VIDEO_ANALYSIS_PRIVATE_TERMS || '[]');
if (!Array.isArray(terms) || terms.some(term => typeof term !== 'string' || !term.trim() || /[\r\n]/.test(term))) throw Error('Invalid local privacy configuration');
if (terms.length) {
  const checkTree = (ref) => {
    try {
      const scope = ref === '--cached' ? ['--cached'] : [ref];
      const matches = execFileSync('git', ['grep', '-I', '-l', '-i', '-F', '-f', '-', ...scope, '--'], { input: terms.join('\n'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      if (matches.trim()) { console.error('Local-only terms occur in a publishable tree:', matches.trim()); process.exit(1); }
    } catch (error) { if (error.status !== 1) throw error; }
  };
  checkTree('--cached');
  const tips = process.argv.includes('--pre-push')
    ? readFileSync(0, 'utf8').trim().split('\n').filter(Boolean).map(line => line.split(/\s+/)[1]).filter(sha => !/^0+$/.test(sha))
    : ['HEAD'];
  const visited = new Set();
  for (const tip of tips) {
    const commits = execFileSync('git', ['rev-list', tip, '--not', '--remotes=origin'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    for (const commit of commits) {
      if (visited.has(commit)) continue;
      visited.add(commit);
      const message = execFileSync('git', ['show', '-s', '--format=%B', commit], { encoding: 'utf8' }).toLowerCase();
      if (terms.some(term => message.includes(term.toLowerCase()))) { console.error('Local-only terms occur in unpublished commit messages. Clean the local history before pushing.'); process.exit(1); }
      const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', commit], { encoding: 'utf8' }).split('\n');
      if (paths.some(isLocalOnlyPath)) { console.error('A local-only file occurs in unpublished history.'); process.exit(1); }
      checkTree(commit);
    }
  }
}
console.log('Local privacy check passed.');
