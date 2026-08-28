import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';

import { DeploymentUpdatePolicyPanel } from '@/components/admin/DeploymentUpdatePolicyPanel';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

jest.mock('swr');
const mockedUseSWR = useSWR as jest.Mock;
const fetchMock = jest.fn();

describe('DeploymentUpdatePolicyPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
  });

  it('shows the globally enabled automatic reload policy', () => {
    mockedUseSWR.mockReturnValue({
      data: { automaticReloadEnabled: true },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<DeploymentUpdatePolicyPanel />);

    expect(screen.getByRole('switch', { name: 'Automatic page reloads' }))
      .toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('disables automatic reloads globally', async () => {
    const mutate = jest.fn();
    mockedUseSWR.mockReturnValue({
      data: { automaticReloadEnabled: true },
      error: undefined,
      isLoading: false,
      mutate,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ automaticReloadEnabled: false }),
    });

    render(<DeploymentUpdatePolicyPanel />);
    fireEvent.click(screen.getByRole('switch', { name: 'Automatic page reloads' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/deployment-updates',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ automaticReloadEnabled: false }),
      }),
    ));
    expect(mutate).toHaveBeenCalledWith({ automaticReloadEnabled: false }, false);
  });

  it('renders the policy control in German', () => {
    mockedUseSWR.mockReturnValue({
      data: { automaticReloadEnabled: false },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(
      <LanguageProvider initialLocale="de">
        <DeploymentUpdatePolicyPanel />
      </LanguageProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Client-Aktualisierungen' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Automatische Seitenaktualisierung' }))
      .toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Deaktiviert')).toBeInTheDocument();
  });
});
