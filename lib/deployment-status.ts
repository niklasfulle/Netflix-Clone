import { createPublicKey, verify } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

const MAX_STATUS_BYTES = 32 * 1024;
const MAX_PUBLIC_KEY_BYTES = 4 * 1024;
const MAX_PAYLOAD_BYTES = 16 * 1024;
const CURRENT_STATUS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUS_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const deploymentEnvironmentSchema = z.enum(["staging", "production"]);

const healthCheckSchema = z.object({
  name: z.enum(["application", "https", "monitoring"]),
  result: z.enum(["pending", "passed", "failed", "skipped"]),
  checkedAt: z.iso.datetime().nullable(),
}).strict();

export const deploymentStatusRecordSchema = z.object({
  schemaVersion: z.literal(1),
  deploymentId: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/),
  environment: deploymentEnvironmentSchema,
  applicationVersion: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z.+-]{0,63}$/),
  image: z.object({
    reference: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z./:@_-]{0,254}$/),
    identity: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  }).strict(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  publishedAt: z.iso.datetime(),
  result: z.enum(["in_progress", "succeeded", "failed", "rolled_back"]),
  migrationResult: z.enum(["pending", "succeeded", "failed", "skipped"]),
  healthChecks: z.array(healthCheckSchema).max(3),
  rollback: z.object({
    result: z.enum(["not_required", "pending", "succeeded", "failed", "not_possible"]),
    imageReference: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z./:@_-]{0,254}$/).nullable(),
  }).strict(),
  backupReference: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z._-]{0,190}\.dump$/).nullable(),
}).strict().superRefine((record, context) => {
  const active = record.result === "in_progress";
  if (active !== (record.completedAt === null)) {
    context.addIssue({
      code: "custom",
      path: ["completedAt"],
      message: "Completion timestamp does not match the deployment result",
    });
  }
  if (record.environment === "production" && record.backupReference?.includes("staging")) {
    context.addIssue({
      code: "custom",
      path: ["backupReference"],
      message: "Production cannot reference a staging backup",
    });
  }
});

const signedEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  keyId: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/),
  payloadBase64: z.string().max(Math.ceil(MAX_PAYLOAD_BYTES * 4 / 3) + 4),
  signatureBase64: z.string().max(128),
}).strict();

export type DeploymentEnvironment = z.infer<typeof deploymentEnvironmentSchema>;
export type DeploymentStatusRecord = z.infer<typeof deploymentStatusRecordSchema>;
export type DeploymentStatusFailureCode =
  | "STATUS_UNAVAILABLE"
  | "KEY_UNAVAILABLE"
  | "ENVELOPE_INVALID"
  | "SIGNATURE_INVALID"
  | "PAYLOAD_INVALID"
  | "KEY_ID_MISMATCH"
  | "ENVIRONMENT_MISMATCH";

export type DeploymentStatusSummary = {
  environment: DeploymentEnvironment;
  trust: "verified" | "tampered" | "unavailable";
  freshness: "current" | "stale" | "unknown";
  failureCode: DeploymentStatusFailureCode | null;
  record: DeploymentStatusRecord | null;
};

type ReadDeploymentStatusOptions = {
  root?: string;
  now?: Date;
};

type GetDeploymentStatusOverviewOptions = ReadDeploymentStatusOptions & {
  localEnvironment?: DeploymentEnvironment;
  approvedPeers?: DeploymentEnvironment[];
};

export type DeploymentStatusOverview = {
  schemaVersion: 1;
  checkedAt: string;
  localEnvironment: DeploymentEnvironment;
  environments: DeploymentStatusSummary[];
};

export class DeploymentStatusConfigurationError extends Error {
  constructor() {
    super("Deployment status is not configured for this environment");
    this.name = "DeploymentStatusConfigurationError";
  }
}

const DEFAULT_STATUS_ROOT = "/deployment-status";

async function readBoundedRegularFile(filePath: string, maximumBytes: number): Promise<Buffer> {
  const metadata = await fs.lstat(filePath);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 1 || metadata.size > maximumBytes) {
    throw new Error("Invalid bounded file");
  }
  return fs.readFile(filePath);
}

function decodeBase64(value: string, maximumBytes: number): Buffer | null {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return null;
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.length < 1 || decoded.length > maximumBytes || decoded.toString("base64") !== value) {
    return null;
  }
  return decoded;
}

function unavailable(
  environment: DeploymentEnvironment,
  failureCode: "STATUS_UNAVAILABLE" | "KEY_UNAVAILABLE",
): DeploymentStatusSummary {
  return { environment, trust: "unavailable", freshness: "unknown", failureCode, record: null };
}

function tampered(
  environment: DeploymentEnvironment,
  failureCode: Exclude<DeploymentStatusFailureCode, "STATUS_UNAVAILABLE" | "KEY_UNAVAILABLE">,
): DeploymentStatusSummary {
  return { environment, trust: "tampered", freshness: "unknown", failureCode, record: null };
}

function freshness(record: DeploymentStatusRecord, now: Date): "current" | "stale" {
  const ageMs = now.getTime() - Date.parse(record.publishedAt);
  const maximumAge = record.result === "in_progress"
    ? ACTIVE_STATUS_MAX_AGE_MS
    : CURRENT_STATUS_MAX_AGE_MS;
  return ageMs < -MAX_CLOCK_SKEW_MS || ageMs > maximumAge ? "stale" : "current";
}

export async function readDeploymentStatus(
  environment: DeploymentEnvironment,
  options: ReadDeploymentStatusOptions = {},
): Promise<DeploymentStatusSummary> {
  const root = options.root ?? process.env.DEPLOYMENT_STATUS_ROOT ?? DEFAULT_STATUS_ROOT;
  const recordPath = path.join(root, "records", `${environment}.json`);
  const keyPath = path.join(root, "trusted-keys", `${environment}.pem`);

  let statusBytes: Buffer;
  try {
    statusBytes = await readBoundedRegularFile(recordPath, MAX_STATUS_BYTES);
  } catch {
    return unavailable(environment, "STATUS_UNAVAILABLE");
  }

  let envelope: z.infer<typeof signedEnvelopeSchema>;
  try {
    envelope = signedEnvelopeSchema.parse(JSON.parse(statusBytes.toString("utf8")));
  } catch {
    return tampered(environment, "ENVELOPE_INVALID");
  }
  if (envelope.keyId !== `${environment}-host-v1`) {
    return tampered(environment, "KEY_ID_MISMATCH");
  }

  const payload = decodeBase64(envelope.payloadBase64, MAX_PAYLOAD_BYTES);
  const signature = decodeBase64(envelope.signatureBase64, 64);
  if (payload === null || signature?.length !== 64) {
    return tampered(environment, "ENVELOPE_INVALID");
  }

  let publicKey: ReturnType<typeof createPublicKey>;
  try {
    const publicKeyBytes = await readBoundedRegularFile(keyPath, MAX_PUBLIC_KEY_BYTES);
    publicKey = createPublicKey(publicKeyBytes);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      return unavailable(environment, "KEY_UNAVAILABLE");
    }
  } catch {
    return unavailable(environment, "KEY_UNAVAILABLE");
  }

  if (!verify(null, payload, publicKey, signature)) {
    return tampered(environment, "SIGNATURE_INVALID");
  }

  let record: DeploymentStatusRecord;
  try {
    record = deploymentStatusRecordSchema.parse(JSON.parse(payload.toString("utf8")));
  } catch {
    return tampered(environment, "PAYLOAD_INVALID");
  }
  if (record.environment !== environment) {
    return tampered(environment, "ENVIRONMENT_MISMATCH");
  }

  return {
    environment,
    trust: "verified",
    freshness: freshness(record, options.now ?? new Date()),
    failureCode: null,
    record,
  };
}

function configuredEnvironment(value: unknown): DeploymentEnvironment {
  const parsed = deploymentEnvironmentSchema.safeParse(value);
  if (!parsed.success) {
    throw new DeploymentStatusConfigurationError();
  }
  return parsed.data;
}

function configuredPeers(value: string | undefined): DeploymentEnvironment[] {
  if (!value) return [];
  const peers = value.split(",").map((peer) => peer.trim()).filter(Boolean);
  const parsed = z.array(deploymentEnvironmentSchema).max(2).safeParse(peers);
  if (!parsed.success) {
    throw new DeploymentStatusConfigurationError();
  }
  return parsed.data;
}

export async function getDeploymentStatusOverview(
  options: GetDeploymentStatusOverviewOptions = {},
): Promise<DeploymentStatusOverview> {
  const localEnvironment = options.localEnvironment
    ?? configuredEnvironment(process.env.DEPLOYMENT_ENVIRONMENT);
  const approvedPeers = options.approvedPeers
    ?? configuredPeers(process.env.DEPLOYMENT_STATUS_APPROVED_PEERS);
  const environments = [
    localEnvironment,
    ...approvedPeers.filter((environment) => environment !== localEnvironment),
  ].filter((environment, index, values) => values.indexOf(environment) === index);
  const now = options.now ?? new Date();

  return {
    schemaVersion: 1,
    checkedAt: now.toISOString(),
    localEnvironment,
    environments: await Promise.all(environments.map((environment) =>
      readDeploymentStatus(environment, { root: options.root, now })
    )),
  };
}
