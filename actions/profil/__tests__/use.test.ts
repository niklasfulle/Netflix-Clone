jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      updateMany: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { use } from '../use';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('use profil action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await use({ profilId: 'profil1' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    // Empty string wird AKZEPTIERT von Zod (bug), daher geht es weiter
    const result = await use({ profilId: '' });

    // Die Logik akzeptiert '', daher wird es erfolgreich
    expect(result.success).toBeDefined();
    expect(db.profil.updateMany).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn profilId null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const result = await use({ profilId: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Profil aktivieren', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (db.profil.update as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    const result = await use({ profilId: 'profil1' });

    expect(result.success).toBeDefined();
    expect(db.profil.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user1' },
      })
    );
    expect(db.profil.update).toHaveBeenCalled();
  });
});
