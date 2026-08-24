import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { systemOverviewRequests } from "@/lib/administration/admin-summary-runtime";
import { getSystemOverview } from "@/lib/system-monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const overview = await systemOverviewRequests.run('system-overview', getSystemOverview);
  return Response.json(overview.value, {
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Deduplicated": String(overview.deduplicated),
    },
  });
}
