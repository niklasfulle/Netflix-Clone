/** @jest-environment node */

jest.mock("@/lib/admin-auth", () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logBackendAction: jest.fn() }));
jest.mock("@/lib/backup-status", () => ({ recordBackupStatus: jest.fn() }));
jest.mock("@/lib/admin-backup", () => ({
  BackupValidationError: class BackupValidationError extends Error {},
  MAX_BACKUP_FILE_SIZE: 100 * 1024 * 1024,
  MIN_BACKUP_PASSPHRASE_LENGTH: 12,
  RESTORE_CONFIRMATION: "RESTORE",
  collectDatabaseBackup: jest.fn(),
  countBackupRecords: jest.fn(),
  decryptDatabaseBackup: jest.fn(),
  encryptDatabaseBackup: jest.fn(),
  restoreDatabaseBackup: jest.fn(),
}));

import {
  collectDatabaseBackup,
  countBackupRecords,
  decryptDatabaseBackup,
  encryptDatabaseBackup,
  restoreDatabaseBackup,
} from "@/lib/admin-backup";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { recordBackupStatus } from "@/lib/backup-status";
import type { DatabaseBackup } from "@/lib/admin-backup";
import { POST, PUT } from "../route";

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedCollect = collectDatabaseBackup as jest.MockedFunction<typeof collectDatabaseBackup>;
const mockedCount = countBackupRecords as jest.MockedFunction<typeof countBackupRecords>;
const mockedEncrypt = encryptDatabaseBackup as jest.MockedFunction<typeof encryptDatabaseBackup>;
const mockedDecrypt = decryptDatabaseBackup as jest.MockedFunction<typeof decryptDatabaseBackup>;
const mockedRestore = restoreDatabaseBackup as jest.MockedFunction<typeof restoreDatabaseBackup>;
const mockedRecordBackupStatus = recordBackupStatus as jest.MockedFunction<
  typeof recordBackupStatus
>;

const storedBackup = {
  format: "netflix-clone-database-backup",
  version: 1,
  createdAt: "2026-07-26T12:00:00.000Z",
  data: { users: [{ id: "admin", role: "ADMIN" }] },
} as unknown as DatabaseBackup;

describe("admin backup API", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("rejects non-admin requests", async () => {
    mockedIsAdmin.mockResolvedValue(false);

    expect((await POST({ json: jest.fn() } as never)).status).toBe(403);
    expect((await PUT({ formData: jest.fn() } as never)).status).toBe(403);
  });

  it("creates an encrypted downloadable archive", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedCollect.mockResolvedValue(storedBackup);
    mockedEncrypt.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockedCount.mockReturnValue(42);

    const response = await POST({
      json: jest.fn().mockResolvedValue({ passphrase: "secure-backup-password" }),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(".nfbak");
    expect(response.headers.get("X-Backup-Records")).toBe("42");
    expect(mockedEncrypt).toHaveBeenCalledWith(storedBackup, "secure-backup-password");
    expect(mockedRecordBackupStatus).toHaveBeenCalledWith({
      createdAt: storedBackup.createdAt,
      sizeBytes: 3,
      records: 42,
    });
  });

  it("validates the password before reading the database", async () => {
    mockedIsAdmin.mockResolvedValue(true);

    const response = await POST({
      json: jest.fn().mockResolvedValue({ passphrase: "short" }),
    } as never);

    expect(response.status).toBe(400);
    expect(mockedCollect).not.toHaveBeenCalled();
  });

  it("requires the explicit restore confirmation", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    const formData = new FormData();
    formData.set("backup", new File([new Uint8Array([1])], "backup.nfbak"));
    formData.set("passphrase", "secure-backup-password");
    formData.set("confirmation", "NO");

    const response = await PUT({ formData: jest.fn().mockResolvedValue(formData) } as never);

    expect(response.status).toBe(400);
    expect(mockedRestore).not.toHaveBeenCalled();
  });

  it("decrypts and atomically restores a valid archive", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedDecrypt.mockReturnValue(storedBackup);
    mockedRestore.mockResolvedValue(42);
    const formData = new FormData();
    formData.set("backup", new File([new Uint8Array([1, 2, 3])], "backup.nfbak"));
    formData.set("passphrase", "secure-backup-password");
    formData.set("confirmation", "RESTORE");

    const response = await PUT({ formData: jest.fn().mockResolvedValue(formData) } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, records: 42 });
    expect(mockedDecrypt).toHaveBeenCalledWith(expect.any(Uint8Array), "secure-backup-password");
    expect(mockedRestore).toHaveBeenCalledWith(storedBackup);
  });
});
