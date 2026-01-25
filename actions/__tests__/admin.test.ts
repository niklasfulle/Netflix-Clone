jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/lib/logger');
jest.mock('@/lib/db');

import { admin } from '../admin';
import { currentRole } from '@/lib/auth';
import { logBackendAction } from '@/lib/logger';
import { UserRole } from '@prisma/client';

describe('admin action - Validierung & Authentifizierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ sollte Erfolg zurückgeben wenn User ADMIN ist', async () => {
    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.ADMIN);

    const result = await admin();

    expect(result).toEqual({ success: 'Allowed Server Action!' });
    expect(logBackendAction).toHaveBeenCalledWith(
      'admin_allowed',
      { role: UserRole.ADMIN },
      'info'
    );
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht ADMIN ist', async () => {
    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.USER);

    const result = await admin();

    expect(result).toEqual({ error: 'Forbidden Server Action!' });
    expect(logBackendAction).toHaveBeenCalledWith(
      'admin_forbidden',
      { role: UserRole.USER },
      'error'
    );
  });

  it('❌ sollte Fehler zurückgeben wenn keine Role vorhanden ist', async () => {
    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(null as any);

    const result = await admin();

    expect(result).toEqual({ error: 'Forbidden Server Action!' });
  });

  it('❌ sollte Fehler wenn Auth fehlschlägt', async () => {
    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockRejectedValue(new Error('Auth failed'));

    await expect(admin()).rejects.toThrow('Auth failed');
  });
});
