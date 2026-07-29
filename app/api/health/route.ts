import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getHealthStatus();

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
