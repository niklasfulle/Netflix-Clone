import { currentUser } from '@/lib/auth';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';
import {
  publicCertificateStore,
  PublicCertificateError,
  type PublicCertificateFormat,
  type PublicCertificateId,
} from '@/lib/public-ca';
import {
  isTrustedPublicCertificateRequest,
  publicCertificateHeaders,
} from '@/lib/public-ca-request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const certificateIds = new Set<PublicCertificateId>(['current', 'previous']);
const certificateFormats = new Set<PublicCertificateFormat>(['pem', 'der']);

export async function GET(
  request: Request,
  context: { params: Promise<{ certificateId: string }> },
) {
  const attempt = authenticationTelemetry.start({
    flow: 'certificate_download',
    component: 'authentication.action',
  });
  try {
    const { certificateId: rawCertificateId } = await context.params;
    if (!certificateIds.has(rawCertificateId as PublicCertificateId)) {
      attempt.complete({
        stage: 'request', outcome: 'rejected', reasonCode: 'invalid_fields',
        retryable: false, errorCategory: 'validation',
      });
      return Response.json({ error: 'Not found' }, {
        status: 404,
        headers: publicCertificateHeaders,
      });
    }
    const formatValue = new URL(request.url).searchParams.get('format') ?? 'pem';
    if (!certificateFormats.has(formatValue as PublicCertificateFormat)) {
      attempt.complete({
        stage: 'request', outcome: 'rejected', reasonCode: 'invalid_fields',
        retryable: false, errorCategory: 'validation',
      });
      return Response.json({ error: 'Unsupported certificate format' }, {
        status: 400,
        headers: publicCertificateHeaders,
      });
    }
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

    const certificateId = rawCertificateId as PublicCertificateId;
    const format = formatValue as PublicCertificateFormat;
    const certificate = await publicCertificateStore.download(certificateId, format);
    const extension = format === 'der' ? 'cer' : 'pem';
    const contentType = format === 'der' ? 'application/pkix-cert' : 'application/x-pem-file';
    attempt.complete({
      stage: 'request', outcome: 'success', reasonCode: 'certificate_downloaded',
      retryable: false,
    });
    return new Response(new Uint8Array(certificate), {
      headers: {
        ...publicCertificateHeaders,
        'Content-Disposition': `attachment; filename="netflix-clone-${certificateId}-root-ca.${extension}"`,
        'Content-Length': String(certificate.byteLength),
        'Content-Type': contentType,
      },
    });
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
