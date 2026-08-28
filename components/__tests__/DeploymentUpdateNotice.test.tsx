import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import DeploymentUpdateNotice from '@/components/DeploymentUpdateNotice';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

const fetchMock = jest.fn();

function healthResponse(version: string, ok = true, automaticReloadEnabled = true) {
  return {
    ok,
    json: async () => ({
      status: ok ? 'ok' : 'degraded',
      version,
      deploymentUpdates: { automaticReloadEnabled },
    }),
  } as Response;
}

describe('DeploymentUpdateNotice', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    sessionStorage.clear();
  });

  it('stays hidden while the server runs the version loaded by the browser', async () => {
    fetchMock.mockResolvedValue(healthResponse('1.13.0'));

    render(<DeploymentUpdateNotice currentVersion="1.13.0" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ cache: 'no-store' }),
    ));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers a reload when a newer healthy deployment is available', async () => {
    const reloadPage = jest.fn();
    fetchMock.mockResolvedValue(healthResponse('1.13.1'));

    render(
      <LanguageProvider initialLocale="de">
        <div role="dialog" aria-modal="true">Open editor</div>
        <DeploymentUpdateNotice currentVersion="1.13.0" reloadPage={reloadPage} />
      </LanguageProvider>,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Neue Version verfügbar');
    expect(screen.getByText('1.13.1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt neu laden' }));
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('reloads automatically when no modal dialog protects user input', async () => {
    const reloadPage = jest.fn();
    fetchMock.mockResolvedValue(healthResponse('1.13.1'));

    render(<DeploymentUpdateNotice currentVersion="1.13.0" reloadPage={reloadPage} />);

    await waitFor(() => expect(reloadPage).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lets the user dismiss one deployed version for the current tab', async () => {
    fetchMock.mockResolvedValue(healthResponse('1.13.1'));

    const { unmount } = render(
      <>
        <dialog open>Open editor</dialog>
        <DeploymentUpdateNotice currentVersion="1.13.0" />
      </>,
    );
    expect(await screen.findByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    unmount();
    render(<DeploymentUpdateNotice currentVersion="1.13.0" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('ignores unhealthy or unavailable deployment checks', async () => {
    fetchMock.mockResolvedValue(healthResponse('1.13.1', false));

    render(<DeploymentUpdateNotice currentVersion="1.13.0" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not reload or notify when an administrator disables updates globally', async () => {
    const reloadPage = jest.fn();
    fetchMock.mockResolvedValue(healthResponse('1.13.1', true, false));

    render(<DeploymentUpdateNotice currentVersion="1.13.0" reloadPage={reloadPage} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(reloadPage).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
