import { render, screen } from "@testing-library/react";

import HealthPage from "../page";
import { getHealthStatus } from "@/lib/health";

jest.mock("@/lib/health", () => ({
  getHealthStatus: jest.fn(),
}));

const mockedGetHealthStatus = getHealthStatus as jest.MockedFunction<
  typeof getHealthStatus
>;

describe("health page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders an operational application and database", async () => {
    mockedGetHealthStatus.mockResolvedValue({
      status: "ok",
      service: "netflix-clone",
      version: "1.10.1",
      timestamp: "2026-07-29T22:00:00.000Z",
      checks: {
        application: "ok",
        database: "ok",
        storage: "ok",
      },
    });

    render(await HealthPage());

    expect(
      screen.getByRole("heading", { name: "System Health" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All systems operational")).toBeInTheDocument();
    expect(screen.getAllByText("Operational")).toHaveLength(3);
    expect(screen.getByText("1.10.1")).toBeInTheDocument();
  });

  it("renders failed health checks", async () => {
    mockedGetHealthStatus.mockResolvedValue({
      status: "error",
      service: "netflix-clone",
      version: "1.10.1",
      timestamp: "2026-07-29T22:00:00.000Z",
      checks: {
        application: "ok",
        database: "error",
        storage: "ok",
      },
    });

    render(await HealthPage());

    expect(screen.getByText("Issue detected")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
