import { UserRole } from '@prisma/client';

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentRole } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  currentRole: jest.fn(),
}));

const mockedCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;

describe('isCurrentUserAdmin', () => {
  test('allows administrators', async () => {
    mockedCurrentRole.mockResolvedValue(UserRole.ADMIN);

    await expect(isCurrentUserAdmin()).resolves.toBe(true);
  });

  test.each([UserRole.USER, undefined])('rejects role %s', async (role) => {
    mockedCurrentRole.mockResolvedValue(role);

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });
});
