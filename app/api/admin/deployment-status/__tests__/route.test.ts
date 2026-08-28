/** @jest-environment node */

jest.mock("@/lib/admin-auth", () => ({
  isCurrentUserAdmin: jest.fn(),
}));
jest.mock("@/lib/backup-verification", () => ({
  readScheduledBackupStatus: jest.fn(),
}));

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { readScheduledBackupStatus } from "@/lib/backup-verification";
import { GET } from "../route";

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<
  typeof isCurrentUserAdmin
>;
const mockedReadScheduled = readScheduledBackupStatus as jest.MockedFunction<
  typeof readScheduledBackupStatus
>;

describe("admin deployment status API", () => {
  const originalEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;
  const originalPeers = process.env.DEPLOYMENT_STATUS_APPROVED_PEERS;
  const originalRoot = process.env.DEPLOYMENT_STATUS_ROOT;

  beforeEach(() => {
    jest.resetAllMocks();
    mockedReadScheduled.mockResolvedValue(null);
    process.env.DEPLOYMENT_ENVIRONMENT = "staging";
    process.env.DEPLOYMENT_STATUS_APPROVED_PEERS = "production";
    process.env.DEPLOYMENT_STATUS_ROOT = "/missing-deployment-status";
  });

  afterAll(() => {
    process.env.DEPLOYMENT_ENVIRONMENT = originalEnvironment;
    process.env.DEPLOYMENT_STATUS_APPROVED_PEERS = originalPeers;
    process.env.DEPLOYMENT_STATUS_ROOT = originalRoot;
  });

  it("does not disclose deployment status to non-administrators", async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("returns bounded local and approved peer summaries without caching", async () => {
    mockedIsAdmin.mockResolvedValue(true);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      localEnvironment: "staging",
      scheduledBackup: null,
      environments: [
        {
          environment: "staging",
          trust: "unavailable",
          failureCode: "STATUS_UNAVAILABLE",
          record: null,
        },
        {
          environment: "production",
          trust: "unavailable",
          failureCode: "STATUS_UNAVAILABLE",
          record: null,
        },
      ],
    });
  });

  it("includes bounded local scheduled-backup evidence", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedReadScheduled.mockResolvedValue({
      schemaVersion: 1,
      requestId: null,
      environment: "staging",
      backupName: "scheduled-staging-20260820T031500Z.dump",
      status: "FAILED",
      diagnosticCode: "BACKUP_TIMEOUT",
      checksumSha256: null,
      completedAt: "2026-08-20T03:30:00.000Z",
    });

    const response = await GET();
    expect(await response.json()).toMatchObject({
      scheduledBackup: {
        environment: "staging",
        status: "FAILED",
        diagnosticCode: "BACKUP_TIMEOUT",
      },
    });
  });

  it("fails closed when the deployment environment is not configured", async () => {
    mockedIsAdmin.mockResolvedValue(true);
    process.env.DEPLOYMENT_ENVIRONMENT = "development";

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Deployment status is unavailable",
    });
  });
});
