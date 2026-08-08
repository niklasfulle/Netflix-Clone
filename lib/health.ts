import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import packageJson from "@/package.json";
import { db } from "@/lib/db";
import { getMediaFolders } from "@/lib/media-files";

export type HealthStatus = {
  status: "ok" | "error";
  service: "netflix-clone";
  version: string;
  timestamp: string;
  checks: {
    application: "ok";
    database: "ok" | "error";
    storage: "ok" | "error";
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

export async function getHealthStatus(): Promise<HealthStatus> {
  let databaseStatus: HealthStatus["checks"]["database"] = "ok";

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "error";
  }

  const { movieFolder, seriesFolder } = getMediaFolders();
  const storageChecks = await Promise.all([
    isMediaFolderWritable(movieFolder),
    isMediaFolderWritable(seriesFolder),
  ]);
  const storageStatus: HealthStatus["checks"]["storage"] = storageChecks.every(Boolean)
    ? "ok"
    : "error";

  return {
    status: databaseStatus === "ok" && storageStatus === "ok" ? "ok" : "error",
    service: "netflix-clone",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    checks: {
      application: "ok",
      database: databaseStatus,
      storage: storageStatus,
    },
  };
}
