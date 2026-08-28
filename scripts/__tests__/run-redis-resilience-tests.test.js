/** @jest-environment node */

const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

describe('Redis resilience release runner', () => {
  it('publishes a credential-free local and Docker verification plan', () => {
    const root = join(__dirname, '..', '..');
    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'run-redis-resilience-tests.mjs'), '--list'],
      { cwd: root, encoding: 'utf8' },
    );

    expect(result.status).toBe(0);
    const plan = JSON.parse(result.stdout);
    expect(plan.map(stage => stage.name)).toEqual([
      'unit-parity-and-resilience',
      'ansible-release-contracts',
      'redis-adapter-integration',
      'redis-runtime-integration',
    ]);
    expect(plan.filter(stage => stage.requiresDocker).map(stage => stage.name)).toEqual([
      'redis-adapter-integration',
      'redis-runtime-integration',
    ]);

    const serializedPlan = JSON.stringify(plan).toLowerCase();
    expect(serializedPlan).not.toContain('.env');
    expect(serializedPlan).not.toContain('token');
    expect(serializedPlan).not.toContain('github');

    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(packageJson.scripts['test:redis-resilience']).toBe(
      'node scripts/run-redis-resilience-tests.mjs',
    );
  });
});
