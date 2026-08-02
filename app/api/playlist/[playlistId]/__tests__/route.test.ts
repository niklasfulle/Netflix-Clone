/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    profil: { findFirst: jest.fn() },
    playlist: { findFirst: jest.fn(), findUnique: jest.fn() },
    playlistEntry: { findMany: jest.fn() },
    movie: { findMany: jest.fn() },
  },
}));

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET } from '../route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedDb = db as any;
const request = new Request('http://localhost/api/playlist/playlist1') as never;

describe('playlist detail API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns 401 when the request is unauthenticated', async () => {
    mockedCurrentUser.mockResolvedValue(undefined);

    const response = await GET(request, { params: Promise.resolve({ playlistId: 'playlist1' }) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
    });
  });

  it('does not expose a playlist owned by another profile', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.playlist.findFirst.mockResolvedValue(null);

    const response = await GET(request, { params: Promise.resolve({ playlistId: 'foreign' }) });

    expect(response.status).toBe(404);
    expect(mockedDb.playlist.findUnique).not.toHaveBeenCalled();
    expect(mockedDb.playlistEntry.findMany).not.toHaveBeenCalled();
  });

  it('returns owned playlist movies in playlist order with one batched movie query', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.playlist.findFirst.mockResolvedValue({ id: 'playlist1' });
    mockedDb.playlist.findUnique.mockResolvedValue({
      id: 'playlist1', userId: 'user1', profilId: 'profile1', title: 'Favorites',
    });
    mockedDb.playlistEntry.findMany.mockResolvedValue([
      { movieId: 'movie2', order: 1 },
      { movieId: 'movie1', order: 2 },
    ]);
    mockedDb.movie.findMany.mockResolvedValue([
      { id: 'movie1', title: 'One' },
      { id: 'movie2', title: 'Two' },
    ]);

    const response = await GET(request, { params: Promise.resolve({ playlistId: 'playlist1' }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 'playlist1',
      movies: [{ id: 'movie2' }, { id: 'movie1' }],
    });
    expect(mockedDb.movie.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['movie2', 'movie1'] } },
    });
  });
});

