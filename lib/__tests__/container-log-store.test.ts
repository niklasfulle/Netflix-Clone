/** @jest-environment node */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createContainerLogStore } from "@/lib/container-log-store";

describe("container log store", () => {
  let directory: string;
  let filePath: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "netflix-container-logs-"));
    filePath = path.join(directory, "container.log");
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("parses Docker timestamps, infers levels and redacts credentials", async () => {
    await fs.writeFile(filePath, [
      "2026-08-08T12:00:00.000000000Z Ready on port 3000",
      "2026-08-08T12:01:00.000000000Z WARN retrying request",
      "2026-08-08T12:02:00.000000000Z Error connecting to postgresql://admin:plain-secret@db:5432/Netflix",
    ].join("\n"), "utf8");
    const store = createContainerLogStore({ filePath });

    const result = await store.query({ page: 1, pageSize: 20 });

    expect(result.available).toBe(true);
    expect(result.counts).toEqual({ info: 1, warn: 1, error: 1 });
    expect(result.logs[0]).toMatchObject({
      level: "error",
      timestamp: "2026-08-08T12:02:00.000Z",
    });
    expect(result.logs[0].message).toContain("postgresql://[REDACTED]@db");
    expect(JSON.stringify(result.logs)).not.toContain("plain-secret");
  });

  it("filters and paginates newest entries first", async () => {
    await fs.writeFile(filePath, [
      "2026-08-08T12:00:00Z first message",
      "2026-08-08T12:01:00Z WARN second message",
      "2026-08-08T12:02:00Z final message",
    ].join("\n"), "utf8");
    const store = createContainerLogStore({ filePath });

    const result = await store.query({
      page: 1,
      pageSize: 1,
      search: "message",
      level: "info",
    });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.logs[0].message).toBe("final message");
  });

  it("keeps a multiline Docker error and its stack trace in one log entry", async () => {
    await fs.writeFile(filePath, [
      "2026-08-08T12:00:00.000000000Z Error: database request failed",
      "2026-08-08T12:00:00.000100000Z     at loadCatalog (/netflix-clone/server.js:10:5)",
      "2026-08-08T12:00:00.000200000Z     at async renderPage (/netflix-clone/server.js:20:3)",
      "2026-08-08T12:00:00.500000000Z GET /api/health 200 in 10ms",
    ].join("\n"), "utf8");
    const store = createContainerLogStore({ filePath });

    const result = await store.query({ page: 1, pageSize: 20 });

    expect(result.total).toBe(2);
    expect(result.counts).toEqual({ info: 1, error: 1 });
    expect(result.logs[0].message).toBe("GET /api/health 200 in 10ms");
    expect(result.logs[1]).toMatchObject({
      level: "error",
      message: [
        "Error: database request failed",
        "    at loadCatalog (/netflix-clone/server.js:10:5)",
        "    at async renderPage (/netflix-clone/server.js:20:3)",
      ].join("\n"),
    });
  });

  it("groups the multiline Next.js controller error reported in production", async () => {
    await fs.writeFile(filePath, [
      "⨯ uncaughtException: TypeError: Invalid state: Controller is already closed",
      "    at ignore-listed frames {",
      "  code: 'ERR_INVALID_STATE'",
      "}",
      "TypeError: Invalid state: Controller is already closed",
      "    at ignore-listed frames {",
      "  code: 'ERR_INVALID_STATE'",
      "}",
    ].join("\n"), "utf8");
    const store = createContainerLogStore({ filePath });

    const result = await store.query({ page: 1, pageSize: 20 });

    expect(result.total).toBe(2);
    expect(result.logs).toEqual([
      expect.objectContaining({
        level: "error",
        message: [
          "TypeError: Invalid state: Controller is already closed",
          "    at ignore-listed frames {",
          "  code: 'ERR_INVALID_STATE'",
          "}",
        ].join("\n"),
      }),
      expect.objectContaining({
        level: "error",
        message: expect.stringContaining("⨯ uncaughtException"),
      }),
    ]);
  });

  it("reports an unavailable collector without throwing", async () => {
    const store = createContainerLogStore({ filePath });

    await expect(store.query({ page: 1, pageSize: 20 })).resolves.toMatchObject({
      available: false,
      logs: [],
      total: 0,
    });
  });
});
