import { X509Certificate } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MAX_CERTIFICATE_BYTES = 64 * 1024;
const EXPIRY_WARNING_MS = 30 * 24 * 60 * 60_000;
const PRODUCTION_CERTIFICATE_ROOT = '/public-certificates';
const CERTIFICATE_FILES = {
  current: 'current.pem',
  previous: 'previous.pem',
} as const;

export type PublicCertificateId = keyof typeof CERTIFICATE_FILES;
export type PublicCertificateFormat = 'pem' | 'der';

type CertificateStat = {
  isFile(): boolean;
  isSymbolicLink(): boolean;
  size: number;
  mode: number;
  mtimeMs: number;
};

type ParsedCertificate = {
  ca: boolean;
  raw: Buffer;
  fingerprint256: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  publicKeyAlgorithm: string;
};

export type PublicCertificateStoreDependencies = {
  root: string;
  environment: string;
  now(): Date;
  lstat(filePath: string): Promise<CertificateStat>;
  readFile(filePath: string): Promise<Buffer>;
  parseCertificate(pem: Buffer): ParsedCertificate;
  maximumPreviousAgeMs: number;
};

export type PublicCertificateMetadata = {
  id: PublicCertificateId;
  environment: string;
  fingerprintSha256: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  publicKeyAlgorithm: string;
  isExpiringSoon: boolean;
};

export class PublicCertificateError extends Error {
  constructor() {
    super('Public CA certificate is unavailable or invalid');
    this.name = 'PublicCertificateError';
  }
}

function boundedText(value: string, maximum = 1024): string {
  const containsControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
  if (!value || value.length > maximum || containsControlCharacter) {
    throw new PublicCertificateError();
  }
  return value;
}

function validatePem(pem: Buffer) {
  const text = pem.toString('utf8');
  if (
    !text.includes('-----BEGIN CERTIFICATE-----')
    || !text.includes('-----END CERTIFICATE-----')
    || /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)
  ) {
    throw new PublicCertificateError();
  }
}

export function createPublicCertificateStore(dependencies: PublicCertificateStoreDependencies) {
  const readCertificate = async (id: PublicCertificateId, optional = false) => {
    const certificatePath = path.join(
      /* turbopackIgnore: true */ dependencies.root,
      CERTIFICATE_FILES[id],
    );
    let metadata: CertificateStat;
    try {
      metadata = await dependencies.lstat(certificatePath);
    } catch (error) {
      if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new PublicCertificateError();
    }
    if (
      !metadata.isFile()
      || metadata.isSymbolicLink()
      || metadata.size < 1
      || metadata.size > MAX_CERTIFICATE_BYTES
      || (metadata.mode & 0o022) !== 0
    ) {
      throw new PublicCertificateError();
    }
    if (
      id === 'previous'
      && dependencies.now().getTime() - metadata.mtimeMs > dependencies.maximumPreviousAgeMs
    ) {
      if (optional) return null;
      throw new PublicCertificateError();
    }

    try {
      const pem = await dependencies.readFile(certificatePath);
      validatePem(pem);
      const certificate = dependencies.parseCertificate(pem);
      const validFrom = new Date(certificate.validFrom);
      const validTo = new Date(certificate.validTo);
      const now = dependencies.now();
      if (
        !certificate.ca
        || !certificate.raw.length
        || Number.isNaN(validFrom.getTime())
        || Number.isNaN(validTo.getTime())
        || now < validFrom
        || now >= validTo
      ) {
        throw new PublicCertificateError();
      }

      const publicMetadata: PublicCertificateMetadata = {
        id,
        environment: boundedText(dependencies.environment, 32),
        fingerprintSha256: boundedText(certificate.fingerprint256, 191),
        subject: boundedText(certificate.subject),
        issuer: boundedText(certificate.issuer),
        serialNumber: boundedText(certificate.serialNumber, 191),
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        publicKeyAlgorithm: boundedText(certificate.publicKeyAlgorithm, 64),
        isExpiringSoon: validTo.getTime() - now.getTime() <= EXPIRY_WARNING_MS,
      };
      return { pem, der: certificate.raw, metadata: publicMetadata };
    } catch (error) {
      if (error instanceof PublicCertificateError) throw error;
      throw new PublicCertificateError();
    }
  };

  return {
    async list(): Promise<PublicCertificateMetadata[]> {
      const current = await readCertificate('current');
      const previous = await readCertificate('previous', true);
      const certificates = [current, previous].filter((entry) => entry !== null);
      const fingerprints = new Set<string>();
      return certificates
        .filter((entry) => {
          if (fingerprints.has(entry.metadata.fingerprintSha256)) return false;
          fingerprints.add(entry.metadata.fingerprintSha256);
          return true;
        })
        .map((entry) => entry.metadata);
    },

    async download(id: PublicCertificateId, format: PublicCertificateFormat): Promise<Buffer> {
      const certificate = await readCertificate(id, id === 'previous');
      if (!certificate) throw new PublicCertificateError();
      return format === 'der' ? certificate.der : certificate.pem;
    },
  };
}

export const publicCertificateStore = createPublicCertificateStore({
  root: PRODUCTION_CERTIFICATE_ROOT,
  environment: process.env.DEPLOYMENT_ENVIRONMENT ?? 'unknown',
  now: () => new Date(),
  maximumPreviousAgeMs: (() => {
    const configuredDays = Number.parseInt(process.env.PUBLIC_CA_OVERLAP_DAYS ?? '30', 10);
    const days = Number.isInteger(configuredDays) && configuredDays >= 1 && configuredDays <= 90
      ? configuredDays
      : 30;
    return days * 24 * 60 * 60_000;
  })(),
  lstat: fs.lstat,
  readFile: fs.readFile,
  parseCertificate: (pem) => {
    const certificate = new X509Certificate(pem);
    return {
      ca: certificate.ca,
      raw: certificate.raw,
      fingerprint256: certificate.fingerprint256,
      subject: certificate.subject,
      issuer: certificate.issuer,
      serialNumber: certificate.serialNumber,
      validFrom: certificate.validFrom,
      validTo: certificate.validTo,
      publicKeyAlgorithm: certificate.publicKey.asymmetricKeyType ?? 'unknown',
    };
  },
});
