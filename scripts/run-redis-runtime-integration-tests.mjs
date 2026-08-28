import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

const image = 'redis:7.2.15-alpine@sha256:05a97a479bc73de66f087dc05b569010772880f778cc8671fa6b8aadee32e5c6';
const containerName = `netflix-redis-adapter-${randomUUID()}`;

function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a loopback port'));
        return;
      }
      server.close(error => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && options.check !== false) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
  return result;
}

function waitForRedis() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const result = run('docker', ['exec', containerName, 'redis-cli', 'ping'], {
      capture: true,
      check: false,
    });
    if (result.status === 0 && result.stdout.trim() === 'PONG') return;
  }
  throw new Error('Redis integration container did not become ready');
}

try {
  const hostPort = await reserveLoopbackPort();
  run('docker', [
    'run',
    '--detach',
    '--name', containerName,
    '--publish', `127.0.0.1:${hostPort}:6379`,
    '--user', '999:1000',
    '--read-only',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true',
    '--memory', '128m',
    '--pids-limit', '100',
    '--tmpfs', '/data:rw,size=16m,mode=0700,uid=999,gid=1000',
    '--tmpfs', '/tmp:rw,size=8m,mode=1777',
    image,
    'redis-server',
    '--save', '',
    '--appendonly', 'no',
    '--maxmemory', '8mb',
    '--maxmemory-policy', 'allkeys-lfu',
    '--protected-mode', 'no',
  ], { capture: true });
  waitForRedis();

  const portResult = run('docker', ['port', containerName, '6379/tcp'], { capture: true });
  if (portResult.stdout.trim() !== `127.0.0.1:${hostPort}`) {
    throw new Error('Docker did not publish Redis on the reserved loopback port');
  }

  const testResult = run(process.execPath, [
    'node_modules/jest/bin/jest.js',
    'lib/redis/__tests__/runtime.integration.test.ts',
    '--runInBand',
    '--coverage=false',
  ], {
    env: {
      ...process.env,
      RUN_REDIS_RUNTIME_ADAPTER_INTEGRATION: '1',
      REDIS_INTEGRATION_CONTAINER: containerName,
      REDIS_INTEGRATION_URL: `redis://127.0.0.1:${hostPort}/0`,
    },
    check: false,
  });
  process.exitCode = testResult.status ?? 1;
} finally {
  run('docker', ['rm', '--force', containerName], { check: false, capture: true });
}
