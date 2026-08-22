import { promises as fs } from "node:fs";

import { z } from "zod";

import packageJson from "@/package.json";
import { db } from "@/lib/db";
import { getRedisRuntime, type RedisHealth } from "@/lib/redis/runtime";

const nonNegativeNumber = z.number().nonnegative();

const filesystemSchema = z.object({
  label: z.string().min(1),
  path: z.string().min(1),
  available: z.boolean(),
  totalBytes: nonNegativeNumber.optional(),
  usedBytes: nonNegativeNumber.optional(),
  freeBytes: nonNegativeNumber.optional(),
  usedPercent: nonNegativeNumber.max(100).optional(),
  freePercent: nonNegativeNumber.max(100).optional(),
  writable: z.boolean().optional(),
});

const containerSchema = z.object({
  name: z.string(),
  status: z.string(),
  health: z.string(),
  startedAt: z.string(),
  restartCount: z.number().int().nonnegative(),
  image: z.string(),
  imageId: z.string(),
  cpuPercent: nonNegativeNumber,
  memoryUsedBytes: nonNegativeNumber,
  memoryLimitBytes: nonNegativeNumber,
  memoryPercent: nonNegativeNumber,
  pids: z.number().int().nonnegative(),
});

export const systemSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  agentVersion: z.string(),
  collectedAt: z.iso.datetime(),
  host: z.object({
    hostname: z.string(),
    platform: z.string(),
    platformRelease: z.string(),
    architecture: z.string(),
    uptimeSeconds: z.number().int().nonnegative(),
  }),
  cpu: z.object({
    usagePercent: nonNegativeNumber.max(100),
    loadAverage: z.object({
      oneMinute: nonNegativeNumber,
      fiveMinutes: nonNegativeNumber,
      fifteenMinutes: nonNegativeNumber,
    }),
    logicalCores: z.number().int().positive(),
  }),
  memory: z.object({
    totalBytes: nonNegativeNumber,
    usedBytes: nonNegativeNumber,
    availableBytes: nonNegativeNumber,
    usedPercent: nonNegativeNumber.max(100),
    swapTotalBytes: nonNegativeNumber,
    swapUsedBytes: nonNegativeNumber,
  }),
  filesystems: z.array(filesystemSchema),
  docker: z.object({
    available: z.boolean(),
    container: containerSchema.nullable(),
  }),
  backup: z
    .object({
      createdAt: z.iso.datetime(),
      sizeBytes: z.number().int().nonnegative(),
      records: z.number().int().nonnegative(),
    })
    .nullable(),
});

export type SystemSnapshot = z.infer<typeof systemSnapshotSchema>;
export type SystemSeverity = "healthy" | "warning" | "critical";
export type SystemAlert = {
  id: string;
  severity: Exclude<SystemSeverity, "healthy">;
  title: string;
  message: string;
};
export type DatabaseHealth = {
  status: "ok" | "error";
  latencyMs: number | null;
};
export type SystemOverview = {
  status: SystemSeverity;
  version: string;
  checkedAt: string;
  agent: {
    status: "ok" | "stale" | "unavailable";
    lastSeenAt: string | null;
    ageSeconds: number | null;
    version: string | null;
  };
  host: SystemSnapshot["host"] | null;
  cpu: SystemSnapshot["cpu"] | null;
  memory: SystemSnapshot["memory"] | null;
  filesystems: SystemSnapshot["filesystems"];
  docker: SystemSnapshot["docker"] | null;
  backup: SystemSnapshot["backup"];
  database: DatabaseHealth;
  redis: RedisHealth;
  alerts: SystemAlert[];
};

const disabledRedisHealth: RedisHealth = {
  status: "disabled",
  configured: false,
  connected: false,
  circuit: "closed",
  metrics: {
    commands: 0,
    hits: 0,
    misses: 0,
    errors: 0,
    timeouts: 0,
    reconnects: 0,
    fallbacks: 0,
    totalLatencyMs: 0,
  },
};

const DEFAULT_SNAPSHOT_PATH = "/monitor/status.json";

function addResourceAlert(
  alerts: SystemAlert[],
  id: string,
  title: string,
  value: number,
  warningAt: number,
  criticalAt: number,
) {
  if (value >= criticalAt) {
    alerts.push({
      id,
      severity: "critical",
      title,
      message: `${title} is at ${value.toFixed(1)}%.`,
    });
  } else if (value >= warningAt) {
    alerts.push({
      id,
      severity: "warning",
      title,
      message: `${title} is at ${value.toFixed(1)}%.`,
    });
  }
}

function snapshotAgeSeconds(snapshot: SystemSnapshot | null, now: Date) {
  if (snapshot === null) {
    return null;
  }
  return Math.max(
    0,
    Math.round((now.getTime() - Date.parse(snapshot.collectedAt)) / 1000),
  );
}

function evaluateAgentAlerts(
  snapshot: SystemSnapshot | null,
  ageSeconds: number | null,
): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  if (snapshot === null) {
    alerts.push({
      id: "agent-unavailable",
      severity: "critical",
      title: "Monitoring agent unavailable",
      message: "No valid host metrics snapshot is available.",
    });
  }

  if (ageSeconds !== null && ageSeconds > 120) {
    alerts.push({
      id: "agent-stale",
      severity: "critical",
      title: "Monitoring data is stale",
      message: `The latest host snapshot is ${ageSeconds} seconds old.`,
    });
  } else if (ageSeconds !== null && ageSeconds > 60) {
    alerts.push({
      id: "agent-delayed",
      severity: "warning",
      title: "Monitoring data is delayed",
      message: `The latest host snapshot is ${ageSeconds} seconds old.`,
    });
  }
  return alerts;
}

function evaluateHostAlerts(snapshot: SystemSnapshot): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  addResourceAlert(
    alerts,
    "cpu",
    "Host CPU usage",
    snapshot.cpu.usagePercent,
    85,
    95,
  );
  addResourceAlert(
    alerts,
    "memory",
    "Host memory usage",
    snapshot.memory.usedPercent,
    85,
    95,
  );
  return alerts;
}

function evaluateFilesystemAlerts(
  filesystems: SystemSnapshot["filesystems"],
): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  for (const filesystem of filesystems) {
    if (!filesystem.available) {
      alerts.push({
        id: `filesystem-${filesystem.label}-missing`,
        severity: "critical",
        title: `${filesystem.label} storage unavailable`,
        message: `${filesystem.path} is not mounted or cannot be read.`,
      });
      continue;
    }
    if (filesystem.writable === false) {
      alerts.push({
        id: `filesystem-${filesystem.label}-readonly`,
        severity: "critical",
        title: `${filesystem.label} storage is read-only`,
        message: `${filesystem.path} is not writable.`,
      });
    }
    const freePercent = filesystem.freePercent ?? 0;
    if (freePercent <= 10) {
      alerts.push({
        id: `filesystem-${filesystem.label}-critical`,
        severity: "critical",
        title: `${filesystem.label} storage is almost full`,
        message: `Only ${freePercent.toFixed(1)}% is available on ${filesystem.path}.`,
      });
    } else if (freePercent <= 20) {
      alerts.push({
        id: `filesystem-${filesystem.label}-warning`,
        severity: "warning",
        title: `${filesystem.label} storage is running low`,
        message: `${freePercent.toFixed(1)}% is available on ${filesystem.path}.`,
      });
    }
  }
  return alerts;
}

function evaluateDockerAlerts(
  docker: SystemSnapshot["docker"],
): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  if (!docker.available || docker.container === null) {
    return [
      {
        id: "docker-unavailable",
        severity: "critical",
        title: "Netflix container unavailable",
        message: "The monitoring agent cannot inspect the application container.",
      },
    ];
  }

  const { container } = docker;
  if (container.status !== "running") {
    alerts.push({
      id: "container-stopped",
      severity: "critical",
      title: "Netflix container is not running",
      message: `Current container state: ${container.status}.`,
    });
  }
  if (container.health === "unhealthy") {
    alerts.push({
      id: "container-unhealthy",
      severity: "critical",
      title: "Docker healthcheck failed",
      message: "Docker reports the Netflix container as unhealthy.",
    });
  } else if (container.health === "starting") {
    alerts.push({
      id: "container-starting",
      severity: "warning",
      title: "Container healthcheck is starting",
      message: "Docker has not completed the first healthcheck yet.",
    });
  }
  if (container.restartCount > 0) {
    alerts.push({
      id: "container-restarts",
      severity: "warning",
      title: "Container restarts detected",
      message: `Docker recorded ${container.restartCount} restart(s).`,
    });
  }
  addResourceAlert(
    alerts,
    "container-memory",
    "Container memory usage",
    container.memoryPercent,
    85,
    95,
  );
  return alerts;
}

function evaluateBackupAlerts(
  backup: SystemSnapshot["backup"],
  now: Date,
): SystemAlert[] {
  if (backup === null) {
    return [
      {
        id: "backup-missing",
        severity: "warning",
        title: "No backup metadata available",
        message: "Create an encrypted database backup to establish a recovery point.",
      },
    ] satisfies SystemAlert[];
  }

  const backupAgeHours =
    (now.getTime() - Date.parse(backup.createdAt)) / 3_600_000;
  if (backupAgeHours > 168) {
    return [
      {
        id: "backup-critical",
        severity: "critical",
        title: "Database backup is too old",
        message: "The latest recorded database backup is older than seven days.",
      },
    ] satisfies SystemAlert[];
  }
  if (backupAgeHours > 72) {
    return [
      {
        id: "backup-warning",
        severity: "warning",
        title: "Database backup is getting old",
        message: "The latest recorded database backup is older than three days.",
      },
    ] satisfies SystemAlert[];
  }
  return [];
}

function evaluateDatabaseAlerts(database: DatabaseHealth): SystemAlert[] {
  if (database.status === "error") {
    return [
      {
        id: "database-unavailable",
        severity: "critical",
        title: "Database unavailable",
        message: "The application could not complete the database health query.",
      },
    ] satisfies SystemAlert[];
  }
  if (database.latencyMs !== null && database.latencyMs >= 1000) {
    return [
      {
        id: "database-latency-critical",
        severity: "critical",
        title: "Database latency is critical",
        message: `The database health query took ${database.latencyMs} ms.`,
      },
    ] satisfies SystemAlert[];
  }
  if (database.latencyMs !== null && database.latencyMs >= 500) {
    return [
      {
        id: "database-latency-warning",
        severity: "warning",
        title: "Database latency is elevated",
        message: `The database health query took ${database.latencyMs} ms.`,
      },
    ] satisfies SystemAlert[];
  }
  return [];
}

function evaluateRedisAlerts(redis: RedisHealth): SystemAlert[] {
  if (!redis.configured || redis.status === "disabled") {
    return [];
  }
  if (
    redis.status === "ok"
    && redis.connected
    && redis.circuit === "closed"
  ) {
    return [];
  }
  return [
    {
      id: "redis-degraded",
      severity: "warning",
      title: "Redis runtime degraded",
      message: "Redis cache operations are using safe fallbacks.",
    },
  ];
}

function evaluateSnapshot(
  snapshot: SystemSnapshot | null,
  database: DatabaseHealth,
  redis: RedisHealth,
  now: Date,
): { alerts: SystemAlert[]; ageSeconds: number | null } {
  const ageSeconds = snapshotAgeSeconds(snapshot, now);
  const alerts = [
    ...evaluateAgentAlerts(snapshot, ageSeconds),
    ...evaluateDatabaseAlerts(database),
    ...evaluateRedisAlerts(redis),
  ];
  if (snapshot !== null) {
    alerts.push(
      ...evaluateHostAlerts(snapshot),
      ...evaluateFilesystemAlerts(snapshot.filesystems),
      ...evaluateDockerAlerts(snapshot.docker),
      ...evaluateBackupAlerts(snapshot.backup, now),
    );
  }
  return { alerts, ageSeconds };
}

function overallStatus(alerts: SystemAlert[]): SystemSeverity {
  if (alerts.some((alert) => alert.severity === "critical")) {
    return "critical";
  }
  if (alerts.some((alert) => alert.severity === "warning")) {
    return "warning";
  }
  return "healthy";
}

function monitoringAgentStatus(
  snapshot: SystemSnapshot | null,
  ageSeconds: number | null,
): SystemOverview["agent"]["status"] {
  if (snapshot === null) {
    return "unavailable";
  }
  if (ageSeconds !== null && ageSeconds > 60) {
    return "stale";
  }
  return "ok";
}

export function buildSystemOverview(
  snapshot: SystemSnapshot | null,
  database: DatabaseHealth,
  now = new Date(),
  redis: RedisHealth = disabledRedisHealth,
): SystemOverview {
  const { alerts, ageSeconds } = evaluateSnapshot(
    snapshot,
    database,
    redis,
    now,
  );

  return {
    status: overallStatus(alerts),
    version: packageJson.version,
    checkedAt: now.toISOString(),
    agent: {
      status: monitoringAgentStatus(snapshot, ageSeconds),
      lastSeenAt: snapshot?.collectedAt ?? null,
      ageSeconds,
      version: snapshot?.agentVersion ?? null,
    },
    host: snapshot?.host ?? null,
    cpu: snapshot?.cpu ?? null,
    memory: snapshot?.memory ?? null,
    filesystems: snapshot?.filesystems ?? [],
    docker: snapshot?.docker ?? null,
    backup: snapshot?.backup ?? null,
    database,
    redis,
    alerts,
  };
}

export async function readSystemSnapshot(
  snapshotPath = process.env.SYSTEM_MONITOR_PATH || DEFAULT_SNAPSHOT_PATH,
): Promise<SystemSnapshot | null> {
  try {
    const contents = await fs.readFile(snapshotPath, "utf8");
    return systemSnapshotSchema.parse(JSON.parse(contents));
  } catch {
    return null;
  }
}

async function checkDatabase(): Promise<DatabaseHealth> {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      status: "error",
      latencyMs: null,
    };
  }
}

export async function getSystemOverview(): Promise<SystemOverview> {
  const [snapshot, database, redis] = await Promise.all([
    readSystemSnapshot(),
    checkDatabase(),
    getRedisRuntime().health(),
  ]);
  return buildSystemOverview(snapshot, database, new Date(), redis);
}
