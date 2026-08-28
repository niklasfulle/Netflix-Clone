import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WeeklyJobSchedulePanel } from '@/components/admin/WeeklyJobSchedulePanel';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

const schedules = [
  { kind: 'BACKUP', enabled: false, weekdays: [0], time: '03:00', timezone: 'Europe/Berlin' },
  { kind: 'MEDIA_HEALTH', enabled: true, weekdays: [1, 3], time: '04:00', timezone: 'UTC' },
];

beforeEach(() => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ schedules }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ schedule: { ...schedules[0], enabled: true } }),
    });
});

it('loads, edits, and saves the German weekly schedule controls', async () => {
  render(
    <LanguageProvider initialLocale="de">
      <WeeklyJobSchedulePanel />
    </LanguageProvider>,
  );

  expect(await screen.findByRole('heading', { name: 'Wöchentliche Zeitpläne' })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Datenbank-Backup' })).toBeInTheDocument();
  const enabled = screen.getAllByRole('checkbox', { name: 'Aktiviert' });
  fireEvent.click(enabled[0]);
  fireEvent.click(screen.getAllByRole('button', { name: 'Zeitplan speichern' })[0]);

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch).toHaveBeenLastCalledWith('/api/admin/jobs/schedules', expect.objectContaining({
    method: 'PUT',
    body: expect.stringContaining('"enabled":true'),
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('Der wöchentliche Zeitplan wurde gespeichert.');
});
