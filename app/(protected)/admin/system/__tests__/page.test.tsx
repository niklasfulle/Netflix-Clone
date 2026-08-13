import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";

import AdminSystemPage from "../page";

jest.mock("swr");
const mockedUseSWR = useSWR as jest.Mock;

const healthyOverview = {
  status: "healthy",
  version: "1.11.0",
  checkedAt: "2026-07-29T12:00:30.000Z",
  agent: {
    status: "ok",
    lastSeenAt: "2026-07-29T12:00:20.000Z",
    ageSeconds: 10,
    version: "1.0.0",
  },
  host: {
    hostname: "netflix",
    platform: "Linux",
    platformRelease: "6.8.0",
    architecture: "x86_64",
    uptimeSeconds: 90_000,
  },
  cpu: {
    usagePercent: 12.5,
    loadAverage: { oneMinute: 0.2, fiveMinutes: 0.3, fifteenMinutes: 0.4 },
    logicalCores: 4,
  },
  memory: {
    totalBytes: 8_000_000_000,
    usedBytes: 4_000_000_000,
    availableBytes: 4_000_000_000,
    usedPercent: 50,
    swapTotalBytes: 0,
    swapUsedBytes: 0,
  },
  filesystems: [
    {
      label: "movies",
      path: "/movies",
      available: true,
      totalBytes: 100_000,
      usedBytes: 40_000,
      freeBytes: 60_000,
      usedPercent: 40,
      freePercent: 60,
      writable: true,
    },
  ],
  docker: {
    available: true,
    container: {
      name: "netflix-clone",
      status: "running",
      health: "healthy",
      startedAt: "2026-07-29T11:00:00.000Z",
      restartCount: 0,
      image: "salkin263/netflix-clone:1.11.0",
      imageId: "abc",
      cpuPercent: 2,
      memoryUsedBytes: 500_000_000,
      memoryLimitBytes: 2_000_000_000,
      memoryPercent: 25,
      pids: 20,
    },
  },
  backup: {
    createdAt: "2026-07-29T10:00:00.000Z",
    sizeBytes: 2048,
    records: 42,
  },
  database: { status: "ok", latencyMs: 18 },
  alerts: [],
};

describe("admin system page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders live host, storage, runtime, and recovery information", () => {
    mockedUseSWR.mockReturnValue({
      data: healthyOverview,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(
      screen.getByRole("heading", { name: "System Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All systems operational")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("18 ms")).toBeInTheDocument();
    expect(screen.getByText("/movies")).toBeInTheDocument();
    expect(screen.getByText("salkin263/netflix-clone:1.11.0")).toBeInTheDocument();
    expect(screen.getByText("No active alerts.")).toBeInTheDocument();
  });

  it("refreshes the system data on demand", () => {
    const mutate = jest.fn();
    mockedUseSWR.mockReturnValue({
      data: healthyOverview,
      error: undefined,
      isLoading: false,
      mutate,
    });

    render(<AdminSystemPage />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("renders API failures", () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      error: new Error("The system overview could not be loaded."),
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The system overview could not be loaded.",
    );
  });

  it("renders a loading state", () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(
      screen.getByLabelText("System metrics are loading"),
    ).toBeInTheDocument();
  });

  it("renders unavailable resources and active alerts", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        ...healthyOverview,
        status: "critical",
        cpu: null,
        memory: null,
        host: null,
        filesystems: [
          {
            label: "missing",
            path: "/missing",
            available: false,
          },
          {
            label: "critical",
            path: "/critical",
            available: true,
            totalBytes: 100,
            usedBytes: 95,
            freeBytes: 5,
            usedPercent: 95,
            freePercent: 5,
            writable: true,
          },
          {
            label: "warning",
            path: "/warning",
            available: true,
            totalBytes: 100,
            usedBytes: 85,
            freeBytes: 15,
            usedPercent: 85,
            freePercent: 15,
            writable: true,
          },
        ],
        docker: { available: false, container: null },
        backup: null,
        database: { status: "error", latencyMs: null },
        alerts: [
          {
            id: "critical-alert",
            severity: "critical",
            title: "Critical alert",
            message: "A critical condition was detected.",
          },
          {
            id: "warning-alert",
            severity: "warning",
            title: "Warning alert",
            message: "A warning condition was detected.",
          },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(screen.getByText("Critical issues detected")).toBeInTheDocument();
    expect(screen.getByText("Critical alert")).toBeInTheDocument();
    expect(screen.getByText("Warning alert")).toBeInTheDocument();
    expect(screen.getByText("No backup recorded")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
  });

  it("renders the warning presentation and empty storage state", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        ...healthyOverview,
        status: "warning",
        host: {
          ...healthyOverview.host,
          uptimeSeconds: 3_600,
        },
        filesystems: [],
        alerts: [],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(screen.getByText("Warnings detected")).toBeInTheDocument();
    expect(screen.getByText("Monitoring agent unavailable")).toBeInTheDocument();
  });
});
