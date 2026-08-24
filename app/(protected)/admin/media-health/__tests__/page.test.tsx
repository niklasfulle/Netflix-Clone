import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import AdminMediaHealthPage from '../page';

jest.mock('swr');
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockedUseSWR = useSWR as jest.Mock;
const mutate = jest.fn();
const mutateJob = jest.fn();
let activeJob: Record<string, unknown> | undefined;
const overview = {
  availability: 'AVAILABLE',
  stale: false,
  runningScan: null,
  lastScan: {
    id: 'scan-1',
    scope: 'CATALOG',
    requestedContentId: null,
    status: 'COMPLETED',
    startedAt: '2026-08-14T11:00:00.000Z',
    completedAt: '2026-08-14T11:05:00.000Z',
    contentCount: 10,
    findingCount: 1,
    criticalCount: 1,
    warningCount: 0,
  },
  findings: [{
    id: 'finding-1',
    contentId: 'movie-1',
    contentTitle: 'Movie one',
    contentType: 'Movie',
    resourceKind: 'VIDEO',
    severity: 'CRITICAL',
    code: 'VIDEO_MISSING',
    metadata: null,
    createdAt: '2026-08-14T11:05:00.000Z',
  }],
  total: 1,
};

beforeEach(() => {
  jest.resetAllMocks();
  activeJob = undefined;
  mockedUseSWR.mockImplementation((key: string | null) => key?.startsWith('/api/admin/jobs/')
    ? { data: activeJob, error: undefined, isLoading: false, mutate: mutateJob }
    : { data: overview, error: undefined, isLoading: false, mutate });
  global.fetch = jest.fn();
});

it('shows scan status, summary, safe remediation, and content navigation', () => {
  render(<AdminMediaHealthPage />);

  expect(screen.getByRole('heading', { name: 'Media Health' })).toBeInTheDocument();
  expect(screen.getByText('Scanner available')).toBeInTheDocument();
  expect(screen.getByText('1', { selector: '[data-metric="critical"]' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Movie one' })).toBeInTheDocument();
  expect(screen.getByText('The referenced video file is missing.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Edit Movie one' })).toHaveAttribute(
    'href',
    '/admin/movies/movie-1/edit',
  );
  expect(screen.queryByRole('button', { name: /delete|repair/i })).not.toBeInTheDocument();
});

it('applies severity, resource, content, and scan-status filters', () => {
  render(<AdminMediaHealthPage />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by severity' }), {
    target: { value: 'CRITICAL' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by resource type' }), {
    target: { value: 'VIDEO' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by content kind' }), {
    target: { value: 'Movie' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by scan status' }), {
    target: { value: 'FAILED' },
  });

  const requestUrl = mockedUseSWR.mock.calls
    .map(([key]: [string | null]) => key)
    .filter((key: string | null): key is string => key?.startsWith('/api/admin/media-health') === true)
    .at(-1) as string;
  expect(requestUrl).toContain('severity=CRITICAL');
  expect(requestUrl).toContain('resourceKind=VIDEO');
  expect(requestUrl).toContain('contentType=Movie');
  expect(requestUrl).toContain('scanStatus=FAILED');
});

it('announces queued work and refreshes results only after the background job succeeds', async () => {
  let finishRequest: ((response: Response) => void) | undefined;
  (global.fetch as jest.Mock).mockReturnValue(new Promise<Response>((resolve) => {
    finishRequest = resolve;
  }));
  const { rerender } = render(<AdminMediaHealthPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Scan full catalog' }));

  expect(screen.getByRole('status')).toHaveTextContent('Scan in progress');
  expect(screen.getByRole('button', { name: 'Scan full catalog' })).toBeDisabled();
  expect(mutate).not.toHaveBeenCalled();

  finishRequest?.({
    ok: true,
    json: async () => ({ jobRunId: 'job-run-123', status: 'QUEUED' }),
  } as Response);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Scan queued.'));
  expect(mutate).not.toHaveBeenCalled();

  activeJob = { id: 'job-run-123', status: 'SUCCEEDED', progress: 100, progressMessage: 'Completed' };
  rerender(<AdminMediaHealthPage />);

  await waitFor(() => expect(mutate).toHaveBeenCalled());
  expect(screen.getByRole('status')).toHaveTextContent('Scan completed and results persisted.');
});

it('shows durable progress and lets an administrator request cancellation', async () => {
  activeJob = {
    id: 'job-run-123',
    status: 'RUNNING',
    progress: 40,
    progressMessage: 'Scanning catalog media',
    errorMessage: null,
  };
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobRunId: 'job-run-123', status: 'QUEUED' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'job-run-123', status: 'CANCEL_REQUESTED' }),
    });
  render(<AdminMediaHealthPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Scan full catalog' }));
  await waitFor(() => expect(screen.getByText('Scanning catalog media · 40%')).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: 'Cancel scan' }));

  await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith(
    '/api/admin/jobs/job-run-123',
    { method: 'DELETE' },
  ));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Cancellation requested.'));
});

it('shows unavailable, stale, running, empty, and request-error states', () => {
  mockedUseSWR.mockReturnValue({
    data: {
      ...overview,
      availability: 'UNAVAILABLE',
      stale: true,
      runningScan: { id: 'running-1', scope: 'CATALOG', startedAt: '2026-08-14T11:00:00.000Z', stale: true },
      lastScan: null,
      findings: [],
      total: 0,
    },
    error: undefined,
    isLoading: false,
    mutate,
  });
  const { rerender } = render(<AdminMediaHealthPage />);

  expect(screen.getByText('Scanner unavailable')).toBeInTheDocument();
  expect(screen.getByText('Scan results are stale.')).toBeInTheDocument();
  expect(screen.getByText('A catalog scan is currently running.')).toBeInTheDocument();
  expect(screen.getByText('No findings match these filters.')).toBeInTheDocument();

  mockedUseSWR.mockReturnValue({ data: undefined, error: new Error('Media health unavailable'), isLoading: false, mutate });
  rerender(<AdminMediaHealthPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('Media health unavailable');
});
