import 'server-only';

import { createHash } from 'node:crypto';
import { createClient } from 'redis';

import { logBackendAction } from '@/lib/logger';

export type RedisKey = string & { readonly __redisKey: unique symbol };

export type RedisResult<T> =
  | { status: 'ok'; value: T; latencyMs: number }
  | { status: 'skipped'; reason: 'disabled' | 'circuit-open' | 'closed' }
  | { status: 'error'; reason: 'timeout' | 'unavailable' | 'invalid-data'; latencyMs: number };

export type RedisHealth = {
  status: 'disabled' | 'ok' | 'degraded' | 'closed';
  configured: boolean;
  connected: boolean;
  circuit: 'closed' | 'open';
  metrics: {
    commands: number;
    hits: number;
    misses: number;
    errors: number;
    timeouts: number;
    reconnects: number;
    fallbacks: number;
    totalLatencyMs: number;
  };
};

export type RedisRuntime = {
  key(namespace: string, version: number, identities: readonly string[]): RedisKey;
  get<T>(key: RedisKey, decode: (value: unknown) => T): Promise<RedisResult<T | null>>;
  set<T>(key: RedisKey, value: T, options: { ttlSeconds: number }): Promise<RedisResult<true>>;
  delete(key: RedisKey): Promise<RedisResult<boolean>>;
  health(): Promise<RedisHealth>;
  close(): Promise<void>;
};

export type RedisRuntimeOptions = {
  environment: string;
  url?: string;
  connectTimeoutMs?: number;
  commandTimeoutMs?: number;
  circuitCooldownMs?: number;
  telemetry?: (event: RedisTelemetryEvent) => void;
};

export type RedisTelemetryEvent =
  | 'reconnecting'
  | 'circuit-opened'
  | 'circuit-closed'
  | 'closed';

const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const ENVIRONMENT_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const MAX_VALUE_BYTES = 64 * 1024;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const DEFAULT_CIRCUIT_COOLDOWN_MS = 5_000;

class InvalidRedisDataError extends Error {}
class RedisTimeoutError extends Error {}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new RedisTimeoutError('Redis operation exceeded its deadline'));
    }, timeoutMs);
    timeout.unref?.();
    operation.then(
      value => {
        clearTimeout(timeout);
        resolve(value);
      },
      error => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof RedisTimeoutError) return true;
  if (!(error instanceof Error)) return false;
  const code = 'code' in error ? error.code : undefined;
  return code === 'ETIMEDOUT' || error.name.toLowerCase().includes('timeout');
}

function redisFailureReason(error: unknown): 'invalid-data' | 'timeout' | 'unavailable' {
  if (error instanceof InvalidRedisDataError) return 'invalid-data';
  if (isTimeoutError(error)) return 'timeout';
  return 'unavailable';
}

export function createRedisRuntime(options: RedisRuntimeOptions): RedisRuntime {
  if (!ENVIRONMENT_PATTERN.test(options.environment)) {
    throw new Error('Redis environment must be a lowercase identifier');
  }

  if (options.url) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(options.url);
    } catch {
      throw new Error('Redis URL is invalid');
    }
    if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
      throw new Error('Redis URL must use redis:// or rediss://');
    }
  }

  const connectTimeoutMs = options.connectTimeoutMs ?? 500;
  const commandTimeoutMs = options.commandTimeoutMs ?? 250;
  const circuitCooldownMs = options.circuitCooldownMs ?? DEFAULT_CIRCUIT_COOLDOWN_MS;
  if (connectTimeoutMs < 50 || connectTimeoutMs > 10_000) {
    throw new Error('Redis connect timeout must be between 50 and 10000 milliseconds');
  }
  if (commandTimeoutMs < 25 || commandTimeoutMs > 5_000) {
    throw new Error('Redis command timeout must be between 25 and 5000 milliseconds');
  }
  if (circuitCooldownMs < 25 || circuitCooldownMs > 60_000) {
    throw new Error('Redis circuit cooldown must be between 25 and 60000 milliseconds');
  }

  let closed = false;
  let client: ReturnType<typeof createClient> | undefined;
  let connectPromise: Promise<void> | undefined;
  let consecutiveFailures = 0;
  let circuitOpenedAt: number | undefined;
  let circuitRecoveryPending = false;
  const metrics = {
    commands: 0,
    hits: 0,
    misses: 0,
    errors: 0,
    timeouts: 0,
    reconnects: 0,
    fallbacks: 0,
    totalLatencyMs: 0,
  };

  function circuitIsOpen(): boolean {
    if (circuitOpenedAt === undefined) return false;
    if (Date.now() - circuitOpenedAt < circuitCooldownMs) return true;
    circuitOpenedAt = undefined;
    consecutiveFailures = 0;
    circuitRecoveryPending = true;
    return false;
  }

  function emitTelemetry(event: RedisTelemetryEvent): void {
    try {
      options.telemetry?.(event);
    } catch {
      // Telemetry must never change Redis fallback behavior.
    }
  }

  const skipped = (reason?: 'disabled' | 'circuit-open' | 'closed'): RedisResult<never> => {
    metrics.fallbacks += 1;
    return {
      status: 'skipped',
      reason: reason ?? (closed ? 'closed' : 'disabled'),
    };
  };

  function redisClient() {
    if (client) return client;
    if (!options.url) throw new Error('Redis is disabled');

    client = createClient({
      url: options.url,
      disableOfflineQueue: true,
      commandsQueueMaxLength: 100,
      commandOptions: { timeout: commandTimeoutMs },
      socket: {
        connectTimeout: connectTimeoutMs,
        reconnectStrategy: retries => {
          const cappedRetries = Math.min(retries, 5);
          const delay = Math.min(50 * (2 ** cappedRetries), 1_000);
          return delay + Math.floor(Math.random() * 100);
        },
      },
    });
    client.on('error', () => undefined);
    client.on('reconnecting', () => {
      metrics.reconnects += 1;
      emitTelemetry('reconnecting');
    });
    return client;
  }

  async function connectedClient() {
    const currentClient = redisClient();
    if (currentClient.isReady) return currentClient;

    if (!currentClient.isOpen) {
      if (!connectPromise) {
        if (circuitRecoveryPending) {
          metrics.reconnects += 1;
          emitTelemetry('reconnecting');
        }
        connectPromise = withTimeout(
          currentClient.connect().then(() => undefined),
          connectTimeoutMs,
        ).finally(() => {
          connectPromise = undefined;
        });
      }
      await connectPromise;
    }

    if (!currentClient.isReady) {
      throw new Error('Redis connection is not ready');
    }
    return currentClient;
  }

  function recordLatency(startedAt: number): number {
    const latencyMs = Math.max(0, performance.now() - startedAt);
    metrics.totalLatencyMs += latencyMs;
    return latencyMs;
  }

  function recordSuccess(): void {
    consecutiveFailures = 0;
    circuitOpenedAt = undefined;
    if (!circuitRecoveryPending) return;
    circuitRecoveryPending = false;
    emitTelemetry('circuit-closed');
  }

  function destroyFailedClient(): void {
    const failedClient = client;
    client = undefined;
    connectPromise = undefined;
    if (!failedClient) return;
    try {
      failedClient.destroy();
    } catch {
      // A client between socket states can already be fully destroyed.
    }
  }

  function recordConnectionFailure(): void {
    consecutiveFailures += 1;
    const shouldOpenCircuit = consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD
      && circuitOpenedAt === undefined;
    if (shouldOpenCircuit) {
      circuitOpenedAt = Date.now();
      emitTelemetry('circuit-opened');
    }
    destroyFailedClient();
  }

  function recordFailure(error: unknown): 'invalid-data' | 'timeout' | 'unavailable' {
    metrics.errors += 1;
    const reason = redisFailureReason(error);
    if (reason === 'timeout') metrics.timeouts += 1;
    if (reason !== 'invalid-data') recordConnectionFailure();
    return reason;
  }

  async function execute<T>(operation: (currentClient: ReturnType<typeof createClient>) => Promise<T>): Promise<RedisResult<T>> {
    if (closed || !options.url) return skipped();
    if (circuitIsOpen()) return skipped('circuit-open');

    const startedAt = performance.now();
    metrics.commands += 1;
    try {
      const value = await withTimeout(
        operation(await connectedClient()),
        commandTimeoutMs,
      );
      const latencyMs = recordLatency(startedAt);
      recordSuccess();
      return { status: 'ok', value, latencyMs };
    } catch (error) {
      const latencyMs = recordLatency(startedAt);
      return {
        status: 'error',
        reason: recordFailure(error),
        latencyMs,
      };
    }
  }

  return {
    key(namespace, version, identities) {
      if (!NAMESPACE_PATTERN.test(namespace)) {
        throw new Error('Redis namespace must be a lowercase identifier');
      }
      if (!Number.isSafeInteger(version) || version < 1 || version > 999) {
        throw new Error('Redis key version must be an integer between 1 and 999');
      }
      if (
        identities.length === 0
        || identities.length > 8
        || identities.some(identity => identity.length < 1 || identity.length > 256)
      ) {
        throw new Error('Redis key identities must be between 1 and 256 characters');
      }

      const identityHash = createHash('sha256')
        .update(JSON.stringify(identities))
        .digest('base64url')
        .slice(0, 22);
      return `netflix:${options.environment}:v${version}:${namespace}:${identityHash}` as RedisKey;
    },
    async get(key, decode) {
      return execute(async currentClient => {
        const encoded = await currentClient.get(key);
        if (encoded === null) {
          metrics.misses += 1;
          return null;
        }
        try {
          const value = decode(JSON.parse(encoded));
          metrics.hits += 1;
          return value;
        } catch {
          throw new InvalidRedisDataError('Redis value does not match its decoder');
        }
      });
    },
    async set(key, value, { ttlSeconds }) {
      if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 604_800) {
        return execute(async () => {
          throw new InvalidRedisDataError('Redis TTL must be between 1 and 604800 seconds');
        });
      }

      let encoded: string | undefined;
      try {
        encoded = JSON.stringify(value);
      } catch {
        return execute(async () => {
          throw new InvalidRedisDataError('Redis value is not JSON serializable');
        });
      }
      if (encoded === undefined || Buffer.byteLength(encoded, 'utf8') > MAX_VALUE_BYTES) {
        return execute(async () => {
          throw new InvalidRedisDataError('Redis value exceeds the serialization limit');
        });
      }

      return execute(async currentClient => {
        await currentClient.set(key, encoded, { EX: ttlSeconds });
        return true as const;
      });
    },
    async delete(key) {
      return execute(async currentClient => (await currentClient.del(key)) > 0);
    },
    async health() {
      if (!options.url || closed) {
        return {
          status: closed ? 'closed' : 'disabled',
          configured: Boolean(options.url),
          connected: false,
          circuit: 'closed',
          metrics: { ...metrics },
        };
      }

      const probe = await execute(currentClient => currentClient.ping());
      return {
        status: probe.status === 'ok' ? 'ok' : 'degraded',
        configured: true,
        connected: client?.isReady ?? false,
        circuit: circuitIsOpen() ? 'open' : 'closed',
        metrics: { ...metrics },
      };
    },
    async close() {
      if (closed) return;
      closed = true;
      emitTelemetry('closed');
      connectPromise = undefined;
      if (!client) return;
      if (!client.isOpen) {
        try {
          client.destroy();
        } catch {
          // The client can finish closing between the state check and destroy.
        }
        return;
      }
      try {
        await client.close();
      } catch {
        client.destroy();
      }
    },
  };
}

type RedisEnvironment = Readonly<Record<string, string | undefined>>;

function optionalInteger(environment: RedisEnvironment, name: string): number | undefined {
  const value = environment[name]?.trim();
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return Number(value);
}

export function createRedisRuntimeFromEnvironment(
  environment: RedisEnvironment = process.env,
): RedisRuntime {
  const enabledValue = environment.REDIS_ENABLED?.trim().toLowerCase();
  if (enabledValue && !['true', 'false'].includes(enabledValue)) {
    throw new Error('REDIS_ENABLED must be true or false');
  }

  const deploymentEnvironment = environment.DEPLOYMENT_ENVIRONMENT?.trim()
    || (environment.NODE_ENV === 'production' ? 'production' : 'development');
  const explicitlyDisabled = enabledValue === 'false';
  const url = explicitlyDisabled ? undefined : environment.REDIS_URL?.trim();

  if (enabledValue === 'true' && !url) {
    throw new Error('REDIS_URL is required when Redis is enabled');
  }
  if (url) {
    const expectedPrefix = `netflix:${deploymentEnvironment}:`;
    if (environment.REDIS_KEY_PREFIX?.trim() !== expectedPrefix) {
      throw new Error('REDIS_KEY_PREFIX must match DEPLOYMENT_ENVIRONMENT');
    }
  }

  return createRedisRuntime({
    environment: deploymentEnvironment,
    url,
    connectTimeoutMs: optionalInteger(environment, 'REDIS_CONNECT_TIMEOUT_MS'),
    commandTimeoutMs: optionalInteger(environment, 'REDIS_COMMAND_TIMEOUT_MS'),
    circuitCooldownMs: optionalInteger(environment, 'REDIS_CIRCUIT_COOLDOWN_MS'),
    telemetry: event => {
      const level = event === 'circuit-opened' ? 'warn' : 'info';
      logBackendAction(`redis.runtime.${event}`, {}, level);
    },
  });
}

let sharedRuntime: RedisRuntime | undefined;

export function getRedisRuntime(): RedisRuntime {
  sharedRuntime ??= createRedisRuntimeFromEnvironment();
  return sharedRuntime;
}

export async function closeRedisRuntime(): Promise<void> {
  const runtime = sharedRuntime;
  sharedRuntime = undefined;
  await runtime?.close();
}
