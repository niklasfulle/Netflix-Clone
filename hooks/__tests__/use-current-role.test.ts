import { useCurrentRole } from '../use-current-role';
import getUser from '../useUser';

jest.mock('../useUser');

describe('useCurrentRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user role from getUser', () => {
    const mockRole = 'admin';

    (getUser as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: mockRole,
        },
      },
      error: undefined,
      isLoading: false,
    });

    const result = useCurrentRole();

    expect(result).toBe(mockRole);
  });

  it('should return user role when role is user', () => {
    const mockRole = 'user';

    (getUser as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: mockRole,
        },
      },
    });

    const result = useCurrentRole();

    expect(result).toBe(mockRole);
  });

  it('should return user role when role is guest', () => {
    const mockRole = 'guest';

    (getUser as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: mockRole,
        },
      },
    });

    const result = useCurrentRole();

    expect(result).toBe(mockRole);
  });

  it('should call getUser hook', () => {
    (getUser as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'admin',
        },
      },
    });

    useCurrentRole();

    expect(getUser).toHaveBeenCalled();
  });

  it('should handle different role values', () => {
    const roles = ['admin', 'user', 'moderator', 'guest'];

    roles.forEach((role) => {
      (getUser as jest.Mock).mockReturnValue({
        data: {
          user: {
            role,
          },
        },
      });

      const result = useCurrentRole();
      expect(result).toBe(role);
    });
  });
});
