/** @jest-environment node */

import { withAuthenticationRouteTelemetry } from '@/lib/authentication/auth-route';

describe('Auth.js route telemetry boundary', () => {
  const complete = jest.fn();
  const start = jest.fn(() => ({ correlationId: 'safe-reference', complete }));
  const telemetry = { start } as never;

  beforeEach(() => jest.clearAllMocks());

  it('rejects cross-site mutations before invoking Auth.js', async () => {
    const handler = jest.fn();
    const route = withAuthenticationRouteTelemetry(handler, telemetry, {
      observeSuccessfulRequest: true,
    });

    const response = await route(new Request('https://netflix/api/auth/callback', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site' },
    }));

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: 'origin_rejected',
      httpStatus: 403,
    }));
  });

  it('records one terminal response without reading the request body', async () => {
    const handler = jest.fn().mockResolvedValue(new Response(null, { status: 302 }));
    const route = withAuthenticationRouteTelemetry(handler, telemetry, {
      observeSuccessfulRequest: true,
    });
    const request = new Request('https://netflix/api/auth/callback?token=not-for-logs', {
      method: 'POST',
      body: 'password=not-for-logs',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    await expect(route(request)).resolves.toHaveProperty('status', 302);
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: 'provider_request_completed',
      httpStatus: 302,
    }));
    expect(JSON.stringify(start.mock.calls)).not.toContain('not-for-logs');
    expect(JSON.stringify(complete.mock.calls)).not.toContain('not-for-logs');
  });

  it('does not log successful polling but records thrown provider failures', async () => {
    const successfulRoute = withAuthenticationRouteTelemetry(
      jest.fn().mockResolvedValue(Response.json({})),
      telemetry,
      { observeSuccessfulRequest: false },
    );
    await successfulRoute(new Request('https://netflix/api/auth/session'));
    expect(start).not.toHaveBeenCalled();

    const failedRoute = withAuthenticationRouteTelemetry(
      jest.fn().mockRejectedValue(new Error('provider included private content')),
      telemetry,
      { observeSuccessfulRequest: false },
    );
    await expect(failedRoute(new Request('https://netflix/api/auth/session')))
      .rejects.toThrow('provider included private content');
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: 'provider_failure',
      errorCategory: 'provider',
    }));
    expect(JSON.stringify(complete.mock.calls)).not.toContain('private content');
  });
});
