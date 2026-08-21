/** @jest-environment node */

const mockTelemetryComplete = jest.fn();
const mockTelemetryStart = jest.fn((_input?: unknown) => ({
  correlationId: 'certificate-download-correlation',
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
import { publicCertificateStore } from '@/lib/public-ca';
import { GET } from '../route';

describe('authenticated public CA download API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (publicCertificateStore.download as jest.Mock).mockResolvedValue(Buffer.from([1, 2, 3]));
  });

  it.each([
    ['pem', 'application/x-pem-file', 'netflix-clone-current-root-ca.pem'],
    ['der', 'application/pkix-cert', 'netflix-clone-current-root-ca.cer'],
  ])('downloads byte-correct %s through a fixed filename', async (format, contentType, filename) => {
    const response = await GET(
      new Request(`https://netflix/api/security/certificates/current?format=${format}`, {
        headers: { 'sec-fetch-site': 'same-origin' },
      }),
      { params: Promise.resolve({ certificateId: 'current' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(contentType);
    expect(response.headers.get('content-disposition')).toBe(`attachment; filename="${filename}"`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]));
    expect(publicCertificateStore.download).toHaveBeenCalledWith('current', format);
  });

  it('rejects arbitrary identifiers, formats, cross-site requests, and signed-out users', async () => {
    expect((await GET(
      new Request('https://netflix/api/security/certificates/secret?format=pem'),
      { params: Promise.resolve({ certificateId: '../secret' }) },
    )).status).toBe(404);
    expect((await GET(
      new Request('https://netflix/api/security/certificates/current?format=p12'),
      { params: Promise.resolve({ certificateId: 'current' }) },
    )).status).toBe(400);
    expect((await GET(
      new Request('https://netflix/api/security/certificates/current?format=pem', {
        headers: { 'sec-fetch-site': 'cross-site' },
      }),
      { params: Promise.resolve({ certificateId: 'current' }) },
    )).status).toBe(403);
    (currentUser as jest.Mock).mockResolvedValue(undefined);
    expect((await GET(
      new Request('https://netflix/api/security/certificates/current?format=pem'),
      { params: Promise.resolve({ certificateId: 'current' }) },
    )).status).toBe(401);
    expect(publicCertificateStore.download).not.toHaveBeenCalled();
  });
});
