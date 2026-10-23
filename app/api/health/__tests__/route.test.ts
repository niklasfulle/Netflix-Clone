/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  db: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock("node:fs/promises", () => ({
  access: jest.fn(),
}));

jest.mock("@/lib/redis/runtime", () => ({
  getRedisRuntime: jest.fn(),
}));

jest.mock("@/lib/deployment-update-policy", () => ({
  DEFAULT_DEPLOYMENT_UPDATE_POLICY: { automaticReloadEnabled: true },
  deploymentUpdatePolicy: { read: jest.fn() },
}));

const mockedRedisHealth = jest.fn();

import { access } from "node:fs/promises";
import path from 'node:path';
import { db } from "@/lib/db";
import { deploymentUpdatePolicy } from "@/lib/deployment-update-policy";
import { getRedisRuntime } from "@/lib/redis/runtime";
import { GET } from "@/app/api/health/route";
import { publicRoutes } from "@/routes";
import packageJson from "@/package.json";

const mockedQueryRaw = db.$queryRaw as jest.Mock;
const mockedReadUpdatePolicy = deploymentUpdatePolicy.read as jest.Mock;
const mockedAccess = access as jest.Mock;
const mockedGetRedisRuntime = getRedisRuntime as jest.Mock;

describe("health endpoint", () => {
  it.each([
    { failure: { code: 'ENOENT' }, expectedStatus: 200, storage: 'ok' },
    { failure: { code: 'EACCES' }, expectedStatus: 503, storage: 'error' },
    { failure: null, expectedStatus: 503, storage: 'error' },
    { failure: 'unavailable', expectedStatus: 503, storage: 'error' },
    { failure: {}, expectedStatus: 503, storage: 'error' },
  ])('classifies a temp-folder access failure safely: $failure', async ({ failure, expectedStatus, storage }) => {
    mockedQueryRaw.mockResolvedValue([]);
    mockedAccess.mockImplementation(async folder => { if (path.basename(String(folder)) === 'temp') throw failure; });
    const response = await GET();
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toMatchObject({ checks: { storage } });
  });

  it('keeps the application healthy when optional Redis and update-policy checks reject', async () => {
    mockedQueryRaw.mockResolvedValue([]);
    mockedAccess.mockResolvedValue(undefined);
    mockedRedisHealth.mockRejectedValue(new Error('Redis unavailable'));
    mockedReadUpdatePolicy.mockRejectedValue(new Error('Policy unavailable'));
    delete process.env.DEPLOYMENT_ENVIRONMENT;
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ environment: 'development', checks: { redis: 'degraded' }, deploymentUpdates: { automaticReloadEnabled: true } });
  });

  it('classifies a closed Redis connection as degraded without taking the application offline', async () => {
    mockedQueryRaw.mockResolvedValue([]); mockedAccess.mockResolvedValue(undefined);
    mockedRedisHealth.mockResolvedValue({ status: 'closed' });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ checks: { redis: 'degraded' } });
  });
  const originalDeploymentEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEPLOYMENT_ENVIRONMENT = "staging";
    mockedGetRedisRuntime.mockReturnValue({ health: mockedRedisHealth });
    mockedRedisHealth.mockResolvedValue({ status: "disabled" });
    mockedReadUpdatePolicy.mockResolvedValue({ automaticReloadEnabled: true });
  });

  afterAll(() => {
    if (originalDeploymentEnvironment === undefined) {
      delete process.env.DEPLOYMENT_ENVIRONMENT;
    } else {
      process.env.DEPLOYMENT_ENVIRONMENT = originalDeploymentEnvironment;
    }
  });

  it("reports a healthy application and database", async () => {
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      status: "ok",
      service: "netflix-clone",
      version: packageJson.version,
      environment: "staging",
      deploymentUpdates: { automaticReloadEnabled: true },
      checks: {
        application: "ok",
        database: "ok",
        storage: "ok",
        redis: "disabled",
      },
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it("publishes a globally disabled automatic reload policy", async () => {
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockedReadUpdatePolicy.mockResolvedValue({ automaticReloadEnabled: false });

    const response = await GET();

    expect(await response.json()).toMatchObject({
      deploymentUpdates: { automaticReloadEnabled: false },
    });
  });

  it("reports optional Redis degradation without taking the application offline", async () => {
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockedRedisHealth.mockResolvedValue({ status: "degraded" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      checks: { redis: "degraded" },
    });
  });

  it("returns 503 without exposing paths when media storage is not writable", async () => {
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockedAccess.mockRejectedValueOnce(Object.assign(new Error("/movies/temp denied"), {
      code: "EACCES",
    }));

    const response = await GET();
    const serializedBody = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(serializedBody).toContain('"storage":"error"');
    expect(serializedBody).not.toContain("/movies");
    expect(serializedBody).not.toContain("denied");
  });

  it("returns 503 without exposing database error details", async () => {
    mockedQueryRaw.mockRejectedValue(new Error("database credentials leaked"));

    const response = await GET();
    const serializedBody = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(serializedBody).toContain('"database":"error"');
    expect(serializedBody).not.toContain("credentials");
  });

  it("keeps health and changelog routes publicly accessible", () => {
    expect(publicRoutes).toEqual(
      expect.arrayContaining(["/api/health", "/health", "/changelog"]),
    );
  });
});
