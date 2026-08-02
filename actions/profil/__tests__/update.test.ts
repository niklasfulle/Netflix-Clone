jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));

jest.mock('@/lib/db', () => ({
  db: { profil: { updateMany: jest.fn() } },
}));

jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));

import { update } from '../update';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('update profile action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(
      update({ profilId: 'profile1', profilName: 'Kids', profilImg: 'kids.png' }),
    ).resolves.toEqual({ error: 'Unauthorized!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
  });

  it('rejects invalid profile data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    await expect(
      update({ profilId: 'profile1', profilName: '', profilImg: 'kids.png' }),
    ).resolves.toEqual({ error: 'Invalid fields!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an empty profile id before accessing the database', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    await expect(
      update({ profilId: '', profilName: 'Kids', profilImg: 'kids.png' }),
    ).resolves.toEqual({ error: 'Invalid fields!' });
    expect(db.profil.updateMany).not.toHaveBeenCalled();
  });

  it('does not update a profile owned by another user', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(
      update({ profilId: 'foreign-profile', profilName: 'Kids', profilImg: 'kids.png' }),
    ).resolves.toEqual({ error: 'Profile not found!' });
    expect(db.profil.updateMany).toHaveBeenCalledWith({
      where: { id: 'foreign-profile', userId: 'user1' },
      data: { name: 'Kids', image: 'kids.png' },
    });
  });

  it('updates the selected profile only for its owner', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    await expect(
      update({ profilId: 'profile1', profilName: 'Kids', profilImg: 'kids.png' }),
    ).resolves.toEqual({ success: 'Profil updated!' });
    expect(db.profil.updateMany).toHaveBeenCalledWith({
      where: { id: 'profile1', userId: 'user1' },
      data: { name: 'Kids', image: 'kids.png' },
    });
  });
});
