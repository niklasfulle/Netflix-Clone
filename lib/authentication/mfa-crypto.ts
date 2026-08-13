import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required for MFA cryptography');
  }
  return secret ?? 'development-mfa-secret';
}

function encodeBase32(value: Uint8Array): string {
  let bits = 0;
  let buffer = 0;
  let result = '';

  for (const byte of value) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  return result;
}

function decodeBase32(value: string): Buffer {
  const normalized = value.toUpperCase().replaceAll('=', '').replaceAll(/\s/g, '');
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error('Invalid TOTP secret');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpCounter(timestamp: Date, offset = 0): bigint {
  return BigInt(Math.floor(timestamp.getTime() / 1_000 / TOTP_PERIOD_SECONDS) + offset);
}

function totpForCounter(secret: string, counter: bigint): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
  const offset = (digest.at(-1) ?? 0) & 15;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** TOTP_DIGITS);
  return binary.toString().padStart(TOTP_DIGITS, '0');
}

function encryptionKey(secret: string): Buffer {
  return scryptSync(secret, 'netflix-clone:mfa-secret:v1', 32);
}

export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function createTotpCode(secret: string, timestamp = new Date()): string {
  return totpForCounter(secret, totpCounter(timestamp));
}

export function verifyTotpCode(
  secret: string,
  code: string,
  timestamp = new Date(),
  window = 1,
): boolean {
  return findMatchingTotpCounter(secret, code, timestamp, window) !== null;
}

export function findMatchingTotpCounter(
  secret: string,
  code: string,
  timestamp = new Date(),
  window = 1,
): bigint | null {
  if (!/^\d{6}$/.test(code) || !Number.isInteger(window) || window < 0 || window > 2) {
    return null;
  }
  const submitted = Buffer.from(code);
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = totpCounter(timestamp, offset);
    if (counter < BigInt(0)) continue;
    const expected = Buffer.from(totpForCounter(secret, counter));
    if (timingSafeEqual(submitted, expected)) return counter;
  }
  return null;
}

export function encryptMfaSecret(secret: string, rootSecret = authSecret()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(rootSecret), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')]
    .join('.');
}

export function decryptMfaSecret(value: string, rootSecret = authSecret()): string {
  try {
    const [version, encodedIv, encodedTag, encodedCiphertext] = value.split('.');
    if (version !== 'v1' || !encodedIv || !encodedTag || !encodedCiphertext) {
      throw new Error('invalid envelope');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(rootSecret),
      Buffer.from(encodedIv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('Invalid encrypted MFA secret');
  }
}

export function createTotpEnrollmentUri({
  secret,
  accountName,
  issuer = 'Netflix Clone',
}: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}`
    + `&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}`
    + `&period=${TOTP_PERIOD_SECONDS}`;
}

export function generateRecoveryCodes(count = 10): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error('Recovery code count must be between 1 and 20');
  }
  const codes = new Set<string>();
  while (codes.size < count) {
    const bytes = randomBytes(12);
    const characters = Array.from(bytes, (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]);
    codes.add(`${characters.slice(0, 4).join('')}-${characters.slice(4, 8).join('')}-${characters.slice(8).join('')}`);
  }
  return [...codes];
}

export function hashRecoveryCode(
  userId: string,
  rawCode: string,
  rootSecret = authSecret(),
): string {
  const normalized = rawCode.toUpperCase().replaceAll(/[^A-Z2-9]/g, '');
  return createHmac('sha256', rootSecret)
    .update(`mfa-recovery\0${userId}\0${normalized}`)
    .digest('hex');
}
