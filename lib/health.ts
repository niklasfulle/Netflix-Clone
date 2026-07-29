import packageJson from "@/package.json";
import { db } from "@/lib/db";

export type HealthStatus = {
  status: "ok" | "error";
  service: "netflix-clone";
  version: string;
  timestamp: string;
  checks: {
    application: "ok";
    database: "ok" | "error";
  };
};

export async function getHealthStatus(): Promise<HealthStatus> {
  let databaseStatus: HealthStatus["checks"]["database"] = "ok";

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "error";
  }

  return {
    status: databaseStatus === "ok" ? "ok" : "error",
    service: "netflix-clone",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    checks: {
      application: "ok",
      database: databaseStatus,
    },
  };
}
