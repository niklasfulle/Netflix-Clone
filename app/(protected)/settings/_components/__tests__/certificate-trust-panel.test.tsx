import { fireEvent, render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import { CertificateTrustPanel } from '../certificate-trust-panel';

const currentCertificate = {
  id: 'current',
  environment: 'staging',
  fingerprintSha256: 'AA:BB:CC:DD',
  subject: 'CN=Netflix Clone Root',
  issuer: 'CN=Netflix Clone Root',
  serialNumber: '01AB',
  validFrom: '2026-08-01T00:00:00.000Z',
  validTo: '2036-08-01T00:00:00.000Z',
  publicKeyAlgorithm: 'rsa',
  isExpiringSoon: false,
};

function renderPanel() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CertificateTrustPanel />
    </SWRConfig>,
  );
}

describe('certificate trust settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('shows metadata, fixed downloads, fingerprint QR, rotation, and device guidance', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        certificates: [
          currentCertificate,
          { ...currentCertificate, id: 'previous', fingerprintSha256: '11:22:33:44' },
        ],
      }),
    });

    renderPanel();

    expect(await screen.findByRole('heading', { name: 'LAN HTTPS certificate trust' }))
      .toBeInTheDocument();
    expect(screen.getByText('AA:BB:CC:DD')).toBeInTheDocument();
    expect(screen.getByText('Previous root (rotation overlap)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download current PEM' }))
      .toHaveAttribute('href', '/api/security/certificates/current?format=pem');
    expect(screen.getByRole('link', { name: 'Download current CER' }))
      .toHaveAttribute('href', '/api/security/certificates/current?format=der');
    expect(screen.getByRole('img', { name: 'QR code for the current certificate fingerprint' }))
      .toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('iOS / iPadOS')).toBeInTheDocument();
    expect(screen.getByText(/webOS does not support this private-root installation path/i))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy current fingerprint' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('AA:BB:CC:DD');
  });

  it('does not present unavailable certificate state as trusted', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Public CA certificate is unavailable.' }),
    });

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
    expect(screen.queryByRole('link', { name: /Download current/i })).not.toBeInTheDocument();
  });
});
