import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';
import Page from '../page';

jest.mock('swr');
const mutate = jest.fn();
const id = '550e8400-e29b-41d4-a716-446655440000';
const job = { id, operation: 'import', state: 'running', phase: 'preparing', percent: 50, createdAt: '2026-10-30T12:00:00.000Z', updatedAt: '2026-10-30T12:00:00.000Z', restartCompleted: false };
let overview: Record<string, unknown>;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  overview = { environment: 'local', available: true, canImport: true, jobs: [] };
  (useSWR as jest.Mock).mockImplementation(() => ({ data: overview, mutate }));
  globalThis.fetch = jest.fn();
});

afterEach(() => { delete (globalThis as { fetch?: typeof fetch }).fetch; });

it('allows production export while explaining why imports are disabled', () => {
  overview = { ...overview, environment: 'production', canImport: false };
  render(<Page />);
  expect(screen.getByRole('button', { name: 'Create export' })).toBeEnabled();
  expect(screen.getByText(/Production allows exports only/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Snapshot JSON file')).not.toBeInTheDocument();
});

it('requires an uploaded preview and exact target name before importing and restarting', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ uploadId: id, preview: { database: 'netflix_local', counts: { movies: 6, categories: 2 }, mediaFiles: 1, existingMovies: 3 } }) });
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ job }) });
  render(<Page />);
  fireEvent.change(screen.getByLabelText('Snapshot JSON file'), { target: { files: [new File(['{}'], 'catalog-snapshot-test.json', { type: 'application/json' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload and preview' }));
  const start = await screen.findByRole('button', { name: 'Replace catalog and restart' });
  expect(start).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Confirm target database/), { target: { value: 'netflix_local' } });
  expect(start).toBeEnabled();
  fireEvent.click(start);
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/catalog-transfers', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ uploadId: id, confirmation: 'netflix_local' }) })));
  expect(await screen.findByRole('heading', { name: 'Preparing replacement videos' })).toBeInTheDocument();
});

it('keeps a running import visible through the restart and confirms successful recovery', () => {
  localStorage.setItem('catalog-transfer-active', id);
  overview.jobs = [{ ...job, phase: 'restarting', percent: 95 }];
  (useSWR as jest.Mock).mockReturnValue({ data: overview, error: new Error('offline'), mutate });
  const { rerender } = render(<Page />);
  expect(screen.getByText(/This page reconnects automatically/)).toBeInTheDocument();
  (useSWR as jest.Mock).mockReturnValue({ data: { ...overview, jobs: [{ ...job, state: 'succeeded', phase: 'completed', percent: 100, restartCompleted: true, backupAvailable: true }] }, mutate });
  rerender(<Page />);
  expect(screen.getByText(/App and worker have restarted successfully/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Download target backup' })).toHaveAttribute('href', expect.stringContaining('kind=backup'));
  expect(localStorage.getItem('catalog-transfer-active')).toBeNull();
});

it('disables operations when the host is unavailable and offers completed downloads', () => {
  overview.available = false;
  overview.jobs = [{ ...job, operation: 'export', state: 'succeeded', phase: 'completed', percent: 100 }];
  render(<Page />);
  expect(screen.getByRole('button', { name: 'Create export' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Download JSON' })).toHaveAttribute('href', `/api/admin/catalog-transfers/${id}/download`);
});
