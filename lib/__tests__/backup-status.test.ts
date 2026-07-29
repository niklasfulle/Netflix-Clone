/** @jest-environment node */

import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { recordBackupStatus } from "@/lib/backup-status";

describe("backup status metadata", () => {
  it("writes only non-sensitive recovery metadata", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "netflix-backup-status-"));
    const statusPath = path.join(directory, "last-backup.json");

    try {
      await recordBackupStatus(
        {
          createdAt: "2026-07-29T12:00:00.000Z",
          sizeBytes: 2048,
          records: 42,
        },
        statusPath,
      );

      expect(JSON.parse(await readFile(statusPath, "utf8"))).toEqual({
        createdAt: "2026-07-29T12:00:00.000Z",
        sizeBytes: 2048,
        records: 42,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
