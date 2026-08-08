/** @jest-environment node */

jest.mock("@/lib/admin-auth", () => ({
  isCurrentUserAdmin: jest.fn(),
}));
jest.mock("@/lib/container-log-store", () => ({
  containerLogStore: { query: jest.fn(), iterate: jest.fn() },
}));

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { containerLogStore } from "@/lib/container-log-store";
import { GET } from "../route";

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedQuery = containerLogStore.query as jest.Mock;

describe("admin container logs API", () => {
  beforeEach(() => jest.resetAllMocks());

  it("rejects non-admin requests", async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/admin/container-logs"));

    expect(response.status).toBe(403);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("returns bounded filtered container logs without caching", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedQuery.mockResolvedValue({
      available: true,
      logs: [{ timestamp: "2026-08-08T12:00:00.000Z", level: "error", message: "failed" }],
      total: 1,
      totalPages: 1,
      counts: { error: 1 },
      collectedAt: "2026-08-08T12:00:05.000Z",
    });

    const response = await GET(new Request(
      "http://localhost/api/admin/container-logs?page=2&pageSize=500&level=error&search=failed",
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockedQuery).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      pageSize: 100,
      level: "error",
      search: "failed",
    }));
    expect(await response.json()).toMatchObject({ source: "container", available: true, total: 1 });
  });
});
