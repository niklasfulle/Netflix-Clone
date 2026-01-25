jest.mock('@/lib/db', () => ({
  db: {
    user: {
      update: jest.fn(),
    },
    passwordResetToken: {
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/data/password-reset-token', () => ({
  getPasswordResetTokenByToken: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
}));

import { setNewPassword } from '../new-password';
import { getPasswordResetTokenByToken } from '@/data/password-reset-token';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';

describe('new password action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn Token fehlt', async () => {
    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      null
    );

    expect(result).toEqual({ error: 'Missing token!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Passwort ungültig ist', async () => {
    const result = await setNewPassword(
      {
        password: 'short',
        confirm: 'short',
      } as any,
      'token123'
    );

    expect(result).toEqual({ error: 'Invalid password!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Token nicht existiert', async () => {
    const mockGetPasswordResetTokenByToken = getPasswordResetTokenByToken as jest.MockedFunction<typeof getPasswordResetTokenByToken>;
    mockGetPasswordResetTokenByToken.mockResolvedValue(null);

    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      'invalid-token'
    );

    expect(result).toEqual({ error: 'Token does not exist!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Token abgelaufen ist', async () => {
    const mockGetPasswordResetTokenByToken = getPasswordResetTokenByToken as jest.MockedFunction<typeof getPasswordResetTokenByToken>;
    mockGetPasswordResetTokenByToken.mockResolvedValue({
      id: 'token1',
      email: 'test@example.com',
      token: 'token123',
      expires: new Date(Date.now() - 1000),
    } as any);

    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      'token123'
    );

    expect(result).toEqual({ error: 'Token has expired!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht existiert', async () => {
    const mockGetPasswordResetTokenByToken = getPasswordResetTokenByToken as jest.MockedFunction<typeof getPasswordResetTokenByToken>;
    mockGetPasswordResetTokenByToken.mockResolvedValue({
      id: 'token1',
      email: 'test@example.com',
      token: 'token123',
      expires: new Date(Date.now() + 10000),
    } as any);

    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      'token123'
    );

    expect(result).toEqual({ error: 'Email does not exist!' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Passwort zurücksetzen', async () => {
    const mockGetPasswordResetTokenByToken = getPasswordResetTokenByToken as jest.MockedFunction<typeof getPasswordResetTokenByToken>;
    mockGetPasswordResetTokenByToken.mockResolvedValue({
      id: 'token1',
      email: 'test@example.com',
      token: 'token123',
      expires: new Date(Date.now() + 10000),
    } as any);

    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
    mockGetUserByEmail.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
    } as any);

    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
    });

    (db.passwordResetToken.delete as jest.Mock).mockResolvedValue({
      id: 'token1',
    });

    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      'token123'
    );

    expect(result.success).toBeDefined();
    expect(db.user.update).toHaveBeenCalled();
    expect(db.passwordResetToken.delete).toHaveBeenCalled();
  });

  it('✅ sollte DB-Aufrufe verhindern wenn Token fehlt', async () => {
    const result = await setNewPassword(
      {
        password: 'newpassword123',
        confirm: 'newpassword123',
      } as any,
      null
    );

    expect(db.user.update).not.toHaveBeenCalled();
  });
});
