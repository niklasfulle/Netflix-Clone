#!/usr/bin/env python3
"""Collect a small, read-only snapshot of the Netflix LXC host."""

from __future__ import annotations

import json
import os
import platform
import shutil
import socket
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


OUTPUT_PATH = Path(
    os.environ.get("NETFLIX_MONITOR_OUTPUT", "/var/lib/netflix-monitor/status.json")
)
BACKUP_STATUS_PATH = Path(
    os.environ.get(
        "NETFLIX_BACKUP_STATUS",
        "/var/lib/netflix-backup-status/last-backup.json",
    )
)
CONTAINER_NAME = os.environ.get("NETFLIX_CONTAINER_NAME", "netflix-clone")
CONTAINER_LOG_PATH = Path(
    os.environ.get("NETFLIX_CONTAINER_LOG_OUTPUT", "/var/lib/netflix-logs/container.log")
)
CONTAINER_LOG_TAIL = max(
    100,
    min(int(os.environ.get("NETFLIX_CONTAINER_LOG_TAIL", "2000")), 10000),
)
CONTAINER_LOG_MAX_BYTES = 2 * 1024 * 1024
FILESYSTEMS = (
    ("root", Path("/")),
    ("movies", Path("/movies")),
    ("series", Path("/series")),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def rounded_percent(value: float) -> float:
    return round(max(0.0, min(value, 100.0)), 1)


def read_cpu_times() -> tuple[int, int]:
    with Path("/proc/stat").open("r", encoding="utf-8") as handle:
        values = [int(value) for value in handle.readline().split()[1:]]
    idle = values[3] + (values[4] if len(values) > 4 else 0)
    return sum(values), idle


def collect_cpu() -> dict[str, Any]:
    first_total, first_idle = read_cpu_times()
    time.sleep(0.1)
    second_total, second_idle = read_cpu_times()
    total_delta = max(second_total - first_total, 1)
    idle_delta = max(second_idle - first_idle, 0)
    usage = rounded_percent((1 - idle_delta / total_delta) * 100)
    load_1, load_5, load_15 = os.getloadavg()
    return {
        "usagePercent": usage,
        "loadAverage": {
            "oneMinute": round(load_1, 2),
            "fiveMinutes": round(load_5, 2),
            "fifteenMinutes": round(load_15, 2),
        },
        "logicalCores": os.cpu_count() or 1,
    }


def read_meminfo() -> dict[str, int]:
    values: dict[str, int] = {}
    with Path("/proc/meminfo").open("r", encoding="utf-8") as handle:
        for line in handle:
            key, raw_value = line.split(":", 1)
            amount = raw_value.strip().split()[0]
            values[key] = int(amount) * 1024
    return values


def collect_memory() -> dict[str, Any]:
    values = read_meminfo()
    total = values.get("MemTotal", 0)
    available = values.get("MemAvailable", 0)
    used = max(total - available, 0)
    swap_total = values.get("SwapTotal", 0)
    swap_free = values.get("SwapFree", 0)
    return {
        "totalBytes": total,
        "usedBytes": used,
        "availableBytes": available,
        "usedPercent": rounded_percent((used / total) * 100) if total else 0,
        "swapTotalBytes": swap_total,
        "swapUsedBytes": max(swap_total - swap_free, 0),
    }


def collect_filesystem(label: str, path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "label": label,
            "path": str(path),
            "available": False,
        }
    usage = shutil.disk_usage(path)
    return {
        "label": label,
        "path": str(path),
        "available": True,
        "totalBytes": usage.total,
        "usedBytes": usage.used,
        "freeBytes": usage.free,
        "usedPercent": rounded_percent((usage.used / usage.total) * 100)
        if usage.total
        else 0,
        "freePercent": rounded_percent((usage.free / usage.total) * 100)
        if usage.total
        else 0,
        "writable": os.access(path, os.W_OK),
    }


def run_command(arguments: list[str]) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(
            arguments,
            capture_output=True,
            check=False,
            text=True,
            timeout=8,
        )
    except (OSError, subprocess.SubprocessError):
        return None


def parse_size(value: str) -> int:
    normalized = value.strip()
    units = {
        "B": 1,
        "kB": 1000,
        "KB": 1000,
        "KiB": 1024,
        "MB": 1000**2,
        "MiB": 1024**2,
        "GB": 1000**3,
        "GiB": 1024**3,
        "TB": 1000**4,
        "TiB": 1024**4,
    }
    for unit in sorted(units, key=len, reverse=True):
        if normalized.endswith(unit):
            number = normalized[: -len(unit)].strip()
            try:
                return int(float(number) * units[unit])
            except ValueError:
                return 0
    return 0


def collect_docker() -> dict[str, Any]:
    template = (
        "{{.State.Status}}\t"
        "{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}\t"
        "{{.State.StartedAt}}\t{{.RestartCount}}\t{{.Config.Image}}\t{{.Image}}"
    )
    inspected = run_command(
        ["docker", "inspect", "--format", template, CONTAINER_NAME]
    )
    if inspected is None or inspected.returncode != 0:
        return {
            "available": inspected is not None,
            "container": None,
        }

    fields = inspected.stdout.strip().split("\t")
    if len(fields) != 6:
        return {"available": True, "container": None}

    status, health, started_at, restart_count, image, image_id = fields
    container: dict[str, Any] = {
        "name": CONTAINER_NAME,
        "status": status,
        "health": health,
        "startedAt": started_at,
        "restartCount": int(restart_count) if restart_count.isdigit() else 0,
        "image": image,
        "imageId": image_id.removeprefix("sha256:"),
        "cpuPercent": 0,
        "memoryUsedBytes": 0,
        "memoryLimitBytes": 0,
        "memoryPercent": 0,
        "pids": 0,
    }

    stats = run_command(
        ["docker", "stats", "--no-stream", "--format", "{{json .}}", CONTAINER_NAME]
    )
    if stats is not None and stats.returncode == 0 and stats.stdout.strip():
        try:
            values = json.loads(stats.stdout.strip().splitlines()[0])
            memory_usage = str(values.get("MemUsage", "")).split("/")
            container.update(
                {
                    "cpuPercent": float(
                        str(values.get("CPUPerc", "0")).rstrip("%") or 0
                    ),
                    "memoryUsedBytes": parse_size(memory_usage[0])
                    if memory_usage
                    else 0,
                    "memoryLimitBytes": parse_size(memory_usage[1])
                    if len(memory_usage) > 1
                    else 0,
                    "memoryPercent": float(
                        str(values.get("MemPerc", "0")).rstrip("%") or 0
                    ),
                    "pids": int(values.get("PIDs", 0) or 0),
                }
            )
        except (TypeError, ValueError):
            pass

    return {
        "available": True,
        "container": container,
    }


def collect_backup_status() -> dict[str, Any] | None:
    try:
        data = json.loads(BACKUP_STATUS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    created_at = data.get("createdAt")
    size_bytes = data.get("sizeBytes")
    records = data.get("records")
    if not isinstance(created_at, str):
        return None
    if not isinstance(size_bytes, int) or size_bytes < 0:
        return None
    if not isinstance(records, int) or records < 0:
        return None
    return {
        "createdAt": created_at,
        "sizeBytes": size_bytes,
        "records": records,
    }


def collect_snapshot() -> dict[str, Any]:
    try:
        uptime_seconds = int(float(Path("/proc/uptime").read_text().split()[0]))
    except (OSError, ValueError, IndexError):
        uptime_seconds = 0

    return {
        "schemaVersion": 1,
        "agentVersion": "1.0.0",
        "collectedAt": utc_now(),
        "host": {
            "hostname": socket.gethostname(),
            "platform": platform.system(),
            "platformRelease": platform.release(),
            "architecture": platform.machine(),
            "uptimeSeconds": uptime_seconds,
        },
        "cpu": collect_cpu(),
        "memory": collect_memory(),
        "filesystems": [
            collect_filesystem(label, path) for label, path in FILESYSTEMS
        ],
        "docker": collect_docker(),
        "backup": collect_backup_status(),
    }


def write_snapshot(snapshot: dict[str, Any]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=OUTPUT_PATH.parent,
        prefix=".status-",
        suffix=".json",
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(snapshot, handle, separators=(",", ":"), sort_keys=True)
            handle.write("\n")
        os.chmod(temporary_path, 0o644)
        os.replace(temporary_path, OUTPUT_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)


def write_container_logs(
    contents: str,
    max_bytes: int = CONTAINER_LOG_MAX_BYTES,
) -> None:
    CONTAINER_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    encoded = contents.encode("utf-8", errors="replace")
    bounded = encoded[-max_bytes:].decode("utf-8", errors="replace")
    descriptor, temporary_name = tempfile.mkstemp(
        dir=CONTAINER_LOG_PATH.parent,
        prefix=".container-",
        suffix=".log",
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(bounded)
        os.chmod(temporary_path, 0o640)
        try:
            os.chown(temporary_path, 10001, 10001)
        except (AttributeError, PermissionError):
            pass
        os.replace(temporary_path, CONTAINER_LOG_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)


def collect_container_logs() -> bool:
    try:
        result = subprocess.run(
            [
                "docker",
                "logs",
                "--timestamps",
                "--tail",
                str(CONTAINER_LOG_TAIL),
                CONTAINER_NAME,
            ],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=8,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    if result.returncode != 0:
        return False
    write_container_logs(result.stdout)
    return True


def main() -> None:
    write_snapshot(collect_snapshot())
    collect_container_logs()


if __name__ == "__main__":
    main()
