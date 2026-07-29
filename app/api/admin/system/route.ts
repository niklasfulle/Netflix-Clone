import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { getSystemOverview } from "@/lib/system-monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const overview = await getSystemOverview();
  return Response.json(overview, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
