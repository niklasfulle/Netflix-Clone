/** @jest-environment node */
jest.mock('node:child_process', () => {
  const execute = jest.fn();
  Object.defineProperty(execute, require('node:util').promisify.custom, { value: jest.fn() });
  return { execFile: execute };
});

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { transferOverview, saveUpload, queueTransfer, downloadTransfer } from '../store';

const id = '550e8400-e29b-41d4-a716-446655440000';
const execute = (execFile as unknown as Record<symbol, jest.Mock>)[promisify.custom];
const preview = { preview: true, database: 'netflix_local', snapshotId: id, createdAt: new Date().toISOString(), existingMovies: 2, counts: { movies: 3, categories: 1 }, mediaFiles: 1, mediaSeconds: 20 };
let directory: string;
const previous = { directory: process.env.CATALOG_TRANSFER_DIRECTORY, environment: process.env.DEPLOYMENT_ENVIRONMENT };

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-transfer-test-'));
  process.env.CATALOG_TRANSFER_DIRECTORY = directory;
  process.env.DEPLOYMENT_ENVIRONMENT = 'local';
  for (const name of ['uploads', 'requests', 'jobs', 'exports', 'backups']) await fs.mkdir(path.join(directory, name));
  await fs.writeFile(path.join(directory, 'host.json'), JSON.stringify({ environment: 'local', updatedAt: new Date().toISOString() }));
  execute.mockReset().mockResolvedValue({ stdout: JSON.stringify(preview), stderr: '' });
});

afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true });
  if (previous.directory === undefined) delete process.env.CATALOG_TRANSFER_DIRECTORY;
  else process.env.CATALOG_TRANSFER_DIRECTORY = previous.directory;
  if (previous.environment === undefined) delete process.env.DEPLOYMENT_ENVIRONMENT;
  else process.env.DEPLOYMENT_ENVIRONMENT = previous.environment;
});

it('requires a live matching host heartbeat', async () => {
  expect((await transferOverview()).available).toBe(true);
  await fs.writeFile(path.join(directory, 'host.json'), JSON.stringify({ environment: 'production', updatedAt: new Date().toISOString() }));
  expect((await transferOverview()).available).toBe(false);
  await expect(queueTransfer({ operation: 'export' })).rejects.toMatchObject({ status: 503 });
});

it('streams a bounded upload, checks it in the CLI, and only then queues an import', async () => {
  const result = await saveUpload(new Request('http://localhost/api', { method: 'PATCH', body: '{"catalog":"fixture"}' }));
  expect(result.preview).toMatchObject({ database: 'netflix_local' });
  expect(execute.mock.calls[0][1]).toContain('import');
  await expect(queueTransfer({ operation: 'import', uploadId: result.uploadId, confirmation: 'wrong-db' })).rejects.toThrow('Datenbanknamen');
  expect(await fs.readdir(path.join(directory, 'requests'))).toHaveLength(0);
  const job = await queueTransfer({ operation: 'import', uploadId: result.uploadId, confirmation: 'netflix_local' });
  expect(job.state).toBe('queued');
  const request = JSON.parse(await fs.readFile(path.join(directory, 'requests', `${job.id}.json`), 'utf8'));
  expect(request).toMatchObject({ operation: 'import', environment: 'local', uploadId: result.uploadId });
  expect((await transferOverview()).jobs).toHaveLength(1);
  await expect(queueTransfer({ operation: 'export' })).rejects.toMatchObject({ status: 409 });
});

it('rejects production before reading a body, and rejects oversized uploads', async () => {
  process.env.DEPLOYMENT_ENVIRONMENT = 'production';
  await expect(saveUpload({} as Request)).rejects.toMatchObject({ status: 403 });
  expect(execute).not.toHaveBeenCalled();
  process.env.DEPLOYMENT_ENVIRONMENT = 'local';
  await expect(saveUpload(new Request('http://localhost/api', { method: 'PATCH', headers: { 'Content-Length': String(251 * 1024 * 1024) }, body: '{}' }))).rejects.toMatchObject({ status: 413 });
});

it('removes rejected upload files without exposing CLI output', async () => {
  execute.mockRejectedValue(new Error('private record text'));
  await expect(saveUpload(new Request('http://localhost/api', { method: 'PATCH', body: '{}' }))).rejects.toThrow('Snapshot ist ungültig');
  expect(await fs.readdir(path.join(directory, 'uploads'))).toHaveLength(0);
});

it('downloads only completed exports and completed target backups', async () => {
  const job = await queueTransfer({ operation: 'export' });
  await expect(downloadTransfer(job.id, 'snapshot')).rejects.toMatchObject({ status: 409 });
  await fs.writeFile(path.join(directory, 'jobs', `${job.id}.json`), JSON.stringify({ ...job, state: 'succeeded', phase: 'completed', percent: 100 }));
  await fs.writeFile(path.join(directory, 'exports', `${job.id}.json`), '{"format":"fixture"}');
  const response = await downloadTransfer(job.id, 'snapshot');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Content-Disposition')).toContain(job.id);
  expect(await response.json()).toEqual({ format: 'fixture' });
  await expect(downloadTransfer(job.id, 'backup')).rejects.toMatchObject({ status: 409 });
  await expect(downloadTransfer('../../private', 'snapshot')).rejects.toMatchObject({ status: 400 });
});
