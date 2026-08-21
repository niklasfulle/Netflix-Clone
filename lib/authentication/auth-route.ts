import type { AuthenticationTelemetry } from './telemetry';

type AuthRouteHandler = (request: Request) => Promise<Response>;

function isCrossSite(request: Request): boolean {
  return request.headers.get('sec-fetch-site') === 'cross-site';
}

export function withAuthenticationRouteTelemetry(
  handler: AuthRouteHandler,
  telemetry: AuthenticationTelemetry,
  options: { observeSuccessfulRequest: boolean },
): AuthRouteHandler {
  return async (request) => {
    if (isCrossSite(request)) {
      const attempt = telemetry.start({
        flow: 'provider_request',
        component: 'authentication.route',
      });
      attempt.complete({
        stage: 'request',
        outcome: 'rejected',
        reasonCode: 'origin_rejected',
        retryable: false,
        errorCategory: 'validation',
        httpStatus: 403,
      });
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attempt = options.observeSuccessfulRequest
      ? telemetry.start({ flow: 'provider_request', component: 'authentication.route' })
      : null;
    try {
      const response = await handler(request);
      if (attempt) {
        const rejected = response.status >= 400;
        attempt.complete({
          stage: 'request',
          outcome: rejected ? 'rejected' : 'success',
          reasonCode: rejected ? 'provider_request_rejected' : 'provider_request_completed',
          retryable: response.status >= 500,
          ...(rejected && { errorCategory: 'provider' as const }),
          httpStatus: response.status,
        });
      }
      return response;
    } catch (error) {
      const failedAttempt = attempt ?? telemetry.start({
        flow: 'provider_request',
        component: 'authentication.route',
      });
      failedAttempt.complete({
        stage: 'request',
        outcome: 'failed',
        reasonCode: 'provider_failure',
        retryable: true,
        errorCategory: 'provider',
        httpStatus: 500,
      });
      throw error;
    }
  };
}
