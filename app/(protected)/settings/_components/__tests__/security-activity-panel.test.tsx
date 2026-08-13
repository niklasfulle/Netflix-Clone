import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getSecurityActivity, revokeOtherSessions } from '@/actions/session-security';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

import { SecurityActivityPanel } from '../security-activity-panel';

jest.mock('@/actions/session-security', () => ({
  getSecurityActivity: jest.fn(),
  revokeOtherSessions: jest.fn(),
}));

const mockGetActivity = getSecurityActivity as jest.MockedFunction<typeof getSecurityActivity>;
const mockRevokeOthers = revokeOtherSessions as jest.MockedFunction<typeof revokeOtherSessions>;

describe('security activity panel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActivity.mockResolvedValue({
      status: 'success',
      activity: [{
        id: 'event-1',
        event: 'signed_in',
        createdAt: '2026-08-12T10:00:00.000Z',
        userAgent: 'Browser/1.0',
      }],
    });
    mockRevokeOthers.mockResolvedValue({
      status: 'success',
      code: 'other_sessions_revoked',
      revoked: 2,
    });
  });

  it('shows recent privacy-safe account activity', async () => {
    render(<SecurityActivityPanel />);

    expect(screen.getByRole('heading', { name: 'Recent security activity' })).toBeInTheDocument();
    expect(await screen.findByText('Signed in')).toBeInTheDocument();
    expect(screen.getByText(/Browser\/1\.0/)).toBeInTheDocument();
  });

  it('revokes other devices and keeps the current session active', async () => {
    render(<SecurityActivityPanel />);
    await screen.findByText('Signed in');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out other devices' }));

    await waitFor(() => expect(mockRevokeOthers).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('2 other sessions were signed out.')).toBeInTheDocument();
    expect(mockGetActivity).toHaveBeenCalledTimes(2);
  });

  it('renders its controls in German', async () => {
    render(
      <LanguageProvider initialLocale="de">
        <SecurityActivityPanel />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Letzte Sicherheitsaktivitäten' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Angemeldet')).toBeInTheDocument();
  });
});
