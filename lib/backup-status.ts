import { promises as fs } from "node:fs";
import path from "node:path";

export type BackupStatusMetadata = {
  createdAt: string;
  sizeBytes: number;
  records: number;
};

const DEFAULT_BACKUP_STATUS_PATH = "/backup-status/last-backup.json";

export async function recordBackupStatus(
  metadata: BackupStatusMetadata,
  statusPath = process.env.BACKUP_STATUS_PATH || DEFAULT_BACKUP_STATUS_PATH,
) {
  const directory = path.dirname(statusPath);
  const temporaryPath = `${statusPath}.tmp`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, `${JSON.stringify(metadata)}\n`, {
    encoding: "utf8",
    mode: 0o640,
  });
  await fs.rename(temporaryPath, statusPath);
}
