/** @jest-environment node */

jest.mock("@/lib/admin-auth", () => ({
  isCurrentUserAdmin: jest.fn(),
}));
jest.mock("@/lib/system-monitor", () => ({
  getSystemOverview: jest.fn(),
}));

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { getSystemOverview } from "@/lib/system-monitor";
import { GET } from "../route";

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<
  typeof isCurrentUserAdmin
>;
const mockedGetOverview = getSystemOverview as jest.MockedFunction<
  typeof getSystemOverview
>;

describe("admin system API", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("rejects non-admin requests", async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockedGetOverview).not.toHaveBeenCalled();
  });

  it("returns an uncached system overview to administrators", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedGetOverview.mockResolvedValue({
      status: "healthy",
      version: "1.10.1",
      checkedAt: "2026-07-29T12:00:00.000Z",
      agent: {
        status: "ok",
        lastSeenAt: "2026-07-29T12:00:00.000Z",
        ageSeconds: 0,
        version: "1.0.0",
      },
      host: null,
      cpu: null,
      memory: null,
      filesystems: [],
      docker: null,
      backup: null,
      database: { status: "ok", latencyMs: 20 },
      redis: {
        status: "ok",
        configured: true,
        connected: true,
        circuit: "closed",
        metrics: {
          commands: 1,
          hits: 0,
          misses: 0,
          errors: 0,
          timeouts: 0,
          reconnects: 0,
          fallbacks: 0,
          totalLatencyMs: 2,
        },
      },
      alerts: [],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      status: "healthy",
      version: "1.10.1",
      database: { status: "ok" },
      redis: { status: "ok", connected: true },
    });
  });
});
