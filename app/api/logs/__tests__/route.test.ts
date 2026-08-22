/** @jest-environment node */

import { NextRequest } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { backendLogStore } from "@/lib/log-store";

import { GET } from "../route";

jest.mock("@/lib/admin-auth", () => ({
  isCurrentUserAdmin: jest.fn(),
}));

jest.mock("@/lib/log-store", () => ({
  backendLogStore: {
    query: jest.fn(),
    iterate: jest.fn(),
  },
}));

const mockIsCurrentUserAdmin = isCurrentUserAdmin as jest.MockedFunction<
  typeof isCurrentUserAdmin
>;
const mockQuery = backendLogStore.query as jest.MockedFunction<
  typeof backendLogStore.query
>;

describe("GET /api/logs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCurrentUserAdmin.mockResolvedValue(true);
    mockQuery.mockResolvedValue({
      logs: [{ category: "authentication", action: "auth.login.started" }],
      total: 1,
      counts: { info: 1 },
    });
  });

  it("returns only authentication logs when the category is requested", async () => {
    const response = await GET(new NextRequest(
      "http://localhost/api/logs?category=authentication&page=1&pageSize=20",
    ));

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      category: "authentication",
    }));
    await expect(response.json()).resolves.toMatchObject({
      source: "authentication",
      total: 1,
    });
  });
});
