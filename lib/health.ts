import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import packageJson from "@/package.json";
import { db } from "@/lib/db";
import {
  DEFAULT_DEPLOYMENT_UPDATE_POLICY,
  deploymentUpdatePolicy,
} from "@/lib/deployment-update-policy";
import { getMediaFolders } from "@/lib/media-files";
import { getRedisRuntime } from "@/lib/redis/runtime";

export type HealthStatus = {
  status: "ok" | "error";
  service: "netflix-clone";
  version: string;
  environment: string;
  timestamp: string;
  deploymentUpdates: {
    automaticReloadEnabled: boolean;
  };
  checks: {
    application: "ok";
    database: "ok" | "error";
    storage: "ok" | "error";
    redis: "disabled" | "ok" | "degraded";
  };
};

function isMissingPath(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "ENOENT";
}

async function isMediaFolderWritable(folder: string): Promise<boolean> {
  try {
    await access(folder, constants.W_OK);
  } catch {
    return false;
  }

  try {
    await access(path.join(folder, "temp"), constants.W_OK);
    return true;
  } catch (error) {
    return isMissingPath(error);
  }
}

async function getRedisStatus(): Promise<HealthStatus["checks"]["redis"]> {
  try {
    const redisHealth = await getRedisRuntime().health();
    return redisHealth.status === "closed" ? "degraded" : redisHealth.status;
  } catch {
    return "degraded";
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const { movieFolder, seriesFolder } = getMediaFolders();
  const [databaseStatus, storageChecks, redisStatus, updatePolicy] = await Promise.all([
    db.$queryRaw`SELECT 1`
      .then(() => "ok" as const)
      .catch(() => "error" as const),
    Promise.all([
      isMediaFolderWritable(movieFolder),
      isMediaFolderWritable(seriesFolder),
    ]),
    getRedisStatus(),
    deploymentUpdatePolicy.read().catch(() => DEFAULT_DEPLOYMENT_UPDATE_POLICY),
  ]);
  const storageStatus: HealthStatus["checks"]["storage"] = storageChecks.every(Boolean)
    ? "ok"
    : "error";

  return {
    status: databaseStatus === "ok" && storageStatus === "ok" ? "ok" : "error",
    service: "netflix-clone",
    version: packageJson.version,
    environment: process.env.DEPLOYMENT_ENVIRONMENT ?? "development",
    timestamp: new Date().toISOString(),
    deploymentUpdates: updatePolicy,
    checks: {
      application: "ok",
      database: databaseStatus,
      storage: storageStatus,
      redis: redisStatus,
    },
  };
}
