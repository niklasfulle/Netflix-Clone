/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  db: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock("node:fs/promises", () => ({
  access: jest.fn(),
}));

import { access } from "node:fs/promises";
import { db } from "@/lib/db";
import { GET } from "@/app/api/health/route";
import { publicRoutes } from "@/routes";
import packageJson from "@/package.json";

const mockedQueryRaw = db.$queryRaw as jest.Mock;
const mockedAccess = access as jest.Mock;

describe("health endpoint", () => {
  const originalDeploymentEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEPLOYMENT_ENVIRONMENT = "staging";
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
      checks: {
        application: "ok",
        database: "ok",
        storage: "ok",
      },
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
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
