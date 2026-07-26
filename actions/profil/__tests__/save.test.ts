jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));

jest.mock('@/lib/db', () => ({
  db: { profil: { create: jest.fn() } },
}));

jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));

import { save } from '../save';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('save profile action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(save({ profilName: 'Kids', profilImg: 'kids.png' })).resolves.toEqual({
      error: 'Unauthorized!',
    });
    expect(db.profil.create).not.toHaveBeenCalled();
  });

  it('rejects invalid profile data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    await expect(save({ profilName: '', profilImg: '' })).resolves.toEqual({
      error: 'Invalid fields!',
    });
    expect(db.profil.create).not.toHaveBeenCalled();
  });

  it('creates a profile for the current user', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.create as jest.Mock).mockResolvedValue({ id: 'profile1' });

    await expect(save({ profilName: 'Kids', profilImg: 'kids.png' })).resolves.toEqual({
      success: 'Profil created!',
    });
    expect(db.profil.create).toHaveBeenCalledWith({
      data: { userId: 'user1', name: 'Kids', image: 'kids.png' },
    });
  });
});
