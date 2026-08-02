jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(async (callback) => callback({
      profil: {
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    })),
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

    const result = await use({ profilId: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
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

    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profil1' });

    const result = await use({ profilId: 'profil1' });

    expect(result.success).toBeDefined();
    expect(db.profil.findFirst).toHaveBeenCalledWith({
      where: { id: 'profil1', userId: 'user1' },
      select: { id: true },
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('❌ aktiviert kein Profil eines anderen Benutzers', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await use({ profilId: 'foreign-profile' });

    expect(result).toEqual({ error: 'Profile not found!' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
