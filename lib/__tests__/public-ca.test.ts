/** @jest-environment node */

import path from 'node:path';

import {
  createPublicCertificateStore,
  PublicCertificateError,
  type PublicCertificateStoreDependencies,
} from '@/lib/public-ca';

const certificatePem = Buffer.from(
  '-----BEGIN CERTIFICATE-----\nPUBLIC-TEST-CA\n-----END CERTIFICATE-----\n',
  'utf8',
);

function createDependencies(
  overrides: Partial<PublicCertificateStoreDependencies> = {},
): PublicCertificateStoreDependencies {
  return {
    root: '/public-certificates',
    environment: 'staging',
    now: () => new Date('2026-08-20T12:00:00.000Z'),
    lstat: async () => ({
      isFile: () => true,
      isSymbolicLink: () => false,
      size: certificatePem.length,
      mode: 0o100644,
      mtimeMs: new Date('2026-08-20T11:00:00.000Z').getTime(),
    }),
    readFile: async () => certificatePem,
    parseCertificate: () => ({
      ca: true,
      raw: Buffer.from([1, 2, 3, 4]),
      fingerprint256: 'AA:BB:CC:DD',
      subject: 'CN=Netflix Clone Test Root',
      issuer: 'CN=Netflix Clone Test Root',
      serialNumber: '01AB',
      validFrom: 'Aug 1 00:00:00 2026 GMT',
      validTo: 'Aug 1 00:00:00 2036 GMT',
      publicKeyAlgorithm: 'rsa',
    }),
    maximumPreviousAgeMs: 30 * 24 * 60 * 60_000,
    ...overrides,
  };
}

describe('public CA certificate store', () => {
  it('returns bounded metadata and byte-correct fixed-format downloads', async () => {
    const readPaths: string[] = [];
    const previousPem = Buffer.from(
      '-----BEGIN CERTIFICATE-----\nPREVIOUS-PUBLIC-TEST-CA\n-----END CERTIFICATE-----\n',
      'utf8',
    );
    const baseDependencies = createDependencies();
    const store = createPublicCertificateStore(createDependencies({
      readFile: async (filePath) => {
        readPaths.push(filePath);
        return filePath.endsWith('previous.pem') ? previousPem : certificatePem;
      },
      parseCertificate: (pem) => ({
        ...baseDependencies.parseCertificate(pem),
        fingerprint256: pem.equals(previousPem) ? 'EE:FF:00:11' : 'AA:BB:CC:DD',
      }),
    }));

    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'current',
        environment: 'staging',
        fingerprintSha256: 'AA:BB:CC:DD',
        subject: 'CN=Netflix Clone Test Root',
        isExpiringSoon: false,
      }),
      expect.objectContaining({ id: 'previous' }),
    ]);
    await expect(store.download('current', 'pem')).resolves.toEqual(certificatePem);
    await expect(store.download('current', 'der')).resolves.toEqual(Buffer.from([1, 2, 3, 4]));
    expect(new Set(readPaths)).toEqual(new Set([
      path.join('/public-certificates', 'current.pem'),
      path.join('/public-certificates', 'previous.pem'),
    ]));
  });

  it.each([
    ['symbolic link', { lstat: async () => ({
      isFile: () => true, isSymbolicLink: () => true, size: 100, mode: 0o100644, mtimeMs: Date.now(),
    }) }],
    ['oversized file', { lstat: async () => ({
      isFile: () => true, isSymbolicLink: () => false, size: 70_000, mode: 0o100644, mtimeMs: Date.now(),
    }) }],
    ['writable file', { lstat: async () => ({
      isFile: () => true, isSymbolicLink: () => false, size: 100, mode: 0o100666, mtimeMs: Date.now(),
    }) }],
    ['non-CA certificate', { parseCertificate: () => ({
      ...createDependencies().parseCertificate(certificatePem),
      ca: false,
    }) }],
    ['expired certificate', { parseCertificate: () => ({
      ...createDependencies().parseCertificate(certificatePem),
      validTo: 'Aug 1 00:00:00 2025 GMT',
    }) }],
    ['private key material', { readFile: async () => Buffer.from(
      `-----BEGIN CERTIFICATE-----\nPUBLIC\n-----END CERTIFICATE-----\n-----BEGIN ${['PRIVATE', 'KEY'].join(' ')}-----`,
    ) }],
  ])('rejects %s without returning deployment paths', async (_name, overrides) => {
    const store = createPublicCertificateStore(createDependencies(
      overrides as Partial<PublicCertificateStoreDependencies>,
    ));

    await expect(store.list()).rejects.toBeInstanceOf(PublicCertificateError);
    await expect(store.list()).rejects.not.toThrow('/public-certificates');
  });

  it('does not offer a previous root after the configured overlap', async () => {
    const store = createPublicCertificateStore(createDependencies({
      lstat: async (filePath) => ({
        isFile: () => true,
        isSymbolicLink: () => false,
        size: certificatePem.length,
        mode: 0o100644,
        mtimeMs: filePath.endsWith('previous.pem')
          ? new Date('2026-07-01T00:00:00.000Z').getTime()
          : new Date('2026-08-20T11:00:00.000Z').getTime(),
      }),
      maximumPreviousAgeMs: 30 * 24 * 60 * 60_000,
    }));

    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({ id: 'current' }),
    ]);
    await expect(store.download('previous', 'pem')).rejects.toBeInstanceOf(
      PublicCertificateError,
    );
  });
});
