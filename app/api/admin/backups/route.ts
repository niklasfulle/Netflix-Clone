import {
  BackupValidationError,
  collectDatabaseBackup,
  countBackupRecords,
  decryptDatabaseBackup,
  encryptDatabaseBackup,
  MAX_BACKUP_FILE_SIZE,
  MIN_BACKUP_PASSPHRASE_LENGTH,
  restoreDatabaseBackup,
  RESTORE_CONFIRMATION,
} from "@/lib/admin-backup";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { recordBackupStatus } from "@/lib/backup-status";
import { logBackendAction } from "@/lib/logger";
import {
  OperationalLeaseLostError,
  OperationalLeaseUnavailableError,
} from "@/lib/operations/lease";
import { operationalLeases } from "@/lib/operations/runtime";

export const runtime = "nodejs";

function backupFileName(createdAt: string) {
  const timestamp = createdAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  return `netflix-backup-${timestamp}.nfbak`;
}

function errorResponse(error: unknown) {
  if (error instanceof BackupValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (
    error instanceof OperationalLeaseUnavailableError
    || error instanceof OperationalLeaseLostError
  ) {
    return Response.json(
      { error: "Eine andere Backup-Aktion läuft bereits. Versuche es später erneut." },
      { status: 409 },
    );
  }
  return Response.json({ error: "Die Backup-Aktion ist fehlgeschlagen." }, { status: 500 });
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('backup.create');
  if (!(await isCurrentUserAdmin())) {
    await audit.denied();
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const passphrase = typeof body?.passphrase === "string" ? body.passphrase : "";
    if (passphrase.length < MIN_BACKUP_PASSPHRASE_LENGTH || passphrase.length > 256) {
      await audit.failed();
      return Response.json(
        { error: `Das Backup-Passwort muss zwischen ${MIN_BACKUP_PASSPHRASE_LENGTH} und 256 Zeichen lang sein.` },
        { status: 400 },
      );
    }
    return await operationalLeases.execute({
      operation: "backup.create",
      targetId: "database",
      ttlMs: 5 * 60_000,
    }, async () => {
      const backup = await collectDatabaseBackup();
      const archive = encryptDatabaseBackup(backup, passphrase);
      const records = countBackupRecords(backup);
      try {
        await recordBackupStatus({
          createdAt: backup.createdAt,
          sizeBytes: archive.byteLength,
          records,
        });
      } catch {
        logBackendAction(
          "admin_backup_status_write_failed",
          { createdAt: backup.createdAt },
          "warn",
        );
      }
      const responseBody = new ArrayBuffer(archive.byteLength);
      new Uint8Array(responseBody).set(archive);

      logBackendAction(
        "admin_backup_created",
        { records, bytes: archive.byteLength, createdAt: backup.createdAt },
        "info",
      );
      await audit.succeeded({
        target: { type: 'backup', id: backup.createdAt },
        metadata: { source: 'manual', scheduled: false },
      });
      return new Response(responseBody, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${backupFileName(backup.createdAt)}"`,
          "Content-Length": String(archive.byteLength),
          "Content-Type": "application/octet-stream",
          "X-Backup-Records": String(records),
        },
      });
    });
  } catch (error) {
    await audit.failed();
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const audit = adminMutationAudit.begin('backup.restore');
  if (!(await isCurrentUserAdmin())) {
    await audit.denied();
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("backup");
    const passphrase = formData.get("passphrase");
    const confirmation = formData.get("confirmation");

    if (!(file instanceof File)) {
      await audit.failed();
      return Response.json({ error: "Bitte wähle eine Backup-Datei aus." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BACKUP_FILE_SIZE) {
      await audit.failed();
      return Response.json({ error: "Die Backup-Datei ist leer oder überschreitet 100 MB." }, { status: 400 });
    }
    if (typeof passphrase !== "string") {
      await audit.failed();
      return Response.json({ error: "Das Backup-Passwort fehlt." }, { status: 400 });
    }
    if (confirmation !== RESTORE_CONFIRMATION) {
      await audit.failed();
      return Response.json(
        { error: `Gib zur Bestätigung ${RESTORE_CONFIRMATION} ein.` },
        { status: 400 },
      );
    }

    const archive = new Uint8Array(await file.arrayBuffer());
    const backup = decryptDatabaseBackup(archive, passphrase);
    return await operationalLeases.execute({
      operation: "restore.verify",
      targetId: "database",
      ttlMs: 5 * 60_000,
    }, async ({ assertCurrent }) => {
      await assertCurrent();
      const records = await restoreDatabaseBackup(backup);
      await assertCurrent();

      logBackendAction(
        "admin_backup_restored",
        { records, backupCreatedAt: backup.createdAt },
        "warn",
      );
      await audit.succeeded({
        target: { type: 'backup', id: backup.createdAt },
        metadata: { verificationStatus: 'accepted' },
      });
      return Response.json({
        success: true,
        records,
        backupCreatedAt: backup.createdAt,
        message: "Das Datenbank-Backup wurde vollständig wiederhergestellt.",
      });
    });
  } catch (error) {
    await audit.failed();
    return errorResponse(error);
  }
}
