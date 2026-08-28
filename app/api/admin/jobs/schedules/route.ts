import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { weeklyJobSchedules } from '@/lib/jobs/runtime';
import { parseWeeklyScheduleConfiguration } from '@/lib/jobs/weekly-schedules';

export const runtime = 'nodejs';

const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

function deploymentEnvironment(): 'staging' | 'production' {
  if (process.env.DEPLOYMENT_ENVIRONMENT === 'production') return 'production';
  if (process.env.DEPLOYMENT_ENVIRONMENT === 'staging') return 'staging';
  throw new Error('DEPLOYMENT_ENVIRONMENT must be staging or production');
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: noStoreHeaders });
  }
  try {
    return Response.json({ schedules: await weeklyJobSchedules.list() }, {
      headers: noStoreHeaders,
    });
  } catch {
    return Response.json({ error: 'Weekly schedules are currently unavailable.' }, {
      status: 503,
      headers: noStoreHeaders,
    });
  }
}

export async function PUT(request: Request) {
  const audit = adminMutationAudit.begin('job.schedule_change');
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN' || !user.id) {
    await audit.denied();
    return Response.json({ error: 'Forbidden', correlationId: audit.correlationId }, {
      status: 403,
      headers: noStoreHeaders,
    });
  }

  let configuration;
  try {
    configuration = parseWeeklyScheduleConfiguration(await request.json());
  } catch {
    await audit.failed();
    return Response.json({ error: 'Invalid weekly schedule.', correlationId: audit.correlationId }, {
      status: 400,
      headers: noStoreHeaders,
    });
  }

  try {
    await weeklyJobSchedules.update({
      configuration,
      actorUserId: user.id,
      environment: deploymentEnvironment(),
    });
    await audit.succeeded({
      target: { type: 'background_job', id: `weekly-schedule-${configuration.kind.toLowerCase()}` },
      metadata: {
        kind: configuration.kind,
        enabled: configuration.enabled,
        weekdays: configuration.weekdays.map(String),
        time: configuration.time,
        timezone: configuration.timezone,
      },
    });
    return Response.json({ schedule: configuration, correlationId: audit.correlationId }, {
      headers: noStoreHeaders,
    });
  } catch {
    await audit.failed({ metadata: { kind: configuration.kind } });
    return Response.json({ error: 'Weekly schedule could not be saved.', correlationId: audit.correlationId }, {
      status: 503,
      headers: noStoreHeaders,
    });
  }
}
