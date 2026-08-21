import { currentUser } from '@/lib/auth';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';
import { publicCertificateStore, PublicCertificateError } from '@/lib/public-ca';
import {
  isTrustedPublicCertificateRequest,
  publicCertificateHeaders,
} from '@/lib/public-ca-request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const attempt = authenticationTelemetry.start({
    flow: 'certificate_metadata',
    component: 'authentication.action',
  });
  try {
    if (!isTrustedPublicCertificateRequest(request)) {
      attempt.complete({
        stage: 'request', outcome: 'rejected', reasonCode: 'origin_rejected',
        retryable: false, errorCategory: 'validation',
      });
      return Response.json({ error: 'Forbidden' }, {
        status: 403,
        headers: publicCertificateHeaders,
      });
    }
    if (!(await currentUser())) {
      attempt.complete({
        stage: 'session', outcome: 'rejected', reasonCode: 'unauthorized',
        retryable: false, errorCategory: 'credentials',
      });
      return Response.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: publicCertificateHeaders,
      });
    }
    const certificates = await publicCertificateStore.list();
    attempt.complete({
      stage: 'request', outcome: 'success', reasonCode: 'certificate_metadata_loaded',
      retryable: false,
    });
    return Response.json({ certificates }, { headers: publicCertificateHeaders });
  } catch (error) {
    const certificateError = error instanceof PublicCertificateError;
    attempt.complete({
      stage: 'request',
      outcome: 'failed',
      reasonCode: certificateError ? 'certificate_unavailable' : 'unexpected_failure',
      retryable: true,
      errorCategory: certificateError ? 'configuration' : 'database',
    });
    return Response.json({ error: 'Public CA certificate is unavailable.' }, {
      status: 503,
      headers: publicCertificateHeaders,
    });
  }
}
