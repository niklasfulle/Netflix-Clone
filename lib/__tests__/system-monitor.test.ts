/** @jest-environment node */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildSystemOverview,
  readSystemSnapshot,
  systemSnapshotSchema,
  type SystemSnapshot,
} from "@/lib/system-monitor";

function snapshot(overrides: Partial<SystemSnapshot> = {}): SystemSnapshot {
  return {
    schemaVersion: 1,
    agentVersion: "1.0.0",
    collectedAt: "2026-07-29T12:00:00.000Z",
    host: {
      hostname: "netflix",
      platform: "Linux",
      platformRelease: "6.8.0",
      architecture: "x86_64",
      uptimeSeconds: 3600,
    },
    cpu: {
      usagePercent: 20,
      loadAverage: { oneMinute: 0.2, fiveMinutes: 0.3, fifteenMinutes: 0.4 },
      logicalCores: 4,
    },
    memory: {
      totalBytes: 8_000,
      usedBytes: 4_000,
      availableBytes: 4_000,
      usedPercent: 50,
      swapTotalBytes: 2_000,
      swapUsedBytes: 0,
    },
    filesystems: [
      {
        label: "movies",
        path: "/movies",
        available: true,
        totalBytes: 10_000,
        usedBytes: 5_000,
        freeBytes: 5_000,
        usedPercent: 50,
        freePercent: 50,
        writable: true,
      },
    ],
    docker: {
      available: true,
      container: {
        name: "netflix-clone",
        status: "running",
        health: "healthy",
        startedAt: "2026-07-29T11:00:00.000Z",
        restartCount: 0,
        image: "salkin263/netflix-clone:1.11.0",
        imageId: "abc123",
        cpuPercent: 3,
        memoryUsedBytes: 100,
        memoryLimitBytes: 1000,
        memoryPercent: 10,
        pids: 12,
      },
    },
    backup: {
      createdAt: "2026-07-29T10:00:00.000Z",
      sizeBytes: 1024,
      records: 42,
    },
    ...overrides,
  };
}

describe("system monitor status evaluation", () => {
  const now = new Date("2026-07-29T12:00:30.000Z");

  it("reports healthy systems without alerts", () => {
    const overview = buildSystemOverview(
      snapshot(),
      { status: "ok", latencyMs: 20 },
      now,
      undefined,
      {
        worker: { status: "healthy", state: "ACTIVE", heartbeatAgeMs: 5_000 },
        queue: { depth: 0, oldestQueuedAgeMs: null },
      },
    );

    expect(overview.status).toBe("healthy");
    expect(overview.alerts).toEqual([]);
    expect(overview.agent).toMatchObject({ status: "ok", ageSeconds: 30 });
  });

  it("reports capacity warnings and critical infrastructure failures", () => {
    const unhealthy = snapshot({
      cpu: {
        usagePercent: 90,
        loadAverage: { oneMinute: 3, fiveMinutes: 2, fifteenMinutes: 1 },
        logicalCores: 4,
      },
      filesystems: [
        {
          label: "series",
          path: "/series",
          available: true,
          totalBytes: 100,
          usedBytes: 95,
          freeBytes: 5,
          usedPercent: 95,
          freePercent: 5,
          writable: true,
        },
      ],
      docker: { available: true, container: null },
    });

    const overview = buildSystemOverview(
      unhealthy,
      { status: "error", latencyMs: null },
      now,
    );

    expect(overview.status).toBe("critical");
    expect(overview.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cpu", severity: "warning" }),
        expect.objectContaining({
          id: "filesystem-series-critical",
          severity: "critical",
        }),
        expect.objectContaining({ id: "docker-unavailable" }),
        expect.objectContaining({ id: "database-unavailable" }),
      ]),
    );
  });

  it("rejects malformed snapshots instead of trusting host input", () => {
    expect(() =>
      systemSnapshotSchema.parse({
        schemaVersion: 1,
        collectedAt: "not-a-date",
      }),
    ).toThrow();
  });

  it("reports a missing monitoring agent as critical", () => {
    const overview = buildSystemOverview(
      null,
      { status: "ok", latencyMs: 10 },
      now,
    );

    expect(overview.status).toBe("critical");
    expect(overview.agent.status).toBe("unavailable");
    expect(overview.alerts[0].id).toBe("agent-unavailable");
  });

  it("collects warning alerts for delayed and degraded resources", () => {
    const degraded = snapshot({
      collectedAt: "2026-07-29T11:59:00.000Z",
      memory: {
        totalBytes: 10_000,
        usedBytes: 9_000,
        availableBytes: 1_000,
        usedPercent: 90,
        swapTotalBytes: 2_000,
        swapUsedBytes: 500,
      },
      filesystems: [
        {
          label: "movies",
          path: "/movies",
          available: true,
          totalBytes: 100,
          usedBytes: 85,
          freeBytes: 15,
          usedPercent: 85,
          freePercent: 15,
          writable: false,
        },
      ],
      docker: {
        available: true,
        container: {
          ...snapshot().docker.container!,
          status: "exited",
          health: "starting",
          restartCount: 2,
          memoryPercent: 90,
        },
      },
      backup: {
        createdAt: "2026-07-25T12:00:00.000Z",
        sizeBytes: 1024,
        records: 42,
      },
    });

    const overview = buildSystemOverview(
      degraded,
      { status: "ok", latencyMs: 600 },
      now,
    );

    expect(overview.status).toBe("critical");
    expect(overview.agent.status).toBe("stale");
    expect(overview.alerts.map((alert) => alert.id)).toEqual(
      expect.arrayContaining([
        "agent-delayed",
        "memory",
        "filesystem-movies-readonly",
        "filesystem-movies-warning",
        "container-stopped",
        "container-starting",
        "container-restarts",
        "container-memory",
        "backup-warning",
        "database-latency-warning",
      ]),
    );
  });

  it("collects critical alerts at the upper thresholds", () => {
    const critical = snapshot({
      collectedAt: "2026-07-29T11:57:00.000Z",
      cpu: {
        usagePercent: 96,
        loadAverage: { oneMinute: 4, fiveMinutes: 3, fifteenMinutes: 2 },
        logicalCores: 4,
      },
      memory: {
        totalBytes: 10_000,
        usedBytes: 9_600,
        availableBytes: 400,
        usedPercent: 96,
        swapTotalBytes: 2_000,
        swapUsedBytes: 1_500,
      },
      filesystems: [
        {
          label: "series",
          path: "/series",
          available: false,
        },
      ],
      docker: {
        available: true,
        container: {
          ...snapshot().docker.container!,
          status: "paused",
          health: "unhealthy",
          memoryPercent: 96,
        },
      },
      backup: {
        createdAt: "2026-07-20T12:00:00.000Z",
        sizeBytes: 1024,
        records: 42,
      },
    });

    const overview = buildSystemOverview(
      critical,
      { status: "ok", latencyMs: 1_000 },
      now,
    );

    expect(overview.alerts.map((alert) => alert.id)).toEqual(
      expect.arrayContaining([
        "agent-stale",
        "cpu",
        "memory",
        "filesystem-series-missing",
        "container-stopped",
        "container-unhealthy",
        "container-memory",
        "backup-critical",
        "database-latency-critical",
      ]),
    );
  });

  it("warns when no backup metadata has been recorded", () => {
    const overview = buildSystemOverview(
      snapshot({ backup: null }),
      { status: "ok", latencyMs: 20 },
      now,
    );

    expect(overview.status).toBe("warning");
    expect(overview.alerts).toContainEqual(
      expect.objectContaining({ id: "backup-missing" }),
    );
  });

  it("warns when the configured Redis runtime is degraded", () => {
    const overview = buildSystemOverview(
      snapshot(),
      { status: "ok", latencyMs: 20 },
      now,
      {
        status: "degraded",
        configured: true,
        connected: false,
        circuit: "open",
        metrics: {
          commands: 12,
          hits: 7,
          misses: 3,
          errors: 2,
          timeouts: 1,
          reconnects: 3,
          fallbacks: 4,
          totalLatencyMs: 30,
        },
      },
    );

    expect(overview.status).toBe("warning");
    expect(overview.redis).toMatchObject({
      status: "degraded",
      connected: false,
      circuit: "open",
    });
    expect(overview.alerts).toContainEqual(
      expect.objectContaining({
        id: "redis-degraded",
        severity: "warning",
      }),
    );
  });

  it("reads valid snapshots and rejects invalid snapshot files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "netflix-monitor-"));
    const validPath = path.join(directory, "valid.json");
    const invalidPath = path.join(directory, "invalid.json");

    try {
      await writeFile(validPath, JSON.stringify(snapshot()), "utf8");
      await writeFile(invalidPath, '{"schemaVersion":2}', "utf8");

      await expect(readSystemSnapshot(validPath)).resolves.toMatchObject({
        schemaVersion: 1,
        agentVersion: "1.0.0",
      });
      await expect(readSystemSnapshot(invalidPath)).resolves.toBeNull();
      await expect(
        readSystemSnapshot(path.join(directory, "missing.json")),
      ).resolves.toBeNull();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
