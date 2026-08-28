import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const jest = [
  'node_modules/jest/bin/jest.js',
  '--runInBand',
  '--coverage=false',
  '--runTestsByPath',
  'lib/redis/__tests__/runtime.test.ts',
  'lib/redis/__tests__/runtime-connected.test.ts',
  'lib/administration/__tests__/summary-cache.test.ts',
  'data/__tests__/redis-auth-rate-limit.test.ts',
  'lib/jobs/__tests__/coordination.test.ts',
  'lib/jobs/__tests__/submission.test.ts',
  'lib/jobs/__tests__/repository.test.ts',
  'lib/jobs/__tests__/worker.test.ts',
  'lib/jobs/__tests__/worker-lifecycle.test.ts',
  'lib/jobs/__tests__/retry.test.ts',
  'lib/jobs/__tests__/control.test.ts',
  'lib/jobs/__tests__/worker-heartbeat.test.ts',
  'lib/jobs/__tests__/administration.test.ts',
  'lib/jobs/__tests__/retention.test.ts',
  'lib/operations/__tests__/lease.test.ts',
];

const stages = [
  {
    name: 'unit-parity-and-resilience',
    requiresDocker: false,
    command: process.execPath,
    arguments: jest,
  },
  {
    name: 'ansible-release-contracts',
    requiresDocker: false,
    command: python,
    arguments: [
      '-m',
      'unittest',
      'ansible.tests.test_redis_provisioning_contract',
      'ansible.tests.test_deployment_contract',
      '-v',
    ],
  },
  {
    name: 'redis-adapter-integration',
    requiresDocker: true,
    command: process.execPath,
    arguments: ['scripts/run-redis-runtime-integration-tests.mjs'],
  },
  {
    name: 'redis-runtime-integration',
    requiresDocker: true,
    command: python,
    arguments: ['-m', 'unittest', 'ansible.tests.test_redis_runtime_integration', '-v'],
    environment: { RUN_REDIS_INTEGRATION: '1' },
  },
];

const supportedArguments = new Set(['--list', '--with-docker']);
const unknownArguments = process.argv.slice(2).filter(argument => !supportedArguments.has(argument));
if (unknownArguments.length > 0) {
  throw new Error(`Unknown argument: ${unknownArguments.join(', ')}`);
}

if (process.argv.includes('--list')) {
  console.log(JSON.stringify(stages.map(stage => ({
    name: stage.name,
    requiresDocker: stage.requiresDocker,
    command: [stage.command, ...stage.arguments],
  }))));
  process.exit(0);
}

const includeDocker = process.argv.includes('--with-docker');
const selectedStages = stages.filter(stage => includeDocker || !stage.requiresDocker);
const results = [];

for (const stage of selectedStages) {
  console.log(`\n[redis-resilience] ${stage.name}`);
  const result = spawnSync(stage.command, stage.arguments, {
    cwd: root,
    env: { ...process.env, ...stage.environment },
    stdio: 'inherit',
  });
  const status = result.status ?? 1;
  results.push({ name: stage.name, status });
  if (result.error) console.error(result.error.message);
  if (status !== 0) break;
}

console.log('\nRedis resilience verification summary');
for (const result of results) {
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${result.name}`);
}

const failed = results.find(result => result.status !== 0);
process.exitCode = failed ? failed.status : 0;
