import { render, screen } from '@testing-library/react';

import { LanguageProvider } from '@/components/providers/LanguageProvider';
import JobOperationsPage from '../page';

jest.mock('@/components/admin/JobOperationsDashboard', () => ({
  JobOperationsDashboard: () => <div>dashboard</div>,
}));
jest.mock('@/components/admin/WeeklyJobSchedulePanel', () => ({
  WeeklyJobSchedulePanel: () => <div>weekly schedules</div>,
}));

it('renders the job operations page in German', () => {
  render(
    <LanguageProvider initialLocale="de">
      <JobOperationsPage />
    </LanguageProvider>,
  );

  expect(screen.getByRole('heading', { name: 'Hintergrundaufträge' })).toBeInTheDocument();
  expect(screen.getByText(/dauerhafte Hintergrundaufträge überwachen/i)).toBeInTheDocument();
  expect(screen.queryByText('Job Operations')).not.toBeInTheDocument();
});
