import { render, screen } from '@testing-library/react';
import { UserRole } from '@prisma/client';
import { useCurrentRole } from '@/hooks/use-current-role';
import { RoleGate } from '../role-gate';
import { UserInfo } from '../user-info';

jest.mock('@/hooks/use-current-role', () => ({ useCurrentRole: jest.fn() }));

it.each([UserRole.ADMIN, UserRole.USER, undefined])('only displays restricted content for the required role: %s', role => {
  jest.mocked(useCurrentRole).mockReturnValue(role);
  render(<RoleGate allowedRole={UserRole.ADMIN}><p>Restricted content</p></RoleGate>);
  if (role === UserRole.ADMIN) expect(screen.getByText('Restricted content')).toBeInTheDocument();
  else {
    expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
    expect(screen.getByText('You do not have permission to view this content!')).toBeInTheDocument();
  }
});

it.each([true, false])('shows user details and the actual two-factor status: %s', isTwoFactorEnabled => {
  const user = { id: 'viewer', name: 'Viewer', email: 'viewer@example.test', role: UserRole.USER, isTwoFactorEnabled } as React.ComponentProps<typeof UserInfo>['user'];
  render(<UserInfo label="My account" user={user} />);
  expect(screen.getByText('My account')).toBeInTheDocument();
  expect(screen.getByText('viewer@example.test')).toBeInTheDocument();
  expect(screen.getByText('Viewer')).toBeInTheDocument();
  expect(screen.getByText(isTwoFactorEnabled ? 'ON' : 'OFF')).toBeInTheDocument();
});

it('renders a safe account shell before user details arrive', () => {
  render(<UserInfo label="My account" />);
  expect(screen.getByText('My account')).toBeInTheDocument();
  expect(screen.getByText('OFF')).toBeInTheDocument();
});
