import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const ARCHIVE_FORMAT = "netflix-clone-encrypted-backup";
const PAYLOAD_FORMAT = "netflix-clone-database-backup";
const BACKUP_VERSION = 1;
const KEY_ITERATIONS = 210_000;
const KEY_LENGTH = 32;

export const MIN_BACKUP_PASSPHRASE_LENGTH = 12;
export const MAX_BACKUP_FILE_SIZE = 100 * 1024 * 1024;
export const RESTORE_CONFIRMATION = "RESTORE";

export interface BackupCollections {
  users: Prisma.UserCreateManyInput[];
  accounts: Prisma.AccountCreateManyInput[];
  verificationTokens: Prisma.VerificationTokenCreateManyInput[];
  passwordResetTokens: Prisma.PasswordResetTokenCreateManyInput[];
  twoFactorTokens: Prisma.TwoFactorTokenCreateManyInput[];
  twoFactorConfirmations: Prisma.TwoFactorConfirmationCreateManyInput[];
  profiles: Prisma.ProfilCreateManyInput[];
  movies: Prisma.MovieCreateManyInput[];
  actors: Prisma.ActorCreateManyInput[];
  movieActors: Prisma.MovieActorCreateManyInput[];
  profileImages: Prisma.ProfilImgCreateManyInput[];
  movieWatchTimes: Prisma.MovieWatchTimeCreateManyInput[];
  movieViews: Prisma.MovieViewCreateManyInput[];
  playlists: Prisma.PlaylistCreateManyInput[];
  playlistEntries: Prisma.PlaylistEntryCreateManyInput[];
  watchlists: Prisma.WatchlistCreateManyInput[];
}

export interface DatabaseBackup {
  format: typeof PAYLOAD_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  data: BackupCollections;
}

interface EncryptedBackupEnvelope {
  format: typeof ARCHIVE_FORMAT;
  version: typeof BACKUP_VERSION;
  algorithm: "aes-256-gcm";
  keyDerivation: "pbkdf2-sha256";
  iterations: typeof KEY_ITERATIONS;
  salt: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

const collectionNames = [
  "users",
  "accounts",
  "verificationTokens",
  "passwordResetTokens",
  "twoFactorTokens",
  "twoFactorConfirmations",
  "profiles",
  "movies",
  "actors",
  "movieActors",
  "profileImages",
  "movieWatchTimes",
  "movieViews",
  "playlists",
  "playlistEntries",
  "watchlists",
] as const satisfies readonly (keyof BackupCollections)[];

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupValidationError";
  }
}

function assertPassphrase(passphrase: string) {
  if (
    typeof passphrase !== "string"
    || passphrase.length < MIN_BACKUP_PASSPHRASE_LENGTH
    || passphrase.length > 256
  ) {
    throw new BackupValidationError(
      `Das Backup-Passwort muss zwischen ${MIN_BACKUP_PASSPHRASE_LENGTH} und 256 Zeichen lang sein.`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDatabaseBackup(value: unknown): DatabaseBackup {
  if (!isRecord(value) || value.format !== PAYLOAD_FORMAT || value.version !== BACKUP_VERSION) {
    throw new BackupValidationError("Die Datei ist kein unterstütztes Netflix-Datenbank-Backup.");
  }
  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) {
    throw new BackupValidationError("Das Backup enthält kein gültiges Erstellungsdatum.");
  }
  if (!isRecord(value.data)) {
    throw new BackupValidationError("Das Backup enthält keine gültigen Daten.");
  }

  for (const name of collectionNames) {
    if (!Array.isArray(value.data[name])) {
      throw new BackupValidationError(`Die Backup-Sammlung "${name}" fehlt oder ist ungültig.`);
    }
  }

  const users = value.data.users as Array<Record<string, unknown>>;
  if (!users.some((user) => user.role === "ADMIN")) {
    throw new BackupValidationError(
      "Das Backup enthält kein Administratorkonto und würde den Admin-Zugang sperren.",
    );
  }

  return value as unknown as DatabaseBackup;
}

export function countBackupRecords(backup: DatabaseBackup): number {
  return collectionNames.reduce((total, name) => total + backup.data[name].length, 0);
}

export async function collectDatabaseBackup(database: typeof db = db): Promise<DatabaseBackup> {
  const [
    users,
    accounts,
    verificationTokens,
    passwordResetTokens,
    twoFactorTokens,
    twoFactorConfirmations,
    profiles,
    movies,
    actors,
    movieActors,
    profileImages,
    movieWatchTimes,
    movieViews,
    playlists,
    playlistEntries,
    watchlists,
  ] = await Promise.all([
    database.user.findMany(),
    database.account.findMany(),
    database.verificationToken.findMany(),
    database.passwordResetToken.findMany(),
    database.twoFactorToken.findMany(),
    database.twoFactorConfirmation.findMany(),
    database.profil.findMany(),
    database.movie.findMany(),
    database.actor.findMany(),
    database.movieActor.findMany(),
    database.profilImg.findMany(),
    database.movieWatchTime.findMany(),
    database.movieView.findMany(),
    database.playlist.findMany(),
    database.playlistEntry.findMany(),
    database.watchlist.findMany(),
  ]);

  return {
    format: PAYLOAD_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: {
      users,
      accounts,
      verificationTokens,
      passwordResetTokens,
      twoFactorTokens,
      twoFactorConfirmations,
      profiles,
      movies,
      actors,
      movieActors,
      profileImages,
      movieWatchTimes,
      movieViews,
      playlists,
      playlistEntries,
      watchlists,
    },
  };
}

export function encryptDatabaseBackup(backup: DatabaseBackup, passphrase: string): Uint8Array {
  assertPassphrase(passphrase);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(passphrase, salt, KEY_ITERATIONS, KEY_LENGTH, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(backup), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  const envelope: EncryptedBackupEnvelope = {
    format: ARCHIVE_FORMAT,
    version: BACKUP_VERSION,
    algorithm: "aes-256-gcm",
    keyDerivation: "pbkdf2-sha256",
    iterations: KEY_ITERATIONS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  return new Uint8Array(Buffer.from(JSON.stringify(envelope), "utf8"));
}

export function decryptDatabaseBackup(archive: Uint8Array, passphrase: string): DatabaseBackup {
  assertPassphrase(passphrase);
  if (archive.byteLength === 0 || archive.byteLength > MAX_BACKUP_FILE_SIZE) {
    throw new BackupValidationError("Die Backup-Datei ist leer oder überschreitet 100 MB.");
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(Buffer.from(archive).toString("utf8"));
  } catch {
    throw new BackupValidationError("Die Backup-Datei ist beschädigt oder hat ein ungültiges Format.");
  }

  if (
    !isRecord(envelope)
    || envelope.format !== ARCHIVE_FORMAT
    || envelope.version !== BACKUP_VERSION
    || envelope.algorithm !== "aes-256-gcm"
    || envelope.keyDerivation !== "pbkdf2-sha256"
    || envelope.iterations !== KEY_ITERATIONS
    || typeof envelope.salt !== "string"
    || typeof envelope.iv !== "string"
    || typeof envelope.authTag !== "string"
    || typeof envelope.ciphertext !== "string"
  ) {
    throw new BackupValidationError("Die Datei ist kein unterstütztes verschlüsseltes Backup.");
  }

  try {
    const salt = Buffer.from(envelope.salt, "base64");
    const iv = Buffer.from(envelope.iv, "base64");
    const authTag = Buffer.from(envelope.authTag, "base64");
    if (salt.length !== 16 || iv.length !== 12 || authTag.length !== 16) {
      throw new Error("Invalid encryption metadata");
    }

    const key = pbkdf2Sync(passphrase, salt, KEY_ITERATIONS, KEY_LENGTH, "sha256");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]);
    return validateDatabaseBackup(JSON.parse(plaintext.toString("utf8")));
  } catch (error) {
    if (error instanceof BackupValidationError) throw error;
    throw new BackupValidationError(
      "Das Backup konnte nicht entschlüsselt werden. Prüfe Datei und Passwort.",
    );
  }
}

async function clearDatabase(transaction: Prisma.TransactionClient) {
  await transaction.playlistEntry.deleteMany();
  await transaction.playlist.deleteMany();
  await transaction.watchlist.deleteMany();
  await transaction.movieActor.deleteMany();
  await transaction.movieWatchTime.deleteMany();
  await transaction.movieView.deleteMany();
  await transaction.account.deleteMany();
  await transaction.twoFactorConfirmation.deleteMany();
  await transaction.profil.deleteMany();
  await transaction.verificationToken.deleteMany();
  await transaction.passwordResetToken.deleteMany();
  await transaction.twoFactorToken.deleteMany();
  await transaction.movie.deleteMany();
  await transaction.actor.deleteMany();
  await transaction.profilImg.deleteMany();
  await transaction.user.deleteMany();
}

async function restorePrimaryCollections(
  transaction: Prisma.TransactionClient,
  data: BackupCollections,
) {
  if (data.users.length) await transaction.user.createMany({ data: data.users });
  if (data.verificationTokens.length) {
    await transaction.verificationToken.createMany({ data: data.verificationTokens });
  }
  if (data.passwordResetTokens.length) {
    await transaction.passwordResetToken.createMany({ data: data.passwordResetTokens });
  }
  if (data.twoFactorTokens.length) {
    await transaction.twoFactorToken.createMany({ data: data.twoFactorTokens });
  }
  if (data.actors.length) await transaction.actor.createMany({ data: data.actors });
  if (data.profileImages.length) {
    await transaction.profilImg.createMany({ data: data.profileImages });
  }
  if (data.movies.length) await transaction.movie.createMany({ data: data.movies });
  if (data.accounts.length) await transaction.account.createMany({ data: data.accounts });
}

async function restoreDependentCollections(
  transaction: Prisma.TransactionClient,
  data: BackupCollections,
) {
  if (data.twoFactorConfirmations.length) {
    await transaction.twoFactorConfirmation.createMany({ data: data.twoFactorConfirmations });
  }
  if (data.profiles.length) await transaction.profil.createMany({ data: data.profiles });
  if (data.movieActors.length) {
    await transaction.movieActor.createMany({ data: data.movieActors });
  }
  if (data.movieWatchTimes.length) {
    await transaction.movieWatchTime.createMany({ data: data.movieWatchTimes });
  }
  if (data.movieViews.length) {
    await transaction.movieView.createMany({ data: data.movieViews });
  }
  if (data.playlists.length) {
    await transaction.playlist.createMany({ data: data.playlists });
  }
  if (data.playlistEntries.length) {
    await transaction.playlistEntry.createMany({ data: data.playlistEntries });
  }
  if (data.watchlists.length) {
    await transaction.watchlist.createMany({ data: data.watchlists });
  }
}

export async function restoreDatabaseBackup(
  backup: DatabaseBackup,
  database: typeof db = db,
): Promise<number> {
  validateDatabaseBackup(backup);

  await database.$transaction(async (transaction) => {
    await clearDatabase(transaction);
    await restorePrimaryCollections(transaction, backup.data);
    await restoreDependentCollections(transaction, backup.data);
  }, {
    maxWait: 10_000,
    timeout: 120_000,
  });

  return countBackupRecords(backup);
}
