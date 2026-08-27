import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { JobOperationsDashboard } from '@/components/admin/JobOperationsDashboard';

const responseBody = {
  items: [{
    id: 'job-run-123',
    jobType: 'media.integrity.scan',
    status: 'FAILED',
    progress: 75,
    progressMessage: 'Scanning media',
    attemptCount: 3,
    actor: { userId: 'admin-user-123', role: 'ADMIN' },
    target: { type: 'catalog', id: 'published' },
    correlationId: 'request-correlation-123',
    failure: { code: 'ScannerUnavailable', message: 'Background operation failed.' },
    acceptedAt: '2026-08-25T09:00:00.000Z',
    startedAt: '2026-08-25T09:01:00.000Z',
    completedAt: '2026-08-25T09:02:00.000Z',
    cancelRequestedAt: null,
    updatedAt: '2026-08-25T09:02:00.000Z',
  }],
  nextCursor: 'next-page-cursor',
  health: {
    worker: {
      status: 'healthy',
      state: 'ACTIVE',
      startedAt: '2026-08-25T08:00:00.000Z',
      heartbeatAt: '2026-08-25T09:02:00.000Z',
      stoppedAt: null,
      heartbeatAgeMs: 5_000,
    },
    queue: { depth: 4, oldestQueuedAt: '2026-08-25T08:59:00.000Z', oldestQueuedAgeMs: 180_000 },
    counts: { QUEUED: 3, RUNNING: 1, SUCCEEDED: 8, FAILED: 2, CANCEL_REQUESTED: 0, CANCELLED: 1, DEAD_LETTER: 0 },
    observedAt: '2026-08-25T09:02:05.000Z',
  },
};

function renderDashboard() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <JobOperationsDashboard />
    </SWRConfig>,
  );
}

describe('job operations dashboard', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });
  });

  it('shows bounded job, worker, queue, actor, target, and failure information', async () => {
    renderDashboard();

    expect(await screen.findByText('Worker healthy')).toBeInTheDocument();
    expect(screen.getByText('4 active jobs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'media.integrity.scan' })).toBeInTheDocument();
    expect(screen.getByText('admin-user-123')).toBeInTheDocument();
    expect(screen.getByText('catalog:published')).toBeInTheDocument();
    expect(screen.getByText('ScannerUnavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open audit event' })).toHaveAttribute(
      'href',
      '/admin/audit?correlationId=request-correlation-123',
    );
  });

  it('retries eligible failed work through the audited action endpoint', async () => {
    renderDashboard();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry job job-run-123' }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/admin/jobs/job-run-123',
      expect.objectContaining({ method: 'POST' }),
    ));
  });

  it('applies status filters and clears cursor history', async () => {
    renderDashboard();
    fireEvent.change(await screen.findByLabelText('Job status'), { target: { value: 'FAILED' } });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/admin/jobs?status=FAILED&limit=20',
      { cache: 'no-store' },
    ));
  });
});
