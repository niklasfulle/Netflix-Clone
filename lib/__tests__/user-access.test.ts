import { hasActiveUserBlock } from '../user-access';

describe('user access blocking', () => {
  const database = {
    user: {
      update: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows users without a block', async () => {
    await expect(hasActiveUserBlock({
      id: 'user1',
      isBlocked: false,
      blockedUntil: null,
    }, database)).resolves.toBe(false);
    expect(database.user.update).not.toHaveBeenCalled();
  });

  it('keeps permanent and future blocks active', async () => {
    const now = new Date('2026-07-28T10:00:00.000Z');
    await expect(hasActiveUserBlock({
      id: 'user1',
      isBlocked: true,
      blockedUntil: null,
    }, database, now)).resolves.toBe(true);
    await expect(hasActiveUserBlock({
      id: 'user2',
      isBlocked: true,
      blockedUntil: new Date('2026-07-29T10:00:00.000Z'),
    }, database, now)).resolves.toBe(true);
    expect(database.user.update).not.toHaveBeenCalled();
  });

  it('clears an expired temporary block', async () => {
    const now = new Date('2026-07-28T10:00:00.000Z');
    await expect(hasActiveUserBlock({
      id: 'user1',
      isBlocked: true,
      blockedUntil: new Date('2026-07-28T09:59:59.000Z'),
    }, database, now)).resolves.toBe(false);
    expect(database.user.update).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedUntil: null,
        blockedReason: null,
      },
    });
  });
});
