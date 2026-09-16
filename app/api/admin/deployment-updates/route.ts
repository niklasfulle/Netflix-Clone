import packageJson from '@/package.json';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { deploymentUpdatePolicy } from '@/lib/deployment-update-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, {
      status: 403,
      headers: noStoreHeaders,
    });
  }

  try {
    const policy = await deploymentUpdatePolicy.read();
    return Response.json(policy, { headers: noStoreHeaders });
  } catch {
    return Response.json({ error: 'Deployment update policy is unavailable.' }, {
      status: 503,
      headers: noStoreHeaders,
    });
  }
}

export async function PATCH(request: Request) {
  const audit = adminMutationAudit.begin('deployment.manage');
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    await audit.denied();
    return Response.json({ error: 'Forbidden', correlationId: audit.correlationId }, {
      status: 403,
      headers: noStoreHeaders,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await audit.failed();
    return Response.json({ error: 'Invalid request body.' }, {
      status: 400,
      headers: noStoreHeaders,
    });
  }

  if (
    typeof body !== 'object'
    || body === null
    || !('automaticReloadEnabled' in body)
    || typeof body.automaticReloadEnabled !== 'boolean'
  ) {
    await audit.failed();
    return Response.json({ error: 'automaticReloadEnabled must be a boolean.' }, {
      status: 400,
      headers: noStoreHeaders,
    });
  }

  const environment = process.env.DEPLOYMENT_ENVIRONMENT ?? 'development';
  try {
    const policy = await deploymentUpdatePolicy.setAutomaticReload(
      body.automaticReloadEnabled,
    );
    await audit.succeeded({
      target: { type: 'deployment', id: 'global-update-policy' },
      metadata: {
        environment,
        version: packageJson.version,
        operation: policy.automaticReloadEnabled
          ? 'automatic_reload_enabled'
          : 'automatic_reload_disabled',
      },
    });
    return Response.json({ ...policy, correlationId: audit.correlationId }, {
      headers: noStoreHeaders,
    });
  } catch {
    await audit.failed({ metadata: { environment, version: packageJson.version } });
    return Response.json({
      error: 'Deployment update policy could not be saved.',
      correlationId: audit.correlationId,
    }, { status: 503, headers: noStoreHeaders });
  }
}
