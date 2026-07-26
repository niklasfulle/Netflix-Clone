jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));

jest.mock('@/lib/db', () => ({
  db: { profil: { update: jest.fn() } },
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
    expect(db.profil.update).not.toHaveBeenCalled();
  });

  it('rejects invalid profile data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    await expect(
      update({ profilId: 'profile1', profilName: '', profilImg: 'kids.png' }),
    ).resolves.toEqual({ error: 'Invalid fields!' });
    expect(db.profil.update).not.toHaveBeenCalled();
  });

  it('updates the selected profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.update as jest.Mock).mockResolvedValue({ id: 'profile1' });

    await expect(
      update({ profilId: 'profile1', profilName: 'Kids', profilImg: 'kids.png' }),
    ).resolves.toEqual({ success: 'Profil updated!' });
    expect(db.profil.update).toHaveBeenCalledWith({
      where: { id: 'profile1' },
      data: { name: 'Kids', image: 'kids.png' },
    });
  });
});
