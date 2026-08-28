import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { BackupVerificationPanel } from '@/components/admin/BackupVerificationPanel';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

const verifiedStatus = {
  schemaVersion: 1,
  requestId: 'request-1',
  backupName: 'pre-1.12.0.dump',
  status: 'VERIFIED',
  format: 'pg-custom',
  sizeBytes: 4096,
  checksumSha256: 'a'.repeat(64),
  sourcePostgresVersion: '18.4',
  dumpToolVersion: '18.4',
  verificationPostgresVersion: '18.4',
  startedAt: '2026-08-15T10:00:00.000Z',
  completedAt: '2026-08-15T10:00:05.000Z',
  diagnosticCode: 'VERIFICATION_SUCCEEDED',
  checks: { publicTableCount: 24, migrationCount: 7, userCount: 3, contentCount: 308 },
};

function renderPanel(locale: 'en' | 'de' = 'en') {
  return render(
    <LanguageProvider initialLocale={locale}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <BackupVerificationPanel />
      </SWRConfig>
    </LanguageProvider>,
  );
}

describe('PostgreSQL backup verification panel', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
    globalThis.sessionStorage.clear();
  });

  it('shows the last isolated restore result with bounded recovery evidence', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: verifiedStatus,
        scheduled: {
          schemaVersion: 1,
          environment: 'staging',
          backupName: 'scheduled-staging-20260820T031500Z.dump',
          status: 'VERIFIED',
          diagnosticCode: 'BACKUP_VERIFIED',
          checksumSha256: 'b'.repeat(64),
          completedAt: '2026-08-20T03:15:42.000Z',
        },
      }),
    });

    renderPanel();

    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('pre-1.12.0.dump')).toBeInTheDocument();
    expect(screen.getAllByText('PostgreSQL 18.4')).toHaveLength(2);
    expect(screen.getByText('24 tables')).toBeInTheDocument();
    expect(screen.getByText('308 content records')).toBeInTheDocument();
    expect(screen.getByText('Scheduled backup: Verified')).toBeInTheDocument();
    expect(screen.getByText('scheduled-staging-20260820T031500Z.dump')).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  it('renders backup verification controls in German', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: null, scheduled: null }),
    });

    renderPanel('de');

    expect(await screen.findByRole('button', { name: 'Neuestes PostgreSQL-Backup überprüfen' })).toBeInTheDocument();
    expect(screen.getByText('Noch kein Überprüfungsergebnis verfügbar.')).toBeInTheDocument();
    expect(screen.queryByText('Verify Latest PostgreSQL Backup')).not.toBeInTheDocument();
  });

  it('requests verification of the latest host backup and refreshes its state', async () => {
    let verificationReads = 0;
    globalThis.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/backups/verification' && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            jobRunId: 'verification-job-run-request-2',
            queueJobId: 'verification-queue-request-2',
            status: 'QUEUED',
            duplicate: false,
            correlationId: 'verification-correlation-request-2',
          }),
        } as Response;
      }
      if (url === '/api/admin/backups/verification') {
        verificationReads += 1;
        return {
          ok: true,
          json: async () => verificationReads === 1 ? { status: null, scheduled: null } : ({
          status: {
            ...verifiedStatus,
            requestId: 'request-2',
            status: 'RUNNING',
            completedAt: null,
            diagnosticCode: 'VERIFICATION_RUNNING',
            checks: null,
          },
          scheduled: null,
          }),
        } as Response;
      }
      if (url === '/api/admin/jobs/verification-job-run-request-2') {
        return {
          ok: true,
          json: async () => ({
            id: 'verification-job-run-request-2',
            status: 'RUNNING',
            progress: 25,
            progressMessage: 'Restoring backup',
            errorMessage: null,
          }),
        } as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    renderPanel();
    expect(await screen.findByText('No verification result is available yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Verify Latest PostgreSQL Backup' }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/admin/backups/verification',
      { method: 'POST' },
    ));
    expect(await screen.findByText('Running')).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Restoring backup · 25%');
  });

  it('presents unavailable state without claiming the backup is healthy', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Backup verification status is currently unavailable.' }),
    });

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('currently unavailable');
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('shows and cancels the accepted verification background job', async () => {
    globalThis.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/admin/backups/verification' && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ jobRunId: 'verification-job-run-123', status: 'QUEUED' }),
        } as Response;
      }
      if (url === '/api/admin/backups/verification') {
        return { ok: true, json: async () => ({ status: null, scheduled: null }) } as Response;
      }
      if (url === '/api/admin/jobs/verification-job-run-123' && init?.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({
            id: 'verification-job-run-123',
            status: 'CANCELLED',
            progress: 60,
            progressMessage: 'Cancelled',
            errorMessage: null,
          }),
        } as Response;
      }
      if (url === '/api/admin/jobs/verification-job-run-123') {
        return {
          ok: true,
          json: async () => ({
            id: 'verification-job-run-123',
            status: 'RUNNING',
            progress: 60,
            progressMessage: 'Restoring backup',
            errorMessage: null,
          }),
        } as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    renderPanel();
    await screen.findByText('No verification result is available yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Verify Latest PostgreSQL Backup' }));

    expect(await screen.findByText('Restoring backup · 60%')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel backup verification' }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/admin/jobs/verification-job-run-123',
      expect.objectContaining({ method: 'DELETE' }),
    ));
    expect(await screen.findByRole('status')).toHaveTextContent('Backup verification cancelled.');
  });
});
