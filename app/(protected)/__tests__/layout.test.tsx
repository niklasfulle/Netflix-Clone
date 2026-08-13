import { render, screen } from '@testing-library/react';

import { currentUser } from '@/lib/auth';

import ProtectedLayout from '../layout';

const mockRedirect = jest.fn((_path: string) => {
  throw new Error('NEXT_REDIRECT');
});

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: (path: string) => mockRedirect(path) }));

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('protected layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' } as never);
  });

  it('renders protected content for an active session', async () => {
    render(await ProtectedLayout({ children: <div>Protected content</div> }));

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects a revoked or missing session before rendering protected content', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(ProtectedLayout({ children: <div>Secret</div> })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });
});
