/** @jest-environment node */

import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  getDeploymentStatusOverview,
  readDeploymentStatus,
} from "@/lib/deployment-status";

const verifiedRecord = {
  schemaVersion: 1 as const,
  deploymentId: "deployment-20260815-120000",
  environment: "staging" as const,
  applicationVersion: "1.12.0-rc.1",
  image: {
    reference: "salkin263/netflix-clone:1.12.0-rc.1",
    identity: `sha256:${"a".repeat(64)}`,
  },
  startedAt: "2026-08-15T11:55:00.000Z",
  completedAt: "2026-08-15T12:00:00.000Z",
  publishedAt: "2026-08-15T12:00:00.000Z",
  result: "succeeded" as const,
  migrationResult: "succeeded" as const,
  healthChecks: [
    {
      name: "application" as const,
      result: "passed" as const,
      checkedAt: "2026-08-15T11:59:30.000Z",
    },
  ],
  rollback: {
    result: "not_required" as const,
    imageReference: null,
  },
  backupReference: "pre-1.12.0-rc.1.dump",
};

async function writeSignedRecord(
  root: string,
  fileEnvironment: "staging" | "production" = "staging",
  payloadEnvironment: "staging" | "production" = fileEnvironment,
  overrides: Record<string, unknown> = {},
) {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const payload = Buffer.from(JSON.stringify({
    ...verifiedRecord,
    ...overrides,
    environment: payloadEnvironment,
  }), "utf8");
  const envelope = {
    schemaVersion: 1,
    keyId: `${fileEnvironment}-host-v1`,
    payloadBase64: payload.toString("base64"),
    signatureBase64: sign(null, payload, privateKey).toString("base64"),
  };

  await mkdir(path.join(root, "records"), { recursive: true });
  await mkdir(path.join(root, "trusted-keys"), { recursive: true });
  await writeFile(
    path.join(root, "records", `${fileEnvironment}.json`),
    JSON.stringify(envelope),
    "utf8",
  );
  await writeFile(
    path.join(root, "trusted-keys", `${fileEnvironment}.pem`),
    publicKey.export({ format: "pem", type: "spki" }),
    "utf8",
  );
}

describe("signed deployment status", () => {
  it("returns a current record only after its host signature is verified", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root);

      await expect(
        readDeploymentStatus("staging", {
          root,
          now: new Date("2026-08-15T12:05:00.000Z"),
        }),
      ).resolves.toMatchObject({
        environment: "staging",
        trust: "verified",
        freshness: "current",
        failureCode: null,
        record: {
          deploymentId: "deployment-20260815-120000",
          result: "succeeded",
          migrationResult: "succeeded",
          backupReference: "pre-1.12.0-rc.1.dump",
        },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not expose a record when its signed payload is changed", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root);
      const statusPath = path.join(root, "records", "staging.json");
      const envelope = JSON.parse(await readFile(statusPath, "utf8"));
      const payload = JSON.parse(Buffer.from(envelope.payloadBase64, "base64").toString("utf8"));
      payload.result = "failed";
      envelope.payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
      await writeFile(statusPath, JSON.stringify(envelope), "utf8");

      await expect(readDeploymentStatus("staging", { root })).resolves.toEqual({
        environment: "staging",
        trust: "tampered",
        freshness: "unknown",
        failureCode: "SIGNATURE_INVALID",
        record: null,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects an envelope presented under a different host key identity", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root);
      const statusPath = path.join(root, "records", "staging.json");
      const envelope = JSON.parse(await readFile(statusPath, "utf8"));
      envelope.keyId = "production-host-v1";
      await writeFile(statusPath, JSON.stringify(envelope), "utf8");

      await expect(readDeploymentStatus("staging", { root })).resolves.toMatchObject({
        trust: "tampered",
        failureCode: "KEY_ID_MISMATCH",
        record: null,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("distinguishes stale signed data from unavailable data", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root);

      await expect(
        readDeploymentStatus("staging", {
          root,
          now: new Date("2026-08-16T12:00:01.000Z"),
        }),
      ).resolves.toMatchObject({ trust: "verified", freshness: "stale" });
      await expect(readDeploymentStatus("production", { root })).resolves.toEqual({
        environment: "production",
        trust: "unavailable",
        freshness: "unknown",
        failureCode: "STATUS_UNAVAILABLE",
        record: null,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("marks an abandoned in-progress deployment stale after thirty minutes", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root, "staging", "staging", {
        result: "in_progress",
        completedAt: null,
        publishedAt: "2026-08-15T12:00:00.000Z",
      });

      await expect(readDeploymentStatus("staging", {
        root,
        now: new Date("2026-08-15T12:30:01.000Z"),
      })).resolves.toMatchObject({
        trust: "verified",
        freshness: "stale",
        record: { result: "in_progress" },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects oversized status files before parsing them", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await mkdir(path.join(root, "records"), { recursive: true });
      await writeFile(path.join(root, "records", "staging.json"), "x".repeat(32 * 1024 + 1));

      await expect(readDeploymentStatus("staging", { root })).resolves.toMatchObject({
        trust: "unavailable",
        failureCode: "STATUS_UNAVAILABLE",
        record: null,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a signed staging record presented as production", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root, "production", "staging");

      await expect(readDeploymentStatus("production", { root })).resolves.toEqual({
        environment: "production",
        trust: "tampered",
        freshness: "unknown",
        failureCode: "ENVIRONMENT_MISMATCH",
        record: null,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns only the local and explicitly approved peer environments", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "netflix-deployment-status-"));
    try {
      await writeSignedRecord(root, "staging");
      await writeSignedRecord(root, "production");

      await expect(getDeploymentStatusOverview({
        root,
        localEnvironment: "staging",
        approvedPeers: ["production"],
        now: new Date("2026-08-15T12:05:00.000Z"),
      })).resolves.toMatchObject({
        schemaVersion: 1,
        localEnvironment: "staging",
        environments: [
          { environment: "staging", trust: "verified" },
          { environment: "production", trust: "verified" },
        ],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
