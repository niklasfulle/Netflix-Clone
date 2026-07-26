jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    movieWatchTime: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { updateWatchTime } from '../update-watch-time';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('update watch time action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(
      updateWatchTime({ movieId: 'movie1', watchTime: 42 }),
    ).resolves.toEqual({ error: 'Unauthorized!' });

    expect(db.profil.findFirst).not.toHaveBeenCalled();
    expect(logBackendAction).toHaveBeenCalledWith(
      'watchUpdateWatchTime_unauthorized',
      {},
      'error',
    );
  });

  it('rejects invalid watch-time data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    await expect(
      updateWatchTime({ movieId: 'movie1', watchTime: 'invalid' as any }),
    ).resolves.toEqual({ error: 'Invalid fields!' });

    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('rejects users without an active profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      updateWatchTime({ movieId: 'movie1', watchTime: 42 }),
    ).resolves.toEqual({ error: 'Invalid fields!' });

    expect(db.movieWatchTime.findMany).not.toHaveBeenCalled();
  });

  it('creates watch time when no record exists', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.movieWatchTime.findMany as jest.Mock).mockResolvedValue([]);
    (db.movieWatchTime.create as jest.Mock).mockResolvedValue({ id: 'watch1' });

    await expect(
      updateWatchTime({ movieId: 'movie1', watchTime: 42 }),
    ).resolves.toEqual({ success: 'Watchtime updated!' });

    expect(db.movieWatchTime.create).toHaveBeenCalledWith({
      data: {
        userId: 'user1',
        profilId: 'profile1',
        movieId: 'movie1',
        time: 42,
      },
    });
    expect(db.movieWatchTime.updateMany).not.toHaveBeenCalled();
  });

  it('updates watch time when a record already exists', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.movieWatchTime.findMany as jest.Mock).mockResolvedValue([{ id: 'watch1' }]);
    (db.movieWatchTime.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    await expect(
      updateWatchTime({ movieId: 'movie1', watchTime: 84 }),
    ).resolves.toEqual({ success: 'Watchtime updated!' });

    expect(db.movieWatchTime.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user1',
        profilId: 'profile1',
        movieId: 'movie1',
      },
      data: { time: 84 },
    });
    expect(db.movieWatchTime.create).not.toHaveBeenCalled();
  });
});
