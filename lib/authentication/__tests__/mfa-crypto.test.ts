import {
  createTotpCode,
  createTotpEnrollmentUri,
  decryptMfaSecret,
  encryptMfaSecret,
  findMatchingTotpCounter,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotpCode,
} from '@/lib/authentication/mfa-crypto';

const RFC_6238_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const TEST_AUTH_SECRET = 'test-auth-secret-with-enough-entropy';

describe('MFA cryptography', () => {
  it('generates and verifies the RFC 6238-compatible six-digit TOTP value', () => {
    const timestamp = new Date('1970-01-01T00:00:59.000Z');

    expect(createTotpCode(RFC_6238_SECRET, timestamp)).toBe('287082');
    expect(verifyTotpCode(RFC_6238_SECRET, '287082', timestamp)).toBe(true);
    expect(findMatchingTotpCounter(RFC_6238_SECRET, '287082', timestamp)).toBe(BigInt(1));
    expect(verifyTotpCode(RFC_6238_SECRET, '287083', timestamp)).toBe(false);
  });

  it('accepts one adjacent time window but rejects an older TOTP value', () => {
    const issuedAt = new Date('2026-08-09T12:00:00.000Z');
    const code = createTotpCode(RFC_6238_SECRET, issuedAt);

    expect(verifyTotpCode(
      RFC_6238_SECRET,
      code,
      new Date(issuedAt.getTime() + 30_000),
    )).toBe(true);
    expect(verifyTotpCode(
      RFC_6238_SECRET,
      code,
      new Date(issuedAt.getTime() + 60_000),
    )).toBe(false);
  });

  it('encrypts authenticator secrets with authenticated encryption', () => {
    const encrypted = encryptMfaSecret(RFC_6238_SECRET, TEST_AUTH_SECRET);

    expect(encrypted).not.toContain(RFC_6238_SECRET);
    expect(decryptMfaSecret(encrypted, TEST_AUTH_SECRET)).toBe(RFC_6238_SECRET);
    expect(() => decryptMfaSecret(`${encrypted.slice(0, -1)}x`, TEST_AUTH_SECRET))
      .toThrow('Invalid encrypted MFA secret');
  });

  it('creates a standards-compatible authenticator enrollment URI', () => {
    expect(createTotpEnrollmentUri({
      secret: RFC_6238_SECRET,
      accountName: 'viewer@example.com',
      issuer: 'Netflix Clone',
    })).toBe(
      'otpauth://totp/Netflix%20Clone:viewer%40example.com'
      + `?secret=${RFC_6238_SECRET}&issuer=Netflix%20Clone&algorithm=SHA1&digits=6&period=30`,
    );
  });

  it('generates unique recovery codes and hashes normalized values per account', () => {
    const codes = generateRecoveryCodes(10);

    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }

    const canonical = hashRecoveryCode('user-1', codes[0], TEST_AUTH_SECRET);
    expect(hashRecoveryCode(
      'user-1',
      codes[0].toLowerCase().replaceAll('-', ' '),
      TEST_AUTH_SECRET,
    )).toBe(canonical);
    expect(hashRecoveryCode('user-2', codes[0], TEST_AUTH_SECRET)).not.toBe(canonical);
  });
});
