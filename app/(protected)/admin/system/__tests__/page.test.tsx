import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";

import { LanguageProvider } from "@/components/providers/LanguageProvider";
import AdminSystemPage from "../page";

jest.mock("@/components/admin/DeploymentStatusPanel", () => ({
  DeploymentStatusPanel: () => <section>Signed deployment evidence</section>,
}));

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
  redis: {
    status: "ok",
    configured: true,
    connected: true,
    circuit: "closed",
    metrics: {
      commands: 12,
      hits: 8,
      misses: 4,
      errors: 0,
      timeouts: 0,
      reconnects: 1,
      fallbacks: 0,
      totalLatencyMs: 30,
    },
  },
  backgroundJobs: {
    worker: { status: "healthy", state: "ACTIVE", heartbeatAgeMs: 5_000 },
    queue: { depth: 2, oldestQueuedAgeMs: 60_000 },
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
    expect(
      screen.getByRole("heading", { name: "Redis Runtime" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Cache hits / misses")).toBeInTheDocument();
    expect(screen.getByText("8 / 4")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Background Jobs" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Job Operations" })).toHaveAttribute(
      "href",
      "/admin/jobs",
    );
    expect(screen.getByText("Signed deployment evidence")).toBeInTheDocument();
    expect(screen.getByText("No active alerts.")).toBeInTheDocument();
  });

  it("renders the system overview in German", () => {
    mockedUseSWR.mockReturnValue({
      data: healthyOverview,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(
      <LanguageProvider initialLocale="de">
        <AdminSystemPage />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Systemübersicht" })).toBeInTheDocument();
    expect(screen.getByText("Alle Systeme betriebsbereit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aktualisieren" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Speicher" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Redis-Laufzeit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hintergrundaufträge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hintergrundaufträge öffnen" })).toBeInTheDocument();
    expect(screen.getByText("in Ordnung · v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("läuft · betriebsbereit")).toBeInTheDocument();
    expect(screen.getByText("AKTIV")).toBeInTheDocument();
    expect(screen.getByText("Keine aktiven Warnungen.")).toBeInTheDocument();
    expect(screen.queryByText("System Overview")).not.toBeInTheDocument();
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

  it("treats legacy responses without job health as unavailable", () => {
    const legacyOverview = { ...healthyOverview, backgroundJobs: undefined };
    mockedUseSWR.mockReturnValue({
      data: legacyOverview,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<AdminSystemPage />);

    expect(screen.getByRole("heading", { name: "Background Jobs" })).toBeInTheDocument();
    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Worker healthy")).not.toBeInTheDocument();
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
        redis: {
          ...healthyOverview.redis,
          status: "degraded",
          connected: false,
          circuit: "open",
        },
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
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
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
