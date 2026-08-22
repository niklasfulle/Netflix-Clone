import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

export type LogRecord = {
  timestamp?: string;
  action?: string;
  category?: string;
  userId?: string;
  level?: string;
  raw?: string;
  [key: string]: unknown;
};

type LogQuery = {
  page: number;
  pageSize: number;
  level?: string;
  search?: string;
  action?: string;
  category?: string;
  userId?: string;
  from?: Date | null;
  to?: Date | null;
};

type LogQueryResult = {
  logs: LogRecord[];
  total: number;
  counts: Record<string, number>;
};

type LogStoreOptions = {
  directory: string;
  fileName?: string;
  maxBytes?: number;
  maxFiles?: number;
  maxEntryBytes?: number;
  onError?: (error: unknown) => void;
};

const REDACTED = '[REDACTED]';
const SECRET_KEY = /(password|passphrase|token|authorization|cookie|secret|credential|api[-_]?key|code|confirm)/i;
const MAX_SANITIZE_DEPTH = 8;
const MAX_COLLECTION_ITEMS = 100;
const MAX_STRING_LENGTH = 4_096;

function sanitizeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > MAX_SANITIZE_DEPTH) return '[Max depth]';
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`
      : value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_COLLECTION_ITEMS).map((item) => sanitizeValue(item, seen, depth + 1));
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  if (value instanceof Error) {
    result.name = value.name;
    result.message = value.message;
  }

  for (const [key, child] of Object.entries(source).slice(0, MAX_COLLECTION_ITEMS)) {
    result[key] = SECRET_KEY.test(key) ? REDACTED : sanitizeValue(child, seen, depth + 1);
  }
  return result;
}

export function sanitizeLogDetails(details: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(details, new WeakSet<object>(), 0) as Record<string, unknown>;
}

function normalizeEntry(entry: LogRecord, maxEntryBytes: number): string {
  const sanitized = sanitizeLogDetails(entry);
  const serialized = JSON.stringify(sanitized);
  if (Buffer.byteLength(serialized, 'utf8') <= maxEntryBytes) return `${serialized}\n`;

  const bounded = JSON.stringify({
    timestamp: sanitized.timestamp,
    level: sanitized.level,
    action: sanitized.action,
    userId: sanitized.userId,
    truncated: true,
  });
  return `${bounded}\n`;
}

function matchesCategory(record: LogRecord, category?: string): boolean {
  if (!category) return true;
  if (category === 'application') return record.category !== 'authentication';
  return record.category === category;
}

function matchesQuery(record: LogRecord, query: LogQuery): boolean {
  const normalizedLevel = record.level === 'warning' ? 'warn' : record.level;
  const locale = 'en';
  const action = query.action?.trim().toLocaleLowerCase(locale) ?? '';
  const userId = query.userId?.trim().toLocaleLowerCase(locale) ?? '';
  const search = query.search?.trim().toLocaleLowerCase(locale) ?? '';
  const timestamp = record.timestamp ? new Date(record.timestamp) : null;

  if (!matchesCategory(record, query.category)) return false;
  if (query.level && query.level !== 'all' && normalizedLevel !== query.level) return false;
  if (action && !String(record.action ?? '').toLocaleLowerCase(locale).includes(action)) return false;
  if (userId && !String(record.userId ?? '').toLocaleLowerCase(locale).includes(userId)) return false;
  if (search && !JSON.stringify(record).toLocaleLowerCase(locale).includes(search)) return false;
  if (query.from && timestamp && timestamp < query.from) return false;
  if (query.to && timestamp && timestamp > query.to) return false;
  return true;
}

function parseLogRecord(line: string): LogRecord {
  try {
    return JSON.parse(line) as LogRecord;
  } catch {
    return { level: 'unknown', raw: line };
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(/* turbopackIgnore: true */ filePath);
    return true;
  } catch {
    return false;
  }
}

export function createLogStore({
  directory,
  fileName = 'backend.log',
  maxBytes = 5 * 1024 * 1024,
  maxFiles = 5,
  maxEntryBytes = 16 * 1024,
  onError = (error) => console.error('Backend log storage failed', error),
}: LogStoreOptions) {
  const activePath = path.join(/*turbopackIgnore: true*/ directory, fileName);
  const parsedName = path.parse(fileName);
  let writeQueue = Promise.resolve();

  const rotatedPath = (index: number) => path.join(
    /*turbopackIgnore: true*/ directory,
    `${parsedName.name}.${index}${parsedName.ext}`,
  );

  async function rotateIfNeeded(entryBytes: number) {
    const currentSize = await fs.stat(/* turbopackIgnore: true */ activePath)
      .then((stat) => stat.size)
      .catch(() => 0);
    if (currentSize + entryBytes <= maxBytes) return;

    const retainedRotations = Math.max(maxFiles - 1, 0);
    if (retainedRotations === 0) {
      await fs.writeFile(/* turbopackIgnore: true */ activePath, '', 'utf8');
      return;
    }

    await fs.rm(/* turbopackIgnore: true */ rotatedPath(retainedRotations), { force: true });
    for (let index = retainedRotations - 1; index >= 1; index -= 1) {
      const source = rotatedPath(index);
      if (await pathExists(source)) {
        await fs.rename(
          /* turbopackIgnore: true */ source,
          /* turbopackIgnore: true */ rotatedPath(index + 1),
        );
      }
    }
    if (await pathExists(activePath)) {
      await fs.rename(
        /* turbopackIgnore: true */ activePath,
        /* turbopackIgnore: true */ rotatedPath(1),
      );
    }
  }

  async function performWrite(entry: LogRecord) {
    try {
      const line = normalizeEntry(entry, maxEntryBytes);
      await fs.mkdir(/* turbopackIgnore: true */ directory, { recursive: true });
      await rotateIfNeeded(Buffer.byteLength(line, 'utf8'));
      await fs.appendFile(/* turbopackIgnore: true */ activePath, line, 'utf8');
    } catch (error) {
      onError(error);
    }
  }

  function write(entry: LogRecord): Promise<void> {
    writeQueue = writeQueue.then(() => performWrite(entry));
    return writeQueue;
  }

  async function getLogFiles(): Promise<string[]> {
    const entries = await fs.readdir(/* turbopackIgnore: true */ directory)
      .catch(() => [] as string[]);
    const escapedName = parsedName.name.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const escapedExtension = parsedName.ext.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const matcher = new RegExp(String.raw`^${escapedName}(?:\.(\d+))?${escapedExtension}$`);

    return entries
      .map((entry) => ({ entry, match: matcher.exec(entry) }))
      .filter((item): item is { entry: string; match: RegExpExecArray } => Boolean(item.match))
      .sort((left, right) => {
        const leftIndex = left.match[1] ? Number(left.match[1]) : 0;
        const rightIndex = right.match[1] ? Number(right.match[1]) : 0;
        return rightIndex - leftIndex;
      })
      .map(({ entry }) => path.join(directory, entry));
  }

  async function* readRecords(): AsyncGenerator<LogRecord> {
    for (const filePath of await getLogFiles()) {
      const input = createReadStream(/* turbopackIgnore: true */ filePath, { encoding: 'utf8' });
      const lines = readline.createInterface({ input, crlfDelay: Infinity });
      for await (const line of lines) {
        if (line) yield parseLogRecord(line);
      }
    }
  }

  async function query(queryOptions: LogQuery): Promise<LogQueryResult> {
    await writeQueue;
    const page = Math.max(queryOptions.page, 1);
    const pageSize = Math.max(queryOptions.pageSize, 1);
    const retainedMatches = page * pageSize;
    const matches: LogRecord[] = [];
    const counts: Record<string, number> = {};
    let total = 0;

    for await (const record of readRecords()) {
      if (!matchesCategory(record, queryOptions.category)) continue;
      const level = record.level === 'warning' ? 'warn' : record.level ?? 'unknown';
      counts[level] = (counts[level] ?? 0) + 1;
      if (!matchesQuery(record, queryOptions)) continue;
      total += 1;
      matches.push(record);
      if (matches.length > retainedMatches) matches.shift();
    }

    const newestFirst = [...matches].reverse();
    const offset = (page - 1) * pageSize;
    return {
      logs: newestFirst.slice(offset, offset + pageSize),
      total,
      counts,
    };
  }

  async function* iterate(queryOptions: LogQuery): AsyncGenerator<LogRecord> {
    await writeQueue;
    for await (const record of readRecords()) {
      if (matchesQuery(record, queryOptions)) yield record;
    }
  }

  async function clear(): Promise<void> {
    await writeQueue;
    try {
      await fs.mkdir(/* turbopackIgnore: true */ directory, { recursive: true });
      await Promise.all((await getLogFiles()).map((filePath) => (
        fs.rm(/* turbopackIgnore: true */ filePath, { force: true })
      )));
      await fs.writeFile(/* turbopackIgnore: true */ activePath, '', 'utf8');
    } catch (error) {
      onError(error);
      throw error;
    }
  }

  return { write, query, iterate, clear, flush: () => writeQueue };
}

export const backendLogStore = createLogStore({
  directory: path.join(/*turbopackIgnore: true*/ process.cwd(), 'logs'),
});
