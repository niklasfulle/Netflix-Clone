import {
  resetSessionTelemetrySamplingForTests,
  shouldObserveSessionValidation,
} from '@/lib/authentication/session-telemetry';

describe('session validation telemetry sampling', () => {
  beforeEach(() => resetSessionTelemetrySamplingForTests());

  it('bounds the sampling cache and observes an evicted session again', () => {
    for (let index = 0; index < 1024; index++) expect(shouldObserveSessionValidation(`session-${index}`, 1000)).toBe(true);
    expect(shouldObserveSessionValidation('new-session', 1001)).toBe(true);
    expect(shouldObserveSessionValidation('session-1', 1002)).toBe(false);
    expect(shouldObserveSessionValidation('session-0', 1002)).toBe(true);
  });

  it('uses the runtime clock and does not clear production sampling state', () => {
    const environment = process.env.NODE_ENV;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      expect(shouldObserveSessionValidation('runtime-session')).toBe(true);
      Object.assign(process.env, { NODE_ENV: 'production' });
      resetSessionTelemetrySamplingForTests();
      expect(shouldObserveSessionValidation('runtime-session')).toBe(false);
    } finally {
      Object.assign(process.env, { NODE_ENV: environment });
      clock.mockRestore();
    }
  });

  it('records the first validation and suppresses repeated polling for 15 minutes', () => {
    expect(shouldObserveSessionValidation('opaque-session', 1_000)).toBe(true);
    expect(shouldObserveSessionValidation('opaque-session', 2_000)).toBe(false);
    expect(shouldObserveSessionValidation('opaque-session', 901_001)).toBe(true);
  });
});
