jest.mock('@/auth', () => ({
  signOut: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
  },
}));

import { logout } from '../logout';
import { signOut } from '@/auth';

describe('logout action - Authentifizierung & Fehlerbehandlung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ sollte signOut erfolgreich aufrufen', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockResolvedValue(undefined);

    await logout();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('❌ sollte Fehler werfen wenn signOut fehlschlägt', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockRejectedValue(new Error('Session expired'));

    await expect(logout()).rejects.toThrow('Session expired');
  });

  it('❌ sollte Fehler werfen bei Authentifizierungsproblem', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockRejectedValue(new Error('Invalid token'));

    await expect(logout()).rejects.toThrow('Invalid token');
  });
});
