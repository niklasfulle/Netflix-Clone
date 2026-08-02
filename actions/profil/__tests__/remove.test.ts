jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { remove } from '../remove';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('remove profil action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await remove({ profilId: 'profil1' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.deleteMany).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const result = await remove({ profilId: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.deleteMany).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const result = await remove({ profilId: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.deleteMany).not.toHaveBeenCalled();
  });

  it('❌ löscht kein Profil eines anderen Benutzers', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    const result = await remove({ profilId: 'foreign-profile' });

    expect(result).toEqual({ error: 'Profile not found!' });
    expect(db.profil.deleteMany).toHaveBeenCalledWith({
      where: { id: 'foreign-profile', userId: 'user1' },
    });
  });

  it('✅ sollte erfolgreich das eigene Profil löschen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await remove({ profilId: 'profil1' });

    expect(result).toEqual({ success: 'Profil removed!' });
    expect(db.profil.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profil1', userId: 'user1' },
      })
    );
  });
});
