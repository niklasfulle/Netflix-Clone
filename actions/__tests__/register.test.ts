jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      create: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
}));

import { register } from '../register';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';

describe('register action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn Felder ungültig sind', async () => {
    const result = await register({
      name: '',
      email: 'invalid-email',
      password: 'pass123',
      confirm: 'pass123',
    } as any);

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn confirm nicht passt', async () => {
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirm: 'password456',
    } as any);

    // Confirm validation ist Teil des Schemas, nicht der Action
    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Email bereits existiert', async () => {
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
    } as any);

    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirm: 'password123',
    } as any);

    expect(result).toEqual({ error: 'Email already in use!' });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich neuen Benutzer registrieren', async () => {
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue(null);

    (generateVerificationToken as jest.Mock).mockResolvedValue({
      email: 'test@example.com',
      token: 'token123',
    });

    (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
    });

    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirm: 'password123',
    } as any);

    expect(result.success).toBeDefined();
    expect(db.user.create).toHaveBeenCalled();
    expect(generateVerificationToken).toHaveBeenCalled();
    expect(sendVerificationEmail).toHaveBeenCalled();
  });

  it('✅ sollte DB-Aufrufe verhindern wenn Validierung fehlschlägt', async () => {
    const result = await register({
      name: '',
      email: 'invalid',
      password: 'pass',
      confirm: 'pass',
    } as any);

    expect(db.user.create).not.toHaveBeenCalled();
    expect(generateVerificationToken).not.toHaveBeenCalled();
  });
});
