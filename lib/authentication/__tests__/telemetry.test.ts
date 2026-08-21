/** @jest-environment node */

import { createAuthenticationTelemetry } from '@/lib/authentication/telemetry';

describe('authentication telemetry', () => {
  it('records one correlated start and terminal event for a rejected login', () => {
    const records: Array<Record<string, unknown>> = [];
    const times = [
      new Date('2026-08-20T18:00:00.000Z'),
      new Date('2026-08-20T18:00:00.125Z'),
    ];
    const telemetry = createAuthenticationTelemetry({
      write: (record) => records.push(record),
      now: () => times.shift() ?? new Date('2026-08-20T18:00:00.125Z'),
      randomUUID: () => '018f48d8-8ba1-7dd9-8000-000000000001',
      environment: 'staging',
      version: '1.12.0-rc.1',
    });

    const attempt = telemetry.start({
      flow: 'login',
      component: 'authentication.service',
    });
    attempt.complete({
      stage: 'credentials',
      outcome: 'rejected',
      reasonCode: 'invalid_credentials',
      retryable: false,
    });

    expect(records).toEqual([
      {
        timestamp: '2026-08-20T18:00:00.000Z',
        level: 'info',
        action: 'auth.login.started',
        category: 'authentication',
        environment: 'staging',
        version: '1.12.0-rc.1',
        correlationId: '018f48d8-8ba1-7dd9-8000-000000000001',
        flow: 'login',
        stage: 'request',
        outcome: 'started',
        reasonCode: 'attempt_started',
        component: 'authentication.service',
        retryable: false,
      },
      {
        timestamp: '2026-08-20T18:00:00.125Z',
        level: 'info',
        action: 'auth.login.completed',
        category: 'authentication',
        environment: 'staging',
        version: '1.12.0-rc.1',
        correlationId: '018f48d8-8ba1-7dd9-8000-000000000001',
        flow: 'login',
        stage: 'credentials',
        outcome: 'rejected',
        reasonCode: 'invalid_credentials',
        component: 'authentication.service',
        retryable: false,
        durationMs: 125,
      },
    ]);
  });

  it('allow-lists terminal values even when a caller bypasses the TypeScript contract', () => {
    const records: Array<Record<string, unknown>> = [];
    const telemetry = createAuthenticationTelemetry({
      write: (record) => records.push(record),
      now: () => new Date('2026-08-20T18:00:00.000Z'),
      randomUUID: () => '018f48d8-8ba1-7dd9-8000-000000000002',
      environment: 'test',
      version: '1.12.0-rc.1',
    });

    const attempt = telemetry.start({
      flow: 'login',
      component: 'authentication.service',
    });
    attempt.complete({
      stage: 'credentials',
      outcome: 'failed',
      reasonCode: 'viewer@example.com',
      retryable: true,
      errorCategory: 'unexpected',
      email: 'viewer@example.com',
      password: 'not-for-logs',
      error: new Error('database contains viewer@example.com'),
    } as unknown as Parameters<typeof attempt.complete>[0]);

    expect(records[1]).toMatchObject({
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      errorCategory: 'unexpected',
    });
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain('viewer@example.com');
    expect(serialized).not.toContain('not-for-logs');
    expect(serialized).not.toContain('database contains');
  });

  it('does not change authentication behavior when the telemetry sink fails', () => {
    const telemetry = createAuthenticationTelemetry({
      write: () => {
        throw new Error('log storage unavailable');
      },
      now: () => new Date('2026-08-20T18:00:00.000Z'),
      randomUUID: () => '018f48d8-8ba1-7dd9-8000-000000000003',
      environment: 'test',
      version: '1.12.0-rc.1',
    });

    expect(() => {
      const attempt = telemetry.start({
        flow: 'login',
        component: 'authentication.service',
      });
      attempt.complete({
        stage: 'session',
        outcome: 'success',
        reasonCode: 'signed_in',
        retryable: false,
      });
    }).not.toThrow();
  });
});
