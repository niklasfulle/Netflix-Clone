import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  authorizePasskeyManagement,
  listPasskeys,
  removePasskey,
  renamePasskey,
} from '@/actions/passkeys';
import { PasskeySettingsPanel } from '@/app/(protected)/settings/_components/passkey-settings-panel';
import { signIn } from 'next-auth/webauthn';

jest.mock('@/actions/passkeys', () => ({
  authorizePasskeyManagement: jest.fn(),
  listPasskeys: jest.fn(),
  removePasskey: jest.fn(),
  renamePasskey: jest.fn(),
}));

jest.mock('next-auth/webauthn', () => ({ signIn: jest.fn() }));

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const mockedAuthorize = jest.mocked(authorizePasskeyManagement);
const mockedList = jest.mocked(listPasskeys);
const mockedRemove = jest.mocked(removePasskey);
const mockedRename = jest.mocked(renamePasskey);
const mockedSignIn = jest.mocked(signIn);

const enabledRuntime = () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ enabled: true }),
  }) as jest.Mock;
  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: class PublicKeyCredential {},
  });
};

describe('PasskeySettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enabledRuntime();
    mockedList.mockResolvedValue({
      status: 'rejected',
      code: 'reauthentication_required',
    });
  });

  it('requires the current password before exposing passkey management', async () => {
    mockedAuthorize.mockResolvedValue({
      status: 'authorized',
      expiresAt: '2026-08-12T19:05:00.000Z',
    });
    mockedList
      .mockResolvedValueOnce({ status: 'rejected', code: 'reauthentication_required' })
      .mockResolvedValueOnce({ status: 'success', passkeys: [] });

    render(<PasskeySettingsPanel />);

    const password = await screen.findByLabelText('Current password for passkeys');
    fireEvent.change(password, { target: { value: 'correct horse battery staple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock passkey settings' }));

    await waitFor(() => {
      expect(mockedAuthorize).toHaveBeenCalledWith('correct horse battery staple');
      expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeInTheDocument();
    });
  });

  it('registers, renames, and recovery-safely removes passkeys', async () => {
    mockedList.mockResolvedValue({
      status: 'success',
      passkeys: [{
        credentialId: 'credential-1',
        label: 'Windows laptop',
        deviceType: 'multiDevice',
        backedUp: true,
        transports: 'internal',
        createdAt: '2026-08-12T18:00:00.000Z',
        lastUsedAt: null,
      }],
    });
    mockedRename.mockResolvedValue({ status: 'success' });
    mockedRemove.mockResolvedValue({ status: 'success' });
    mockedSignIn.mockResolvedValue(undefined as never);

    render(<PasskeySettingsPanel />);

    const addButton = await screen.findByRole('button', { name: 'Add a passkey' });
    fireEvent.click(addButton);
    expect(mockedSignIn).toHaveBeenCalledWith('passkey', {
      action: 'register',
      redirectTo: '/settings#security',
    });

    const label = screen.getByLabelText('Passkey name');
    fireEvent.change(label, { target: { value: 'Desktop PC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save passkey name' }));
    await waitFor(() => expect(mockedRename).toHaveBeenCalledWith('credential-1', 'Desktop PC'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove passkey' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm passkey removal' }));
    await waitFor(() => expect(mockedRemove).toHaveBeenCalledWith('credential-1'));
  });

  it('explains why the final sign-in method cannot be removed', async () => {
    mockedList.mockResolvedValue({
      status: 'success',
      passkeys: [{
        credentialId: 'only-key',
        label: null,
        deviceType: 'singleDevice',
        backedUp: false,
        transports: null,
        createdAt: '2026-08-12T18:00:00.000Z',
        lastUsedAt: null,
      }],
    });
    mockedRemove.mockResolvedValue({
      status: 'rejected',
      code: 'last_sign_in_method',
    });

    render(<PasskeySettingsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove passkey' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm passkey removal' }));

    expect(await screen.findByText('Keep at least one passkey, password, or connected sign-in method.')).toBeInTheDocument();
  });
});
