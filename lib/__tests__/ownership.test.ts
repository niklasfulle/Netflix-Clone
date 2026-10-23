import { db } from '@/lib/db';
import { findOwnedPlaylist, findOwnedProfile } from '../ownership';

jest.mock('@/lib/db', () => ({ db: { playlist: { findFirst: jest.fn() }, profil: { findFirst: jest.fn() } } }));

beforeEach(() => jest.clearAllMocks());

it('keeps automatic favorites outside the editable playlist store', () => {
  expect(findOwnedPlaylist({ playlistId: 'favorites', userId: 'user', profileId: 'profile' })).toBeNull();
  expect(db.playlist.findFirst).not.toHaveBeenCalled();
});

it('restricts playlist lookups to the current user and profile', async () => {
  jest.mocked(db.playlist.findFirst).mockResolvedValue({ id: 'list' } as never);
  await expect(findOwnedPlaylist({ playlistId: 'list', userId: 'user', profileId: 'profile' })).resolves.toEqual({ id: 'list' });
  expect(db.playlist.findFirst).toHaveBeenCalledWith({ where: { id: 'list', userId: 'user', profilId: 'profile' }, select: { id: true } });
});

it('does not expose profiles belonging to another user', async () => {
  jest.mocked(db.profil.findFirst).mockResolvedValue(null);
  await expect(findOwnedProfile('profile', 'other-user')).resolves.toBeNull();
  expect(db.profil.findFirst).toHaveBeenCalledWith({ where: { id: 'profile', userId: 'other-user' }, select: { id: true } });
});
