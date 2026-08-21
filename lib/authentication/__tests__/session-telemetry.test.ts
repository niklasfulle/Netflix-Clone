import {
  resetSessionTelemetrySamplingForTests,
  shouldObserveSessionValidation,
} from '@/lib/authentication/session-telemetry';

describe('session validation telemetry sampling', () => {
  beforeEach(() => resetSessionTelemetrySamplingForTests());

  it('records the first validation and suppresses repeated polling for 15 minutes', () => {
    expect(shouldObserveSessionValidation('opaque-session', 1_000)).toBe(true);
    expect(shouldObserveSessionValidation('opaque-session', 2_000)).toBe(false);
    expect(shouldObserveSessionValidation('opaque-session', 901_001)).toBe(true);
  });
});
