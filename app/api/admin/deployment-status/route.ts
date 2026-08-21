import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { readScheduledBackupStatus } from "@/lib/backup-verification";
import {
  DeploymentStatusConfigurationError,
  getDeploymentStatusOverview,
} from "@/lib/deployment-status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [overview, scheduledBackup] = await Promise.all([
      getDeploymentStatusOverview(),
      readScheduledBackupStatus(),
    ]);
    return Response.json({ ...overview, scheduledBackup }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof DeploymentStatusConfigurationError) {
      return Response.json(
        { error: "Deployment status is unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { error: "Deployment status could not be loaded" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
