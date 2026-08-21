"use client";

import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileArchive,
  KeyRound,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BackupVerificationPanel } from "@/components/admin/BackupVerificationPanel";

const MIN_PASSPHRASE_LENGTH = 12;
const RESTORE_CONFIRMATION = "RESTORE";

function getDownloadName(contentDisposition: string | null) {
  const match = /filename="([^"]+)"/.exec(contentDisposition || "");
  return match?.[1] || `netflix-backup-${new Date().toISOString().slice(0, 10)}.nfbak`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  return data?.error || "The backup action failed.";
}

export default function AdminBackupsPage() {
  const [createPassphrase, setCreatePassphrase] = useState("");
  const [createConfirmation, setCreateConfirmation] = useState("");
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [restoreAcknowledged, setRestoreAcknowledged] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBackup = async () => {
    setError("");
    setCreateMessage("");
    if (createPassphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`The backup password must contain at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (createPassphrase !== createConfirmation) {
      setError("The backup passwords do not match.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: createPassphrase }),
      });
      if (!response.ok) throw new Error(await readError(response));

      const archive = await response.blob();
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getDownloadName(response.headers.get("Content-Disposition"));
      anchor.click();
      URL.revokeObjectURL(url);

      const records = response.headers.get("X-Backup-Records");
      setCreateMessage(
        records
          ? `Encrypted backup created with ${records} database records.`
          : "Encrypted backup created successfully.",
      );
      setCreatePassphrase("");
      setCreateConfirmation("");
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "The backup could not be created.");
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    setError("");
    setRestoreMessage("");
    if (!backupFile) {
      setError("Select a .nfbak backup file.");
      return;
    }
    if (restorePassphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`The backup password must contain at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (restoreConfirmation !== RESTORE_CONFIRMATION || !restoreAcknowledged) {
      setError(`Enter ${RESTORE_CONFIRMATION} and confirm the restore warning.`);
      return;
    }
    if (!globalThis.confirm(
      "Restore this backup now? The current database content will be replaced completely.",
    )) {
      return;
    }

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.set("backup", backupFile);
      formData.set("passphrase", restorePassphrase);
      formData.set("confirmation", restoreConfirmation);
      const response = await fetch("/api/admin/backups", { method: "PUT", body: formData });
      if (!response.ok) throw new Error(await readError(response));

      const data = await response.json();
      setRestoreMessage(
        `Backup restored successfully. ${data.records} database records were imported.`,
      );
      setBackupFile(null);
      setRestorePassphrase("");
      setRestoreConfirmation("");
      setRestoreAcknowledged(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "The backup could not be restored.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Database Backups"
        description="Create encrypted snapshots of all application data or restore a previous state."
      />

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <BackupVerificationPanel />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-start gap-4 border-b border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <Download className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Create Backup</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Download all database records as an encrypted backup file.
              </p>
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100/70">
              <div className="mb-2 flex items-center gap-2 font-medium text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                AES-256 encrypted
              </div>
              The password is not stored. You need the same password to restore this backup.
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-200">
                <KeyRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                Backup Password
              </span>
              <input
                type="password"
                value={createPassphrase}
                onChange={(event) => setCreatePassphrase(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Repeat Password</span>
              <input
                type="password"
                value={createConfirmation}
                onChange={(event) => setCreateConfirmation(event.target.value)}
                autoComplete="new-password"
                placeholder="Repeat backup password"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500"
              />
            </label>

            <button
              type="button"
              onClick={createBackup}
              disabled={creating}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {creating ? "Creating Backup..." : "Create and Download Backup"}
            </button>

            {createMessage && (
              <output className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {createMessage}
              </output>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-red-500/20 bg-zinc-900/50">
          <div className="flex items-start gap-4 border-b border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
            <span className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Restore Backup</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Replace the current database with a previously created backup.
              </p>
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100/80">
              <div className="mb-1 flex items-center gap-2 font-semibold text-red-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Destructive Action
              </div>
              All current database records will be replaced. The restore is atomic, but cannot be undone after completion.
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Backup File</span>
              <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/70 p-4 text-center transition hover:border-zinc-600">
                <FileArchive className="mb-2 h-6 w-6 text-zinc-500" aria-hidden="true" />
                <span className="text-sm font-medium text-zinc-300">
                  {backupFile ? backupFile.name : "Select .nfbak file"}
                </span>
                <span className="mt-1 text-xs text-zinc-600">
                  {backupFile ? formatFileSize(backupFile.size) : "Maximum file size: 100 MB"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  aria-label="Backup File"
                  accept=".nfbak,application/octet-stream"
                  className="sr-only"
                  onChange={(event) => setBackupFile(event.target.files?.[0] || null)}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Backup Password</span>
              <input
                type="password"
                value={restorePassphrase}
                onChange={(event) => setRestorePassphrase(event.target.value)}
                autoComplete="current-password"
                placeholder="Password used when creating the backup"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Enter {RESTORE_CONFIRMATION} to confirm
              </span>
              <input
                value={restoreConfirmation}
                onChange={(event) => setRestoreConfirmation(event.target.value)}
                autoComplete="off"
                placeholder={RESTORE_CONFIRMATION}
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-white outline-none focus:border-red-500"
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <input
                type="checkbox"
                checked={restoreAcknowledged}
                onChange={(event) => setRestoreAcknowledged(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />
              <span className="text-sm leading-5 text-zinc-400">
                I understand that the current database content will be replaced.
              </span>
            </label>

            <button
              type="button"
              onClick={restoreBackup}
              disabled={restoring}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DatabaseBackup className="h-4 w-4" aria-hidden="true" />}
              {restoring ? "Restoring Backup..." : "Restore Database Backup"}
            </button>

            {restoreMessage && (
              <output className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {restoreMessage}
              </output>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="font-semibold text-white">Backup Scope</h2>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="font-medium text-zinc-200">Included</p>
            <p className="mt-2 leading-6 text-zinc-500">
              Users, profiles, movies, series, actors, playlists, watchlists, views, progress and authentication data.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="font-medium text-zinc-200">Not Included</p>
            <p className="mt-2 leading-6 text-zinc-500">
              Video and image files are not embedded. Their database paths and assignments are preserved.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="font-medium text-zinc-200">Security</p>
            <p className="mt-2 leading-6 text-zinc-500">
              OAuth tokens and password hashes are included only inside the encrypted archive.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
