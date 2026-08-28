import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";

import { DeploymentStatusPanel } from "@/components/admin/DeploymentStatusPanel";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

jest.mock("swr");
const mockedUseSWR = useSWR as jest.Mock;

const record = {
  schemaVersion: 1,
  deploymentId: "staging-1.12.0-20260815",
  environment: "staging",
  applicationVersion: "1.12.0",
  image: {
    reference: "salkin263/netflix-clone:1.12.0",
    identity: `sha256:${"a".repeat(64)}`,
  },
  startedAt: "2026-08-15T11:55:00.000Z",
  completedAt: "2026-08-15T12:00:00.000Z",
  publishedAt: "2026-08-15T12:00:00.000Z",
  result: "succeeded",
  migrationResult: "succeeded",
  healthChecks: [
    { name: "application", result: "passed", checkedAt: "2026-08-15T12:00:00.000Z" },
    { name: "https", result: "passed", checkedAt: "2026-08-15T12:00:00.000Z" },
    { name: "monitoring", result: "passed", checkedAt: "2026-08-15T12:00:00.000Z" },
  ],
  rollback: { result: "not_required", imageReference: null },
  backupReference: "pre-1.12.0.dump",
};

describe("deployment status panel", () => {
  beforeEach(() => jest.resetAllMocks());

  it("shows verified local deployment evidence and approved peer failures", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-15T12:05:00.000Z",
        localEnvironment: "staging",
        scheduledBackup: {
          schemaVersion: 1,
          environment: "staging",
          backupName: "scheduled-staging-20260820T031500Z.dump",
          status: "FAILED",
          diagnosticCode: "BACKUP_TIMEOUT",
          checksumSha256: null,
          completedAt: "2026-08-20T03:30:00.000Z",
        },
        environments: [
          {
            environment: "staging",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record,
          },
          {
            environment: "production",
            trust: "unavailable",
            freshness: "unknown",
            failureCode: "STATUS_UNAVAILABLE",
            record: null,
          },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<DeploymentStatusPanel />);

    expect(screen.getByRole("heading", { name: "Deployment Status" })).toBeInTheDocument();
    expect(screen.getByText("STAGING · LOCAL")).toBeInTheDocument();
    expect(screen.getByText("Verified deployment")).toBeInTheDocument();
    expect(screen.getByText("salkin263/netflix-clone:1.12.0")).toBeInTheDocument();
    expect(screen.getByText("PRODUCTION · PEER")).toBeInTheDocument();
    expect(screen.getByText("Status unavailable")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Scheduled backup failed");
    expect(screen.getByRole("alert")).toHaveTextContent("BACKUP_TIMEOUT");
  });

  it("renders deployment evidence in German", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-15T12:05:00.000Z",
        localEnvironment: "staging",
        scheduledBackup: {
          schemaVersion: 1,
          environment: "staging",
          backupName: "scheduled-staging-20260820T031500Z.dump",
          status: "FAILED",
          diagnosticCode: "BACKUP_TIMEOUT",
          checksumSha256: null,
          completedAt: "2026-08-20T03:30:00.000Z",
        },
        environments: [
          {
            environment: "staging",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record,
          },
          {
            environment: "production",
            trust: "unavailable",
            freshness: "unknown",
            failureCode: "STATUS_UNAVAILABLE",
            record: null,
          },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(
      <LanguageProvider initialLocale="de">
        <DeploymentStatusPanel />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Deployment-Status" })).toBeInTheDocument();
    expect(screen.getByText("STAGING · LOKAL")).toBeInTheDocument();
    expect(screen.getByText("Verifiziertes Deployment")).toBeInTheDocument();
    expect(screen.getByText("PRODUCTION · GEGENSTELLE")).toBeInTheDocument();
    expect(screen.getByText("Status nicht verfügbar")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Geplantes Backup fehlgeschlagen");
    expect(screen.getByText("nicht erforderlich")).toBeInTheDocument();
    expect(screen.getAllByText(/bestanden/)).toHaveLength(3);
    expect(screen.queryByText("Deployment Status")).not.toBeInTheDocument();
  });

  it("never presents stale or tampered data as successful", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-16T12:05:00.000Z",
        localEnvironment: "staging",
        environments: [
          { environment: "staging", trust: "verified", freshness: "stale", failureCode: null, record },
          { environment: "production", trust: "tampered", freshness: "unknown", failureCode: "SIGNATURE_INVALID", record: null },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<DeploymentStatusPanel />);

    expect(screen.getByText("Signed status is stale")).toBeInTheDocument();
    expect(screen.getByText("Signature verification failed")).toBeInTheDocument();
    expect(screen.queryByText("All deployments verified")).not.toBeInTheDocument();
  });

  it("refreshes deployment evidence independently", () => {
    const mutate = jest.fn();
    mockedUseSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: true, mutate });

    render(<DeploymentStatusPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh deployment status" }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("highlights version drift and incomplete promotion evidence with bounded diagnostics", () => {
    mockedUseSWR.mockReturnValue({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-15T12:05:00.000Z",
        localEnvironment: "staging",
        environments: [
          {
            environment: "staging",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record,
          },
          {
            environment: "production",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record: {
              ...record,
              environment: "production",
              applicationVersion: "1.11.0",
              backupReference: null,
            },
          },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<DeploymentStatusPanel />);

    expect(screen.getByRole("alert")).toHaveTextContent("Version drift detected");
    expect(screen.getByRole("alert")).toHaveTextContent("Promotion evidence incomplete");
    expect(screen.getByRole("link", { name: "Open system diagnostics" }))
      .toHaveAttribute("href", "/admin/system");
    expect(screen.getByRole("link", { name: "Open backup evidence" }))
      .toHaveAttribute("href", "/admin/backups");
    expect(screen.getByRole("link", { name: "Open container logs" }))
      .toHaveAttribute("href", "/admin/logs");
  });

  it("renders failed, rolled-back, and empty states without presenting them as healthy", () => {
    mockedUseSWR.mockReturnValueOnce({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-15T12:05:00.000Z",
        localEnvironment: "staging",
        environments: [
          {
            environment: "staging",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record: { ...record, result: "failed" },
          },
          {
            environment: "production",
            trust: "verified",
            freshness: "current",
            failureCode: null,
            record: { ...record, environment: "production", result: "rolled_back" },
          },
        ],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { unmount } = render(<DeploymentStatusPanel />);
    expect(screen.getByText("Deployment failed")).toBeInTheDocument();
    expect(screen.getByText("Deployment rolled back")).toBeInTheDocument();
    expect(screen.queryByText("Verified deployment")).not.toBeInTheDocument();
    unmount();

    mockedUseSWR.mockReturnValue({
      data: {
        schemaVersion: 1,
        checkedAt: "2026-08-15T12:05:00.000Z",
        localEnvironment: "staging",
        environments: [],
      },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });
    render(<DeploymentStatusPanel />);
    expect(screen.getByText("No deployment environments are configured.")).toBeInTheDocument();
  });
});
