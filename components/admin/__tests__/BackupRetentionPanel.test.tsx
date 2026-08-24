import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BackupRetentionPanel } from '@/components/admin/BackupRetentionPanel';

it('queues backup retention cleanup without exposing host paths or policy values', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ jobRunId: 'retention-job-run-123', status: 'QUEUED' }),
  });

  render(<BackupRetentionPanel />);
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
