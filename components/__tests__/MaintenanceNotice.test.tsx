import { act, render, screen, waitFor } from '@testing-library/react';
import MaintenanceNotice from '../MaintenanceNotice';
import { signOut } from 'next-auth/react';
jest.mock('next-auth/react', () => ({ signOut: jest.fn() }));

describe('MaintenanceNotice', () => {
  const request = jest.fn();
  beforeEach(() => { jest.useFakeTimers(); globalThis.fetch = request; request.mockReset(); });
  afterEach(() => { jest.useRealTimers(); });
  const response = (mode: string) => ({ ok: true, headers: { get: () => new Date().toUTCString() }, json: async () => ({ mode }) });
  it('announces an update in an already open page and clears it without reloading', async () => {
    request.mockResolvedValue(response('announce'));
    const event = jest.fn(); globalThis.addEventListener('netflix:maintenance', event);
    const { unmount } = render(<MaintenanceNotice />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('An update is being prepared'));
    expect(event).toHaveBeenCalledTimes(1);
    request.mockResolvedValue(response('update'));
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(screen.getByRole('status')).toHaveTextContent('The update is being installed');
    request.mockResolvedValue(response('outage'));
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    unmount(); globalThis.removeEventListener('netflix:maintenance', event);
  });
  it('ignores expired announcements', async () => {
    request.mockResolvedValue({ ...response('announce'), headers: { get: () => new Date(Date.now() - 3 * 3600000).toUTCString() } });
    render(<MaintenanceNotice />);
    await act(async () => {});
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('shows custom admin text and signs out revoked sessions', async () => {
    request.mockImplementation(async (url: string) => url === '/api/maintenance'
      ? { ok: true, json: async () => ({ heading: 'Scheduled downtime', message: 'Scheduled service work', logoutRequired: true }) }
      : response('outage'));
    render(<MaintenanceNotice />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Scheduled service work'));
    expect(screen.getByRole('status')).toHaveTextContent('Scheduled downtime');
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/login?maintenance=1' });
  });
});
