jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/passkey-provider', () => ({ passkeysEnabled: true }));
jest.mock('@/lib/passkeys', () => ({
  passkeyManagement: {
    authorize: jest.fn(),
    list: jest.fn(),
    rename: jest.fn(),
    remove: jest.fn(),
  },
  readPasskeyGrantToken: jest.fn(),
  setPasskeyGrantCookie: jest.fn(),
  clearPasskeyGrantCookie: jest.fn(),
}));

import {
  authorizePasskeyManagement,
  listPasskeys,
  removePasskey,
  renamePasskey,
} from '@/actions/passkeys';
import { currentUser } from '@/lib/auth';
import {
  clearPasskeyGrantCookie,
  passkeyManagement,
  readPasskeyGrantToken,
  setPasskeyGrantCookie,
} from '@/lib/passkeys';

const mockedCurrentUser = jest.mocked(currentUser);
const mockedAuthorize = jest.mocked(passkeyManagement.authorize);
const mockedList = jest.mocked(passkeyManagement.list);
const mockedRename = jest.mocked(passkeyManagement.rename);
const mockedRemove = jest.mocked(passkeyManagement.remove);
const mockedReadToken = jest.mocked(readPasskeyGrantToken);
const mockedSetCookie = jest.mocked(setPasskeyGrantCookie);
const mockedClearCookie = jest.mocked(clearPasskeyGrantCookie);

describe('passkey actions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reauthenticates the active session and stores only the opaque grant cookie', async () => {
    const expiresAt = new Date('2026-08-12T18:35:00.000Z');
    mockedCurrentUser.mockResolvedValue({ id: 'user-1', sessionId: 'session-1' } as never);
    mockedAuthorize.mockResolvedValue({
      status: 'authorized',
      token: 'opaque-grant-token',
      expiresAt,
    });

    await expect(
      authorizePasskeyManagement('Correct-password-2026'),
    ).resolves.toEqual({ status: 'authorized', expiresAt: expiresAt.toISOString() });
    expect(mockedAuthorize).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      password: 'Correct-password-2026',
    });
    expect(mockedSetCookie).toHaveBeenCalledWith('opaque-grant-token', expiresAt);
  });

  it('lists only the current user passkeys after reauthentication', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user-1', sessionId: 'session-1' } as never);
    mockedReadToken.mockResolvedValue('grant-token');
    mockedList.mockResolvedValue({
      status: 'success',
      passkeys: [
        {
          credentialId: 'credential-1',
          label: 'Phone',
          deviceType: 'multiDevice',
          backedUp: true,
          transports: 'internal',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          lastUsedAt: null,
        },
      ],
    });

    await expect(listPasskeys()).resolves.toEqual({
      status: 'success',
      passkeys: [
        expect.objectContaining({
          credentialId: 'credential-1',
          createdAt: '2026-08-01T00:00:00.000Z',
          lastUsedAt: null,
        }),
      ],
    });
    expect(mockedList).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      token: 'grant-token',
    });
  });

  it('renames a passkey through the current authenticated owner', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user-1', sessionId: 'session-1' } as never);
    mockedReadToken.mockResolvedValue('grant-token');
    mockedRename.mockResolvedValue({ status: 'success' });

    await expect(renamePasskey('credential-1', 'Laptop')).resolves.toEqual({
      status: 'success',
    });
    expect(mockedRename).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      token: 'grant-token',
      credentialId: 'credential-1',
      label: 'Laptop',
    });
  });

  it('removes a passkey only through the recovery-safe management module', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user-1', sessionId: 'session-1' } as never);
    mockedReadToken.mockResolvedValue('grant-token');
    mockedRemove.mockResolvedValue({ status: 'rejected', code: 'last_sign_in_method' });

    await expect(removePasskey('credential-1')).resolves.toEqual({
      status: 'rejected',
      code: 'last_sign_in_method',
    });
    expect(mockedRemove).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      token: 'grant-token',
      credentialId: 'credential-1',
    });
  });
});
