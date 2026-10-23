/** @jest-environment node */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assertLocalDatabase, localAccounts, localCatalog, LOCAL_AVATARS } = require('../seed-local');

describe('local demo seed boundaries', () => {
  it.each([[], ['--credentials']])('rejects non-local CLI execution with arguments %j', (...args) => {
    const result = spawnSync(process.execPath, [path.join(__dirname, '../seed-local.mjs'), ...args], {
      env: { ...process.env, DEPLOYMENT_ENVIRONMENT: 'production' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Demo data can only be seeded in the local environment');
    expect(result.stdout).toBe('');
  });
  it('provides distinct generated images using paths relative to the profile image root', () => {
    expect(LOCAL_AVATARS).toHaveLength(4);
    expect(new Set(LOCAL_AVATARS.map(avatar => avatar.url)).size).toBe(4);
    for (const avatar of LOCAL_AVATARS) {
      expect(avatar.url.startsWith('generated/')).toBe(true);
      expect(fs.existsSync(path.join(__dirname, '../../public/images/profil', avatar.url))).toBe(true);
    }
  });
  it('rejects other environments before touching the database', async () => {
    const db = { $queryRaw: jest.fn() };
    for (const DEPLOYMENT_ENVIRONMENT of ['production', 'staging', undefined]) {
      await expect(assertLocalDatabase(db, { DEPLOYMENT_ENVIRONMENT })).rejects.toThrow('local environment');
    }
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it('requires the exact isolated database name', async () => {
    const db = { $queryRaw: jest.fn() };
    for (const database_name of ['netflix', 'netflix_staging', 'netflix_local_backup']) {
      db.$queryRaw.mockResolvedValue([{ database_name }]);
      await expect(assertLocalDatabase(db, { DEPLOYMENT_ENVIRONMENT: 'local' })).rejects.toThrow('netflix_local');
    }
    db.$queryRaw.mockResolvedValue([{ database_name: 'netflix_local' }]);
    await expect(assertLocalDatabase(db, { DEPLOYMENT_ENVIRONMENT: 'local' })).resolves.toBeUndefined();
  });

  it('keeps demo credentials stable within an installation and distinct between installations', () => {
    const first = localAccounts({ AUTH_SECRET: 'test-installation-one' });
    expect(first).toEqual(localAccounts({ AUTH_SECRET: 'test-installation-one' }));
    expect(first[0].password).not.toBe(localAccounts({ AUTH_SECRET: 'test-installation-two' })[0].password);
    expect(first.map(account => account.role)).toEqual(['ADMIN', 'USER']);
    expect(() => localAccounts({})).toThrow('AUTH_SECRET');
  });

  it('includes public movies and series plus hidden admin fixtures using configured genres', () => {
    const titles = localCatalog({ NEXT_PUBLIC_GENRE: 'Action, Drama,Action' });
    expect(titles.filter(title => title.status === 'PUBLISHED')).toHaveLength(14);
    expect(new Set(titles.map(title => title.status))).toEqual(new Set(['PUBLISHED', 'DRAFT', 'ARCHIVED']));
    expect(new Set(titles.map(title => title.type))).toEqual(new Set(['Movie', 'Serie']));
    expect(titles.every(title => ['Action', 'Drama'].includes(title.genre))).toBe(true);
    expect(() => localCatalog({})).toThrow('NEXT_PUBLIC_GENRE');
  });
});
