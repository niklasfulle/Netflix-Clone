import { renderHook } from '@testing-library/react';
import useUser from '../useUser';
import { useCurrentUser } from '../use-current-user';

jest.mock('../useUser', () => ({ __esModule: true, default: jest.fn() }));

it('provides the current user after the session request finishes', () => {
  jest.mocked(useUser).mockReturnValue({ data: undefined } as ReturnType<typeof useUser>);
  const { result, rerender } = renderHook(() => useCurrentUser());
  expect(result.current).toBeUndefined();
  const user = { id: 'viewer', name: 'Viewer' };
  jest.mocked(useUser).mockReturnValue({ data: { user } } as ReturnType<typeof useUser>);
  rerender();
  expect(result.current).toEqual(user);
});
