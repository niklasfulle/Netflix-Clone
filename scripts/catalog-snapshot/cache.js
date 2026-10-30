/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { createClient } = require('redis');
const { SnapshotError } = require('./model');

async function connectCache(environment, target) {
  if (environment.REDIS_ENABLED !== 'true') return null;
  const prefix = `netflix:${target}:`;
  if (!environment.REDIS_URL || environment.REDIS_KEY_PREFIX !== prefix) {
    throw new SnapshotError('Redis configuration must use the isolated target namespace.');
  }
  const client = createClient({ url: environment.REDIS_URL, socket: { connectTimeout: 5000, reconnectStrategy: false } });
  client.on('error', () => {});
  try { await client.connect(); } catch {
    client.destroy();
    throw new SnapshotError('Target cache is unavailable; import stopped before database changes.');
  }
  return {
    async clear() {
      for await (const keys of client.scanIterator({ MATCH: `${prefix}v*:catalog-metadata:*`, COUNT: 100 })) {
        if (keys.length) await client.del(keys);
      }
    },
    async close() {
      if (!client.isOpen) return;
      try { await client.quit(); } catch { if (client.isOpen) client.destroy(); }
    },
  };
}

module.exports = { connectCache };
