import { GET as authGet, POST as authPost } from '@/auth';
import { withAuthenticationRouteTelemetry } from '@/lib/authentication/auth-route';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';

export const GET = withAuthenticationRouteTelemetry(
  authGet as (request: Request) => Promise<Response>,
  authenticationTelemetry,
  { observeSuccessfulRequest: false },
);

export const POST = withAuthenticationRouteTelemetry(
  authPost as (request: Request) => Promise<Response>,
  authenticationTelemetry,
  { observeSuccessfulRequest: true },
);
