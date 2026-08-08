import { promises as fs } from "node:fs";
import path from "node:path";

export type ContainerLogEntry = {
  timestamp?: string;
  level: "info" | "warn" | "error";
  message: string;
  source: "container";
};

export type ContainerLogQuery = {
  page: number;
  pageSize: number;
  level?: string;
  search?: string;
  from?: Date | null;
  to?: Date | null;
};

type ContainerLogStoreOptions = {
  filePath: string;
};

const ANSI_PATTERN = String.raw`\[[0-?]*[ -/]*[@-~]`;
const ANSI_SEQUENCE = new RegExp(String.fromCodePoint(27) + ANSI_PATTERN, "g");
const CONNECTION_CREDENTIALS = /\b((?:postgres(?:ql)?|https?):\/\/)[^@\s/]+@/gi;
const BEARER_TOKEN = /\bBearer\s+[\w.~+/=-]+/gi;
const SECRET_KEYS = [
  "password",
  "passphrase",
  "token",
  "authorization",
  "cookie",
  "secret",
  "credential",
  "api[-_]?key",
];
const MAX_MESSAGE_LENGTH = 8_192;
const MULTILINE_WINDOW_MS = 1_000;
const INDEPENDENT_LOG_MESSAGE = /^(?:(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/|[▲✓○]\s|Prisma schema loaded\b|Datasource\b)/;

function normalizeTimestamp(value: string): string | undefined {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(value);
  if (!match) return undefined;
  const milliseconds = (match[2] ?? "").padEnd(3, "0").slice(0, 3);
  return `${match[1]}.${milliseconds}Z`;
}

function redactMessage(message: string): string {
  const sanitized = message
    .replaceAll(ANSI_SEQUENCE, "")
    .replaceAll(CONNECTION_CREDENTIALS, "$1[REDACTED]@")
    .replaceAll(BEARER_TOKEN, "Bearer [REDACTED]");
  return SECRET_KEYS.reduce((redacted, key) => redacted.replaceAll(
    new RegExp(String.raw`(${key}\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)`, "gi"),
    "$1[REDACTED]",
  ), sanitized).slice(0, MAX_MESSAGE_LENGTH);
}

function inferLevel(message: string): ContainerLogEntry["level"] {
  if (/\b[A-Za-z]*Error\b/.test(message) || /(?:^|\W)(?:error|fatal|exception|failed|failure)(?:\W|$)|⨯/i.test(message)) return "error";
  if (/(?:^|\W)warn(?:ing)?(?:\W|$)/i.test(message)) return "warn";
  return "info";
}

function parseLine(line: string): ContainerLogEntry | null {
  const content = line.trimEnd();
  if (!content.trim()) return null;
  const separator = content.indexOf(" ");
  const candidateTimestamp = separator === -1 ? content : content.slice(0, separator);
  const timestamp = normalizeTimestamp(candidateTimestamp);
  const message = redactMessage(timestamp ? content.slice(separator + 1) : content);
  return { timestamp, level: inferLevel(message), message, source: "container" };
}

function isContinuation(
  previous: ContainerLogEntry,
  current: ContainerLogEntry,
) {
  const hasContinuationIndent = /^\s+/.test(current.message);
  if (hasContinuationIndent) return true;
  if (previous.level === "info" || current.level !== "info") return false;
  if (INDEPENDENT_LOG_MESSAGE.test(current.message.trimStart())) return false;
  if (!previous.timestamp || !current.timestamp) return true;
  const elapsed = Date.parse(current.timestamp) - Date.parse(previous.timestamp);
  return elapsed >= 0 && elapsed <= MULTILINE_WINDOW_MS;
}

function groupMultilineEntries(entries: ContainerLogEntry[]) {
  const grouped: ContainerLogEntry[] = [];
  for (const entry of entries) {
    const previous = grouped.at(-1);
    if (!previous || !isContinuation(previous, entry)) {
      grouped.push(entry);
      continue;
    }
    previous.message = `${previous.message}\n${entry.message}`.slice(0, MAX_MESSAGE_LENGTH);
    previous.level = inferLevel(previous.message);
  }
  return grouped;
}

function matches(entry: ContainerLogEntry, query: ContainerLogQuery): boolean {
  if (query.level && query.level !== "all" && entry.level !== query.level) return false;
  const search = query.search?.trim().toLocaleLowerCase("en") ?? "";
  if (search && !entry.message.toLocaleLowerCase("en").includes(search)) return false;
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
  if (query.from && timestamp && timestamp < query.from) return false;
  if (query.to && timestamp && timestamp > query.to) return false;
  return true;
}

export function createContainerLogStore({ filePath }: ContainerLogStoreOptions) {
  async function readEntries() {
    try {
      const [contents, stat] = await Promise.all([
        fs.readFile(/* turbopackIgnore: true */ filePath, "utf8"),
        fs.stat(/* turbopackIgnore: true */ filePath),
      ]);
      const physicalEntries = contents.split(/\r?\n/).flatMap((line) => {
        const entry = parseLine(line);
        return entry ? [entry] : [];
      });
      const entries = groupMultilineEntries(physicalEntries);
      return { available: true, collectedAt: stat.mtime.toISOString(), entries };
    } catch {
      return { available: false, collectedAt: null, entries: [] as ContainerLogEntry[] };
    }
  }

  async function query(queryOptions: ContainerLogQuery) {
    const snapshot = await readEntries();
    const counts: Record<string, number> = {};
    const matchesQuery: ContainerLogEntry[] = [];
    for (const entry of snapshot.entries) {
      counts[entry.level] = (counts[entry.level] ?? 0) + 1;
      if (matches(entry, queryOptions)) matchesQuery.push(entry);
    }
    const total = matchesQuery.length;
    const page = Math.max(queryOptions.page, 1);
    const pageSize = Math.max(queryOptions.pageSize, 1);
    const offset = (page - 1) * pageSize;
    return {
      available: snapshot.available,
      collectedAt: snapshot.collectedAt,
      logs: matchesQuery.toReversed().slice(offset, offset + pageSize),
      total,
      totalPages: Math.ceil(total / pageSize),
      counts,
    };
  }

  async function iterate(queryOptions: ContainerLogQuery) {
    const snapshot = await readEntries();
    return snapshot.entries.filter((entry) => matches(entry, queryOptions)).toReversed();
  }

  return { query, iterate };
}

export const containerLogStore = createContainerLogStore({
  filePath: process.env.CONTAINER_LOG_PATH
    || path.join(/* turbopackIgnore: true */ process.cwd(), "logs", "container.log"),
});
