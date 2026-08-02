/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  db: {
    $queryRaw: jest.fn(),
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/health/route";
import { publicRoutes } from "@/routes";

const mockedQueryRaw = db.$queryRaw as jest.Mock;

describe("health endpoint", () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
      version: "1.10.0",
      checks: {
        application: "ok",
        database: "ok",
      },
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
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
