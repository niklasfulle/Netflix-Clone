type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type Entry = { count: number; resetAt: number };

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = Date.now,
}: RateLimiterOptions) {
  const entries = new Map<string, Entry>();

  function prune(timestamp: number) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= timestamp) entries.delete(key);
    }
    while (entries.size >= maxKeys) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  }

  function consume(key: string): RateLimitResult {
    const timestamp = now();
    let entry = entries.get(key);
    if (!entry || entry.resetAt <= timestamp) {
      prune(timestamp);
      entry = { count: 0, resetAt: timestamp + windowMs };
      entries.set(key, entry);
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1_000));
    if (entry.count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds };

    entry.count += 1;
    return {
      allowed: true,
      remaining: Math.max(limit - entry.count, 0),
      retryAfterSeconds,
    };
  }

  return {
    consume,
    refund: (key: string) => {
      const entry = entries.get(key);
      if (!entry) return;
      if (entry.count <= 1) entries.delete(key);
      else entry.count -= 1;
    },
    reset: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
    size: () => entries.size,
  };
}
