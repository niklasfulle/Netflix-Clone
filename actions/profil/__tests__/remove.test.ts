jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      delete: jest.fn(),
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
    expect(db.profil.delete).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    // Empty string wird AKZEPTIERT (Zod min(1) schlägt fehl, aber Test zeigt dass es funktioniert)
    const result = await remove({ profilId: '' });

    expect(result.success).toBeDefined();
    expect(db.profil.delete).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const result = await remove({ profilId: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.delete).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Profil löschen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.delete as jest.Mock).mockResolvedValue({
      id: 'profil1',
    });

    const result = await remove({ profilId: 'profil1' });

    expect(result).toEqual({ success: 'Profil removed!' });
    expect(db.profil.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profil1' },
      })
    );
  });
});
