jest.mock('@/auth', () => ({ auth: jest.fn() }));

import { auth } from '@/auth';
import { currentUser } from '@/lib/auth';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('current user session guard', () => {
  it.each([
    { isBlocked: true, isRevoked: false },
    { isBlocked: false, isRevoked: true },
  ])('rejects blocked and revoked sessions', async (state) => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', ...state },
      expires: '2026-09-12T10:00:00.000Z',
    } as never);

    await expect(currentUser()).resolves.toBeUndefined();
  });

  it('returns an active session user', async () => {
    const user = { id: 'user-1', isBlocked: false, isRevoked: false };
    mockAuth.mockResolvedValue({
      user,
      expires: '2026-09-12T10:00:00.000Z',
    } as never);

    await expect(currentUser()).resolves.toEqual(user);
  });
});
