import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ignoreNextServerOnlyMarker = {
  name: 'ignore-next-server-only-marker',
  setup(buildContext) {
    buildContext.onResolve({ filter: /^server-only$/ }, () => ({
      path: 'server-only',
      namespace: 'worker-server-only',
    }));
    buildContext.onLoad({ filter: /.*/, namespace: 'worker-server-only' }, () => ({
      contents: '',
      loader: 'js',
    }));
  },
};

await build({
  absWorkingDir: projectRoot,
  entryPoints: [resolve(projectRoot, 'worker/job-worker.ts')],
  outfile: resolve(projectRoot, '.worker/job-worker.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22.12',
  packages: 'external',
  plugins: [ignoreNextServerOnlyMarker],
  sourcemap: true,
  logLevel: 'info',
});
