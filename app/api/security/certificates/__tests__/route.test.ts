/** @jest-environment node */

const mockTelemetryComplete = jest.fn();
const mockTelemetryStart = jest.fn((_input?: unknown) => ({
  correlationId: 'certificate-correlation',
  complete: mockTelemetryComplete,
}));

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/public-ca', () => {
  const actual = jest.requireActual('@/lib/public-ca');
  return {
    ...actual,
    publicCertificateStore: { list: jest.fn(), download: jest.fn() },
  };
});
jest.mock('@/lib/authentication/production-telemetry', () => ({
  authenticationTelemetry: { start: (input: unknown) => mockTelemetryStart(input) },
}));

import { currentUser } from '@/lib/auth';
import { publicCertificateStore, PublicCertificateError } from '@/lib/public-ca';
import { GET } from '../route';

const metadata = {
  id: 'current' as const,
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

describe('authenticated public CA metadata API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (publicCertificateStore.list as jest.Mock).mockResolvedValue([metadata]);
  });

  it('returns bounded certificate metadata to an authenticated same-origin user', async () => {
    const response = await GET(new Request('https://netflix/api/security/certificates', {
      headers: { 'sec-fetch-site': 'same-origin' },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.json()).toEqual({ certificates: [metadata] });
    expect(mockTelemetryComplete).toHaveBeenCalledWith(expect.objectContaining({
      outcome: 'success',
      reasonCode: 'certificate_metadata_loaded',
    }));
  });

  it('rejects signed-out and cross-site requests before reading certificate files', async () => {
    (currentUser as jest.Mock).mockResolvedValue(undefined);
    expect((await GET(new Request('https://netflix/api/security/certificates'))).status).toBe(401);

    (currentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    expect((await GET(new Request('https://netflix/api/security/certificates', {
      headers: { 'sec-fetch-site': 'cross-site' },
    }))).status).toBe(403);
    expect(publicCertificateStore.list).not.toHaveBeenCalled();
  });

  it('fails closed without disclosing the deployment path', async () => {
    (publicCertificateStore.list as jest.Mock).mockRejectedValue(new PublicCertificateError());

    const response = await GET(new Request('https://netflix/api/security/certificates'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Public CA certificate is unavailable.' });
    expect(mockTelemetryComplete).toHaveBeenCalledWith(expect.objectContaining({
      outcome: 'failed',
      reasonCode: 'certificate_unavailable',
    }));
  });
});
