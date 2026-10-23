/** @jest-environment node */

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { promises as filesystem } from 'node:fs';
import os from "node:os";
import path from "node:path";

import { recordBackupStatus } from "@/lib/backup-status";

describe("backup status metadata", () => {
  it('uses the default status location and publishes via an atomic rename', async () => {
    const environment = jest.replaceProperty(process, 'env', { ...process.env, BACKUP_STATUS_PATH: '' });
    const mkdir = jest.spyOn(filesystem, 'mkdir').mockResolvedValue(undefined);
    const write = jest.spyOn(filesystem, 'writeFile').mockResolvedValue(undefined);
    const rename = jest.spyOn(filesystem, 'rename').mockResolvedValue(undefined);
    try {
      await recordBackupStatus({ createdAt: '2026-10-23T12:00:00Z', sizeBytes: 2048, records: 42 });
      expect(mkdir).toHaveBeenCalledWith('/backup-status', { recursive: true });
      expect(rename).toHaveBeenCalledWith('/backup-status/last-backup.json.tmp', '/backup-status/last-backup.json');
    } finally { environment.restore(); mkdir.mockRestore(); write.mockRestore(); rename.mockRestore(); }
  });

  it('honors the configured status path when no explicit path is passed', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-backup-status-config-'));
    const statusPath = path.join(directory, 'status.json');
    const environment = jest.replaceProperty(process, 'env', { ...process.env, BACKUP_STATUS_PATH: statusPath });
    try {
      await recordBackupStatus({ createdAt: '2026-10-23T12:00:00Z', sizeBytes: 1024, records: 3 });
      expect(JSON.parse(await readFile(statusPath, 'utf8'))).toEqual({ createdAt: '2026-10-23T12:00:00Z', sizeBytes: 1024, records: 3 });
    } finally { environment.restore(); await rm(directory, { recursive: true, force: true }); }
  });
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
