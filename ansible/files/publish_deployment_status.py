#!/usr/bin/env python3
"""Publish one bounded, host-signed deployment status record atomically."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import stat
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Callable, TypedDict, Unpack


MAX_ENVELOPE_BYTES = 32 * 1024
ENVIRONMENTS = ("staging", "production")
RESULTS = ("in_progress", "succeeded", "failed", "rolled_back")
MIGRATION_RESULTS = ("pending", "succeeded", "failed", "skipped")
CHECK_RESULTS = ("pending", "passed", "failed", "skipped")
ROLLBACK_RESULTS = ("not_required", "pending", "succeeded", "failed", "not_possible")
IDENTIFIER = re.compile(r"^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$")
VERSION = re.compile(r"^[0-9A-Za-z][0-9A-Za-z.+-]{0,63}$")
IMAGE_REFERENCE = re.compile(r"^[0-9A-Za-z][0-9A-Za-z./:@_-]{0,254}$")
IMAGE_IDENTITY = re.compile(r"^sha256:[a-f0-9]{64}$")
BACKUP_REFERENCE = re.compile(r"^[0-9A-Za-z][0-9A-Za-z._-]{0,190}\.dump$")


class DeploymentRecordInput(TypedDict):
    environment: str
    deployment_id: str
    application_version: str
    image_reference: str
    image_identity: str
    started_at: str
    completed_at: str
    published_at: str
    result: str
    migration_result: str
    health_results: dict[str, str]
    rollback_result: str
    rollback_image_reference: str
    backup_reference: str


def _require(pattern: re.Pattern[str], value: str, field: str) -> str:
    if not pattern.fullmatch(value):
        raise ValueError(f"Invalid {field}")
    return value


def _timestamp(value: str, field: str) -> str:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"Invalid {field}") from error
    if parsed.tzinfo is None or len(value) > 40:
        raise ValueError(f"Invalid {field}")
    return value


def build_record(**record: Unpack[DeploymentRecordInput]) -> dict[str, object]:
    environment = record["environment"]
    deployment_id = record["deployment_id"]
    application_version = record["application_version"]
    image_reference = record["image_reference"]
    image_identity = record["image_identity"]
    started_at = record["started_at"]
    completed_at = record["completed_at"]
    published_at = record["published_at"]
    result = record["result"]
    migration_result = record["migration_result"]
    health_results = record["health_results"]
    rollback_result = record["rollback_result"]
    rollback_image_reference = record["rollback_image_reference"]
    backup_reference = record["backup_reference"]
    if environment not in ENVIRONMENTS:
        raise ValueError("Invalid environment")
    if result not in RESULTS or migration_result not in MIGRATION_RESULTS:
        raise ValueError("Invalid deployment result")
    if rollback_result not in ROLLBACK_RESULTS:
        raise ValueError("Invalid rollback result")
    if set(health_results) != {"application", "https", "monitoring"}:
        raise ValueError("Invalid health checks")
    if any(value not in CHECK_RESULTS for value in health_results.values()):
        raise ValueError("Invalid health check result")
    if (result == "in_progress") != (completed_at == ""):
        raise ValueError("Completion timestamp does not match deployment result")
    if environment == "production" and "staging" in backup_reference.lower():
        raise ValueError("Production cannot reference a staging backup")

    published = _timestamp(published_at, "published timestamp")
    rollback_image = (
        _require(IMAGE_REFERENCE, rollback_image_reference, "rollback image")
        if rollback_image_reference
        else None
    )
    backup = (
        _require(BACKUP_REFERENCE, backup_reference, "backup reference")
        if backup_reference
        else None
    )
    health_checks = [
        {
            "name": name,
            "result": health_results[name],
            "checkedAt": None if health_results[name] == "pending" else published,
        }
        for name in ("application", "https", "monitoring")
    ]

    return {
        "schemaVersion": 1,
        "deploymentId": _require(IDENTIFIER, deployment_id, "deployment ID"),
        "environment": environment,
        "applicationVersion": _require(VERSION, application_version, "application version"),
        "image": {
            "reference": _require(IMAGE_REFERENCE, image_reference, "image reference"),
            "identity": _require(IMAGE_IDENTITY, image_identity, "image identity"),
        },
        "startedAt": _timestamp(started_at, "start timestamp"),
        "completedAt": _timestamp(completed_at, "completion timestamp") if completed_at else None,
        "publishedAt": published,
        "result": result,
        "migrationResult": migration_result,
        "healthChecks": health_checks,
        "rollback": {
            "result": rollback_result,
            "imageReference": rollback_image,
        },
        "backupReference": backup,
    }


def _openssl_signer(private_key: Path) -> Callable[[bytes], bytes]:
    metadata = private_key.lstat()
    if not stat.S_ISREG(metadata.st_mode) or private_key.is_symlink():
        raise RuntimeError("Deployment signing key is unavailable")
    if stat.S_IMODE(metadata.st_mode) & 0o077:
        raise RuntimeError("Deployment signing key permissions are unsafe")

    def sign_payload(payload: bytes) -> bytes:
        try:
            with tempfile.NamedTemporaryFile(mode="wb") as payload_file:
                os.chmod(payload_file.name, 0o600)
                payload_file.write(payload)
                payload_file.flush()
                completed = subprocess.run(
                    [
                        "openssl", "pkeyutl", "-sign", "-rawin",
                        "-inkey", str(private_key), "-in", payload_file.name,
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.DEVNULL,
                    check=True,
                    timeout=10,
                )
        except (OSError, subprocess.SubprocessError) as error:
            raise RuntimeError("Deployment status signing failed") from error
        if len(completed.stdout) != 64:
            raise RuntimeError("Deployment status signature is invalid")
        return completed.stdout

    return sign_payload


def publish_status(
    *,
    record: dict[str, object],
    status_root: Path,
    key_id: str,
    signer: Callable[[bytes], bytes],
) -> Path:
    _require(IDENTIFIER, key_id, "key ID")
    payload = json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    signature = signer(payload)
    if len(signature) != 64:
        raise RuntimeError("Deployment status signature is invalid")
    envelope = {
        "schemaVersion": 1,
        "keyId": key_id,
        "payloadBase64": base64.b64encode(payload).decode("ascii"),
        "signatureBase64": base64.b64encode(signature).decode("ascii"),
    }
    contents = (json.dumps(envelope, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")
    if len(contents) > MAX_ENVELOPE_BYTES:
        raise RuntimeError("Deployment status exceeds its size limit")

    environment = str(record["environment"])
    records_directory = status_root / "records"
    records_directory.mkdir(parents=True, exist_ok=True, mode=0o755)
    output_path = records_directory / f"{environment}.json"
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=records_directory,
            prefix=f".{environment}-",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            os.chmod(temporary.name, 0o644)
            temporary.write(contents)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_path, output_path)
        temporary_path = None
        if os.name != "nt":
            directory_descriptor = os.open(records_directory, os.O_RDONLY)
            try:
                os.fsync(directory_descriptor)
            finally:
                os.close(directory_descriptor)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
    return output_path


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", choices=ENVIRONMENTS, required=True)
    parser.add_argument("--deployment-id", required=True)
    parser.add_argument("--application-version", required=True)
    parser.add_argument("--image-reference", required=True)
    parser.add_argument("--image-identity", required=True)
    parser.add_argument("--started-at", required=True)
    parser.add_argument("--completed-at", default="")
    parser.add_argument("--published-at", required=True)
    parser.add_argument("--result", choices=RESULTS, required=True)
    parser.add_argument("--migration-result", choices=MIGRATION_RESULTS, required=True)
    parser.add_argument("--health-application", choices=CHECK_RESULTS, required=True)
    parser.add_argument("--health-https", choices=CHECK_RESULTS, required=True)
    parser.add_argument("--health-monitoring", choices=CHECK_RESULTS, required=True)
    parser.add_argument("--rollback-result", choices=ROLLBACK_RESULTS, required=True)
    parser.add_argument("--rollback-image-reference", default="")
    parser.add_argument("--backup-reference", default="")
    parser.add_argument("--status-root", type=Path, default=Path("/var/lib/netflix-deployment-status"))
    parser.add_argument("--private-key", type=Path, default=Path("/etc/netflix-clone/deployment-status.key"))
    parser.add_argument("--key-id", required=True)
    return parser.parse_args()


def main() -> int:
    arguments = _arguments()
    record = build_record(
        environment=arguments.environment,
        deployment_id=arguments.deployment_id,
        application_version=arguments.application_version,
        image_reference=arguments.image_reference,
        image_identity=arguments.image_identity,
        started_at=arguments.started_at,
        completed_at=arguments.completed_at,
        published_at=arguments.published_at,
        result=arguments.result,
        migration_result=arguments.migration_result,
        health_results={
            "application": arguments.health_application,
            "https": arguments.health_https,
            "monitoring": arguments.health_monitoring,
        },
        rollback_result=arguments.rollback_result,
        rollback_image_reference=arguments.rollback_image_reference,
        backup_reference=arguments.backup_reference,
    )
    publish_status(
        record=record,
        status_root=arguments.status_root,
        key_id=arguments.key_id,
        signer=_openssl_signer(arguments.private_key),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
