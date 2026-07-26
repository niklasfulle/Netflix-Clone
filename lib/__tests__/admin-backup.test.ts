/** @jest-environment node */

import {
  BackupValidationError,
  type DatabaseBackup,
  decryptDatabaseBackup,
  encryptDatabaseBackup,
  restoreDatabaseBackup,
  validateDatabaseBackup,
} from "@/lib/admin-backup";

const backup: DatabaseBackup = {
  format: "netflix-clone-database-backup",
  version: 1,
  createdAt: "2026-07-26T12:00:00.000Z",
  data: {
    users: [{ id: "admin", name: "Admin", role: "ADMIN" }],
    accounts: [],
    verificationTokens: [],
    passwordResetTokens: [],
    twoFactorTokens: [],
    twoFactorConfirmations: [],
    profiles: [],
    movies: [],
    actors: [],
    movieActors: [],
    profileImages: [],
    movieWatchTimes: [],
    movieViews: [],
    playlists: [],
    playlistEntries: [],
    watchlists: [],
  },
};

describe("admin database backups", () => {
  it("encrypts and decrypts a versioned backup", () => {
    const archive = encryptDatabaseBackup(backup, "a-very-secure-backup-password");

    expect(archive).toBeInstanceOf(Uint8Array);
    expect(decryptDatabaseBackup(archive, "a-very-secure-backup-password")).toEqual(backup);
  });

  it("rejects a wrong password without exposing backup contents", () => {
    const archive = encryptDatabaseBackup(backup, "a-very-secure-backup-password");

    expect(() => decryptDatabaseBackup(archive, "another-secure-password")).toThrow(
      "Das Backup konnte nicht entschlüsselt werden",
    );
  });

  it("rejects backups that would remove all administrators", () => {
    const withoutAdmin = structuredClone(backup);
    withoutAdmin.data.users = [{ id: "user", name: "User", role: "USER" }];

    expect(() => validateDatabaseBackup(withoutAdmin)).toThrow(BackupValidationError);
    expect(() => validateDatabaseBackup(withoutAdmin)).toThrow("kein Administratorkonto");
  });

  it("restores inside one transaction and deletes before inserting", async () => {
    const delegate = () => ({ deleteMany: jest.fn(), createMany: jest.fn() });
    const transaction = {
      user: delegate(),
      account: delegate(),
      verificationToken: delegate(),
      passwordResetToken: delegate(),
      twoFactorToken: delegate(),
      twoFactorConfirmation: delegate(),
      profil: delegate(),
      movie: delegate(),
      actor: delegate(),
      movieActor: delegate(),
      profilImg: delegate(),
      movieWatchTime: delegate(),
      movieView: delegate(),
      playlist: delegate(),
      playlistEntry: delegate(),
      watchlist: delegate(),
    };
    const database = {
      $transaction: jest.fn(async (operation: (tx: typeof transaction) => Promise<void>) => {
        await operation(transaction);
      }),
    };

    await expect(restoreDatabaseBackup(backup, database as never)).resolves.toBe(1);
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      maxWait: 10_000,
      timeout: 120_000,
    });
    expect(transaction.user.deleteMany).toHaveBeenCalledTimes(1);
    expect(transaction.user.createMany).toHaveBeenCalledWith({ data: backup.data.users });
    expect(transaction.user.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      transaction.user.createMany.mock.invocationCallOrder[0],
    );
  });
});
