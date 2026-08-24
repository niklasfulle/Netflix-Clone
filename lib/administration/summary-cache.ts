import type { RedisRuntime } from '@/lib/redis/runtime';

export type SummaryCacheSource =
  | 'hit'
  | 'miss'
  | 'stale'
  | 'fallback'
  | 'deduplicated';

export type SummaryCacheDefinition<T> = {
  namespace: string;
  version: number;
  identities: readonly string[];
  ttlSeconds: number;
  maxValueBytes: number;
  decode(value: unknown): T;
  load(): Promise<T>;
};

export type SummaryCacheResult<T> = {
  value: T;
  source: SummaryCacheSource;
  cacheReadMs: number;
  loadMs: number;
  stored: boolean;
};

type LoadedValue = {
  value: unknown;
  loadMs: number;
  stored: boolean;
};

type SummaryCacheOptions = {
  redis: RedisRuntime;
  now?: () => number;
};

function serializedSize(value: unknown): number {
  try {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? Number.POSITIVE_INFINITY : Buffer.byteLength(encoded, 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function createSummaryCache({ redis, now = Date.now }: SummaryCacheOptions) {
  const inFlight = new Map<string, Promise<LoadedValue>>();
  const generations = new Map<string, number>();
  const dirtyKeys = new Set<string>();

  function keyFor(definition: Pick<SummaryCacheDefinition<unknown>, 'namespace' | 'version' | 'identities'>) {
    return redis.key(definition.namespace, definition.version, definition.identities);
  }

  return {
    async read<T>(definition: SummaryCacheDefinition<T>): Promise<SummaryCacheResult<T>> {
      const key = keyFor(definition);
      const readStartedAt = now();
      const cached = dirtyKeys.has(key)
        ? { status: 'skipped' as const, reason: 'disabled' as const }
        : await redis.get(key, definition.decode);
      const cacheReadMs = Math.max(0, now() - readStartedAt);
      if (cached.status === 'ok' && cached.value !== null) {
        return {
          value: cached.value,
          source: 'hit',
          cacheReadMs,
          loadMs: 0,
          stored: true,
        };
      }

      let source: Exclude<SummaryCacheSource, 'hit' | 'deduplicated'> = 'fallback';
      if (cached.status === 'ok') {
        source = 'miss';
      } else if (cached.status === 'error' && cached.reason === 'invalid-data') {
        source = 'stale';
        await redis.delete(key);
      }

      const pending = inFlight.get(key);
      if (pending) {
        const loaded = await pending;
        return {
          value: loaded.value as T,
          source: 'deduplicated',
          cacheReadMs,
          loadMs: loaded.loadMs,
          stored: loaded.stored,
        };
      }

      const generation = generations.get(key) ?? 0;
      const loadPromise = (async (): Promise<LoadedValue> => {
        const loadStartedAt = now();
        const value = await definition.load();
        const loadMs = Math.max(0, now() - loadStartedAt);
        let stored = false;
        if (
          serializedSize(value) <= definition.maxValueBytes
          && (generations.get(key) ?? 0) === generation
        ) {
          stored = (await redis.set(key, value, { ttlSeconds: definition.ttlSeconds })).status === 'ok';
          if (stored) dirtyKeys.delete(key);
        }
        return { value, loadMs, stored };
      })();
      inFlight.set(key, loadPromise);

      try {
        const loaded = await loadPromise;
        return {
          value: loaded.value as T,
          source,
          cacheReadMs,
          loadMs: loaded.loadMs,
          stored: loaded.stored,
        };
      } finally {
        if (inFlight.get(key) === loadPromise) inFlight.delete(key);
      }
    },

    async invalidate(
      definitions: readonly Pick<SummaryCacheDefinition<unknown>, 'namespace' | 'version' | 'identities'>[],
    ): Promise<void> {
      const keys = definitions.map(keyFor);
      for (const key of keys) {
        generations.set(key, (generations.get(key) ?? 0) + 1);
        dirtyKeys.add(key);
        inFlight.delete(key);
      }
      const results = await Promise.all(keys.map(key => redis.delete(key)));
      for (const [index, result] of results.entries()) {
        if (result.status === 'ok') dirtyKeys.delete(keys[index]);
      }
    },
  };
}

export function createRequestDeduplicator() {
  const inFlight = new Map<string, Promise<unknown>>();
  return {
    async run<T>(key: string, load: () => Promise<T>): Promise<{ value: T; deduplicated: boolean }> {
      const pending = inFlight.get(key);
      if (pending) {
        return { value: await pending as T, deduplicated: true };
      }

      const loadPromise = load();
      inFlight.set(key, loadPromise);
      try {
        return { value: await loadPromise, deduplicated: false };
      } finally {
        if (inFlight.get(key) === loadPromise) inFlight.delete(key);
      }
    },
  };
}

export function cacheTelemetryHeaders(result: Pick<SummaryCacheResult<unknown>, 'source' | 'cacheReadMs' | 'loadMs'>) {
  return {
    'Cache-Control': 'private, no-store',
    'X-Admin-Cache': result.source,
    'Server-Timing': [
      `redis;dur=${result.cacheReadMs}`,
      `postgres;dur=${result.loadMs}`,
    ].join(', '),
  };
}
