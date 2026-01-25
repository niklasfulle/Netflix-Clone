jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      update: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/data/user', () => ({
  getUserById: jest.fn(),
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
  compare: jest.fn().mockResolvedValue(true),
}));

import { settings } from '../settings';
import { currentUser } from '@/lib/auth';
import { getUserById, getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';

describe('settings action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await settings({
      name: 'New Name',
    } as any);

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn DB-User nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1', email: 'test@example.com' } as any);

    const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
    mockGetUserById.mockResolvedValue(null);

    const result = await settings({
      name: 'New Name',
    } as any);

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Email bereits existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'old@example.com',
      isOAuth: false,
    } as any);

    const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
    mockGetUserById.mockResolvedValue({
      id: 'user1',
      email: 'old@example.com',
    } as any);

    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue({
      id: 'user2',
      email: 'new@example.com',
    } as any);

    const result = await settings({
      name: 'Test User',
      email: 'new@example.com',
    } as any);

    expect(result).toEqual({ error: 'Email allready in use!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Settings aktualisieren', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isOAuth: false,
    } as any);

    const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
    mockGetUserById.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
    } as any);

    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue(null);

    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user1',
      name: 'New Name',
    });

    const result = await settings({
      name: 'New Name',
    } as any);

    expect(result.success).toBeDefined();
    expect(db.user.update).toHaveBeenCalled();
  });

  it('✅ sollte DB-Aufrufe verhindern wenn nicht authentifiziert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await settings({
      name: 'New Name',
    } as any);

    expect(db.user.update).not.toHaveBeenCalled();
  });
});
