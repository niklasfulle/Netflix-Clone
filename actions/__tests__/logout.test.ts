jest.mock('@/auth', () => ({
  signOut: jest.fn(),
}));

const mockTelemetryComplete = jest.fn();
const mockTelemetryStart = jest.fn((_input?: unknown) => ({
  correlationId: 'logout-correlation',
  complete: mockTelemetryComplete,
}));

jest.mock('@/lib/authentication/production-telemetry', () => ({
  authenticationTelemetry: { start: (input: unknown) => mockTelemetryStart(input) },
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
  },
}));

import { logout } from '../logout';
import { signOut } from '@/auth';

describe('logout action - Authentifizierung & Fehlerbehandlung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTelemetryStart.mockReturnValue({
      correlationId: 'logout-correlation',
      complete: mockTelemetryComplete,
    });
  });

  it('✅ beendet die Sitzung und leitet explizit zur Anmeldung weiter', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockResolvedValue(undefined);

    await logout();

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/auth/login' });
    expect(mockTelemetryStart).toHaveBeenCalledWith({
      flow: 'logout',
      component: 'authentication.action',
    });
    expect(mockTelemetryComplete).toHaveBeenCalledWith({
      stage: 'session',
      outcome: 'success',
      reasonCode: 'signed_out',
      retryable: false,
    });
  });

  it('❌ sollte Fehler werfen wenn signOut fehlschlägt', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockRejectedValue(new Error('Session expired'));

    await expect(logout()).rejects.toThrow('Session expired');
    expect(mockTelemetryComplete).toHaveBeenCalledWith({
      stage: 'session',
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      retryable: true,
      errorCategory: 'provider',
    });
  });

  it('❌ sollte Fehler werfen bei Authentifizierungsproblem', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
    mockSignOut.mockRejectedValue(new Error('Invalid token'));

    await expect(logout()).rejects.toThrow('Invalid token');
  });
});
