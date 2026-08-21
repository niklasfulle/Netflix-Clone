import { act, fireEvent, render, screen } from '@testing-library/react';
import useSWR from 'swr';

import AdminAuditPage from '../page';

jest.mock('swr');
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockedUseSWR = useSWR as jest.Mock;
const event = {
  id: 'event-1',
  actorUserId: 'admin-1',
  actorName: 'Admin User',
  actorRole: 'ADMIN',
  action: 'content.publish',
  targetType: 'content',
  targetId: 'movie-1',
  outcome: 'SUCCEEDED',
  correlationId: 'correlation-1',
  metadata: { previousStatus: 'DRAFT' },
  createdAt: '2026-08-14T10:00:00.000Z',
};

beforeEach(() => {
  mockedUseSWR.mockReset();
  mockedUseSWR.mockReturnValue({
    data: { events: [event], total: 1, page: 1, pageSize: 20, totalPages: 1, retentionDays: 365 },
    error: undefined,
    isLoading: false,
  });
});

afterEach(() => jest.useRealTimers());

it('shows readable audit events, safe target navigation, retention, and matching export filters', () => {
  render(<AdminAuditPage />);

  expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Published content' })).toBeInTheDocument();
  expect(screen.getByText('Admin User')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'movie-1' })).toHaveAttribute('href', '/admin/movies/movie-1/edit');
  expect(screen.getByText(/365 days/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
    'href',
    expect.stringContaining('/api/admin/audit/export?'),
  );
});

it('applies server filters, debounces actor search, paginates, and resets', () => {
  jest.useFakeTimers();
  mockedUseSWR.mockReturnValue({
    data: { events: [event], total: 21, page: 1, pageSize: 20, totalPages: 2, retentionDays: 365 },
    error: undefined,
    isLoading: false,
  });
  render(<AdminAuditPage />);

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search actor' }), { target: { value: '  Niklas  ' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by action' }), { target: { value: 'content.publish' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by target type' }), { target: { value: 'content' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by outcome' }), { target: { value: 'DENIED' } });
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-08-01T00:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  act(() => jest.advanceTimersByTime(300));

  const filteredUrl = mockedUseSWR.mock.calls.at(-1)[0] as string;
  expect(filteredUrl).toContain('page=1');
  expect(filteredUrl).toContain('actor=Niklas');
  expect(filteredUrl).toContain('action=content.publish');
  expect(filteredUrl).toContain('targetType=content');
  expect(filteredUrl).toContain('outcome=DENIED');
  expect(filteredUrl).toContain('from=2026-08-01T00%3A00');

  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByRole('searchbox', { name: 'Search actor' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Filter by action' })).toHaveValue('');
});

it('announces loading, error, and empty result states', () => {
  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: undefined, isLoading: true });
  const { rerender } = render(<AdminAuditPage />);
  expect(screen.getByLabelText('Audit events are loading')).toBeInTheDocument();

  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: new Error('Audit service unavailable'), isLoading: false });
  rerender(<AdminAuditPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('Audit service unavailable');

  mockedUseSWR.mockReturnValueOnce({
    data: { events: [], total: 0, page: 1, pageSize: 20, totalPages: 0, retentionDays: 365 },
    error: undefined,
    isLoading: false,
  });
  rerender(<AdminAuditPage />);
  expect(screen.getByText('No audit events match these filters.')).toBeInTheDocument();
});
