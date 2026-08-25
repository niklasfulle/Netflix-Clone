import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { BackupRetentionPanel } from '@/components/admin/BackupRetentionPanel';

beforeEach(() => {
  globalThis.sessionStorage.clear();
});

function renderPanel() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <BackupRetentionPanel />
    </SWRConfig>,
  );
}

it('queues backup retention cleanup without exposing host paths or policy values', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ jobRunId: 'retention-job-run-123', status: 'QUEUED' }),
  });

  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'Run Backup Retention Cleanup' }));

  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
    '/api/admin/backups/retention',
    expect.objectContaining({ method: 'POST' }),
  ));
  expect(await screen.findByRole('status')).toHaveTextContent('Retention cleanup queued');
  expect(JSON.stringify((globalThis.fetch as jest.Mock).mock.calls)).not.toContain(
    '/root/netflix-database-backups',
  );
});

it('shows progress and lets an administrator cancel an accepted retention job', async () => {
  globalThis.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/admin/backups/retention') {
      return {
        ok: true,
        json: async () => ({ jobRunId: 'retention-job-run-456', status: 'QUEUED' }),
      } as Response;
    }
    if (url === '/api/admin/jobs/retention-job-run-456' && init?.method === 'DELETE') {
      return {
        ok: true,
        json: async () => ({
          id: 'retention-job-run-456',
          status: 'CANCELLED',
          progress: 40,
          progressMessage: 'Cancelled',
          errorMessage: null,
        }),
      } as Response;
    }
    if (url === '/api/admin/jobs/retention-job-run-456') {
      return {
        ok: true,
        json: async () => ({
          id: 'retention-job-run-456',
          status: 'RUNNING',
          progress: 40,
          progressMessage: 'Removing expired backups',
          errorMessage: null,
        }),
      } as Response;
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  const firstRender = renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'Run Backup Retention Cleanup' }));

  expect(await screen.findByText('Removing expired backups · 40%')).toBeVisible();
  firstRender.unmount();
  (globalThis.fetch as jest.Mock).mockClear();
  renderPanel();

  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
    '/api/admin/jobs/retention-job-run-456',
    { cache: 'no-store' },
  ));
  expect(await screen.findByText('Removing expired backups · 40%')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel retention cleanup' }));

  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
    '/api/admin/jobs/retention-job-run-456',
    expect.objectContaining({ method: 'DELETE' }),
  ));
  expect(await screen.findByRole('status')).toHaveTextContent('Retention cleanup cancelled.');
});

it('reports a timed-out retention job as failed and permits another attempt', async () => {
  globalThis.fetch = jest.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url === '/api/admin/backups/retention') {
      return {
        ok: true,
        json: async () => ({ jobRunId: 'retention-job-run-timeout', status: 'QUEUED' }),
      } as Response;
    }
    if (url === '/api/admin/jobs/retention-job-run-timeout') {
      return {
        ok: true,
        json: async () => ({
          id: 'retention-job-run-timeout',
          status: 'FAILED',
          progress: 35,
          progressMessage: 'Timed out',
          errorMessage: 'Worker timed out after 30 seconds.',
        }),
      } as Response;
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'Run Backup Retention Cleanup' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Retention cleanup failed.');
  expect(screen.getByRole('alert')).toHaveTextContent('Worker timed out after 30 seconds.');
  expect(screen.getByRole('button', { name: 'Run Backup Retention Cleanup' })).toBeEnabled();
});
