import { constants, promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { z } from 'zod';

import type { TransferJob, TransferOverview, TransferPreview } from './types';

const execute = promisify(execFile);
const MAX_SNAPSHOT_BYTES = 250 * 1024 * 1024;
const uuid = z.string().uuid();
const counts = z.record(z.string(), z.number().int().nonnegative());
const previewSchema = z.object({
  database: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,62}$/), snapshotId: uuid,
  createdAt: z.string().datetime({ offset: true }), existingMovies: z.number().int().nonnegative(),
  counts, mediaFiles: z.number().int().nonnegative(), mediaSeconds: z.number().finite().nonnegative(),
});
const jobSchema = z.object({
  id: uuid, operation: z.enum(['export', 'import']), state: z.enum(['queued', 'running', 'succeeded', 'failed']),
  phase: z.enum(['queued', 'exporting', 'preparing', 'stopping', 'importing', 'restarting', 'completed', 'failed']),
  percent: z.number().min(0).max(100), createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }),
  restartCompleted: z.boolean(), diagnostic: z.literal('HOST_OPERATION_FAILED').optional(),
  backupAvailable: z.boolean().optional(),
}).strict();

export class TransferError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function root() { return path.resolve(process.env.CATALOG_TRANSFER_DIRECTORY || '/catalog-transfers'); }
export function transferEnvironment() { return process.env.DEPLOYMENT_ENVIRONMENT || 'unknown'; }
function fileIn(folder: string, id: string, extension = 'json') {
  if (!uuid.safeParse(id).success) throw new TransferError('Ungültige Transfer-ID.');
  return path.join(root(), folder, `${id}.${extension}`);
}

async function readSmall(file: string, maxBytes = 8192): Promise<unknown> {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > maxBytes) throw new TransferError('Ungültige Statusdatei.');
    return JSON.parse(await handle.readFile('utf8'));
  } finally { await handle.close(); }
}

export async function transferOverview(): Promise<TransferOverview> {
  const environment = transferEnvironment();
  let available = false;
  try {
    const heartbeat = z.object({ environment: z.string(), updatedAt: z.string().datetime({ offset: true }) }).parse(await readSmall(path.join(root(), 'host.json')));
    const age = Date.now() - Date.parse(heartbeat.updatedAt);
    available = heartbeat.environment === environment && age >= -5000 && age < 15000;
  } catch { /* An unconfigured or stopped host bridge disables new operations. */ }
  const files = await fs.readdir(path.join(root(), 'jobs')).catch(() => []);
  const jobs: TransferJob[] = [];
  for (const file of files) {
    if (!uuid.safeParse(file.replace(/\.json$/, '')).success || !file.endsWith('.json')) continue;
    try { jobs.push(jobSchema.parse(await readSmall(path.join(root(), 'jobs', file)))); } catch { /* Ignore incomplete or invalid records. */ }
  }
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { environment, available, canImport: ['local', 'staging'].includes(environment), jobs: jobs.slice(0, 20) };
}

async function requireHost() {
  const state = await transferOverview();
  if (!state.available) throw new TransferError('Der Transfer-Dienst ist nicht verfügbar. Bitte das aktualisierte Deployment prüfen.', 503);
  if (state.jobs.some(job => ['queued', 'running'].includes(job.state))) throw new TransferError('Ein Katalog-Transfer läuft bereits.', 409);
}

export function requireImportEnvironment() {
  if (!['local', 'staging'].includes(transferEnvironment())) throw new TransferError('Ein Katalogimport ist nur lokal oder auf Staging erlaubt.', 403);
}

export async function previewUpload(id: string): Promise<TransferPreview> {
  requireImportEnvironment();
  const file = fileIn('uploads', id);
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_SNAPSHOT_BYTES) throw new TransferError('Ungültige Snapshot-Datei.');
  try {
    const { stdout } = await execute(process.execPath, [
      path.join(process.cwd(), 'scripts', 'catalog-snapshot.js'), 'import', '--input', file, '--target', transferEnvironment(),
    ], { timeout: 120000, maxBuffer: 65536, env: process.env });
    return previewSchema.parse(JSON.parse(stdout.trim()));
  } catch {
    throw new TransferError('Der Snapshot ist ungültig, inkompatibel oder stammt aus derselben Datenbank. Prüfe Datei und Zieldatenbank.');
  }
}

export async function saveUpload(request: Request) {
  requireImportEnvironment();
  await requireHost();
  if (!request.body) throw new TransferError('Bitte eine Snapshot-Datei auswählen.');
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_SNAPSHOT_BYTES)) throw new TransferError('Die Datei überschreitet 250 MiB.', 413);
  const id = randomUUID();
  const file = fileIn('uploads', id);
  const handle = await fs.open(file, 'wx', 0o640);
  let size = 0;
  const reader = request.body.getReader();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_SNAPSHOT_BYTES) throw new TransferError('Die Datei überschreitet 250 MiB.', 413);
      await handle.writeFile(part.value);
    }
    await handle.close();
    if (!size) throw new TransferError('Die Snapshot-Datei ist leer.');
    const preview = await previewUpload(id);
    return { uploadId: id, preview };
  } catch (error) {
    await reader.cancel().catch(() => {});
    await handle.close().catch(() => {});
    await fs.rm(file, { force: true });
    throw error;
  } finally { reader.releaseLock(); }
}

async function publish(file: string, value: unknown) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value), { flag: 'wx', mode: 0o640 });
    await fs.link(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

export async function queueTransfer(input: { operation: 'export' | 'import'; uploadId?: string; confirmation?: string }) {
  if (input.operation === 'import') requireImportEnvironment();
  await requireHost();
  if (input.operation === 'import') {
    const preview = await previewUpload(input.uploadId || '');
    if (input.confirmation !== preview.database) throw new TransferError('Bitte den exakten Datenbanknamen aus der Vorschau bestätigen.');
  }
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const job: TransferJob = { id, operation: input.operation, state: 'queued', phase: 'queued', percent: 0, createdAt: timestamp, updatedAt: timestamp, restartCompleted: false };
  // Publish the visible job before the request, so a fast host cannot race its status.
  await publish(fileIn('jobs', id), job);
  try {
    await publish(fileIn('requests', id), {
      id, operation: input.operation, environment: transferEnvironment(), createdAt: timestamp,
      ...(input.operation === 'import' ? { uploadId: input.uploadId, confirmation: input.confirmation } : {}),
    });
  } catch (error) {
    await fs.rm(fileIn('jobs', id), { force: true });
    throw error;
  }
  return job;
}

export async function downloadTransfer(id: string, kind: 'snapshot' | 'backup') {
  const job = jobSchema.parse(await readSmall(fileIn('jobs', id)));
  if (kind === 'snapshot' && (job.operation !== 'export' || job.state !== 'succeeded')) throw new TransferError('Der Export ist noch nicht verfügbar.', 409);
  if (kind === 'backup' && (job.operation !== 'import' || !job.backupAvailable)) throw new TransferError('Keine abgeschlossene Zielsicherung vorhanden.', 409);
  const extension = kind === 'backup' ? 'sql' : 'json';
  const handle = await fs.open(fileIn(kind === 'backup' ? 'backups' : 'exports', id, extension), constants.O_RDONLY | constants.O_NOFOLLOW);
  const stat = await handle.stat();
  if (!stat.isFile() || stat.size > 500 * 1024 * 1024) { await handle.close(); throw new TransferError('Ungültige Transferdatei.'); }
  return new Response(Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>, {
    headers: {
      'Content-Type': kind === 'backup' ? 'application/sql' : 'application/json',
      'Content-Disposition': `attachment; filename="catalog-snapshot-${kind}-${id}.${extension}"`,
      'Content-Length': String(stat.size), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    },
  });
}
