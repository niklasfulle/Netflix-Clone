#!/usr/bin/env python3
"""Fixed-operation host bridge: catalog CLI plus app/worker restart, no shell commands."""
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import queue
import re
import subprocess
import threading
import time
import uuid

UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
TERMINAL = {"succeeded", "failed"}


class TransferError(Exception):
    pass


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def write_json(file, value):
    temporary = file.with_name(f".{file.name}.{uuid.uuid4()}.tmp")
    try:
        with temporary.open("x", encoding="utf-8") as output:
            json.dump(value, output)
        os.chmod(temporary, 0o640)
        if os.geteuid() == 0:
            os.chown(temporary, 10001, 10001)
        temporary.replace(file)
    finally:
        temporary.unlink(missing_ok=True)


class Host:
    def __init__(self, environment=os.environ):
        self.environment = environment["CATALOG_TRANSFER_ENVIRONMENT"]
        if self.environment not in {"local", "staging", "production"}:
            raise TransferError("Invalid host environment")
        if self.environment != "local":
            marker = Path("/etc/netflix-clone/environment").read_text().strip()
            if marker != self.environment:
                raise TransferError("Host environment marker does not match")
        self.root = Path(environment["CATALOG_TRANSFER_STORAGE"])
        self.mount = environment["CATALOG_TRANSFER_MOUNT"]
        self.compose = ["docker", "compose"]
        if environment.get("CATALOG_TRANSFER_ENV_FILE"):
            self.compose += ["--env-file", environment["CATALOG_TRANSFER_ENV_FILE"]]
        self.compose += ["-f", environment["CATALOG_TRANSFER_COMPOSE_FILE"]]
        for name in ("requests", "processing", "jobs", "uploads", "exports", "backups"):
            directory = self.root / name
            directory.mkdir(parents=True, exist_ok=True, mode=0o750)
            if os.geteuid() == 0:
                os.chown(directory, 10001, 10001)

    def heartbeat(self):
        write_json(self.root / "host.json", {"environment": self.environment, "updatedAt": now()})

    def command(self, arguments):
        result = subprocess.run(self.compose + arguments, capture_output=True, text=True, timeout=180, check=False)
        if result.returncode:
            raise TransferError("Container operation failed")
        return result.stdout.strip()

    def check_app(self):
        container = self.command(["ps", "-aq", "app"])
        if not re.fullmatch(r"[a-f0-9]{12,64}", container):
            raise TransferError("Application container is unavailable")
        result = subprocess.run(["docker", "inspect", "--format", '{{index .Config.Labels "com.netflix-clone.environment"}}', container], capture_output=True, text=True, timeout=15, check=False)
        if result.returncode or result.stdout.strip() != self.environment:
            raise TransferError("Application environment label does not match host")

    def service_state(self, service):
        container = self.command(["ps", "-aq", service])
        if not re.fullmatch(r"[a-f0-9]{12,64}", container):
            return {}
        result = subprocess.run(["docker", "inspect", "--format", "{{json .State}}", container], capture_output=True, text=True, timeout=15, check=False)
        return json.loads(result.stdout) if result.returncode == 0 else {}

    def wait_healthy(self):
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            self.heartbeat()
            app = self.service_state("app")
            worker = self.service_state("jobs-worker")
            if services_healthy(app, worker):
                return
            time.sleep(1)
        raise TransferError("Application or worker did not become healthy")

    def restart(self):
        # Compose versions differ in how --wait handles a disabled healthcheck.
        # Start both services once, then check app health and worker availability.
        self.command(["up", "-d", "--no-deps", "--no-build", "app", "jobs-worker"])
        self.wait_healthy()

    def update(self, job, state, phase, percent, diagnostic=None):
        value = {"id": job["id"], "operation": job["operation"], "state": state, "phase": phase,
                 "percent": percent, "updatedAt": now(), "createdAt": job["createdAt"],
                 "backupAvailable": job.get("backupAvailable", False),
                 "restartCompleted": state == "succeeded" and job["operation"] == "import"}
        if diagnostic:
            value["diagnostic"] = diagnostic
        write_json(self.root / "jobs" / f'{job["id"]}.json', value)

    def cli(self, job, arguments, phase):
        command = self.compose + ["run", "--rm", "--no-deps", "--name", f'netflix-catalog-transfer-{job["id"]}',
                                  "-v", f"{self.mount}:/catalog-transfers", "app", "node", "scripts/catalog-snapshot.js"] + arguments
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        lines = queue.Queue(maxsize=100)

        def collect():
            for line in process.stdout:
                lines.put(line)

        reader = threading.Thread(target=collect, daemon=True)
        reader.start()
        deadline = time.monotonic() + 24 * 60 * 60
        total = 0
        try:
            while process.poll() is None or reader.is_alive() or not lines.empty():
                self.heartbeat()
                if time.monotonic() > deadline:
                    raise TransferError("Operation timed out")
                try:
                    event = json.loads(lines.get(timeout=1))
                except (queue.Empty, json.JSONDecodeError):
                    continue
                if not isinstance(event, dict):
                    continue
                if isinstance(event.get("mediaFiles"), int):
                    total = event["mediaFiles"]
                if event.get("targetBackupCreated") is True:
                    job["backupAvailable"] = True
                    self.update(job, "running", phase, 82)
                prepared = event.get("preparedMediaFiles")
                if phase == "preparing" and isinstance(prepared, int) and total > 0:
                    self.update(job, "running", phase, min(75, 10 + int(65 * prepared / total)))
            if process.wait() != 0:
                raise TransferError("Catalog CLI failed")
        finally:
            if process.poll() is None:
                process.kill()
                subprocess.run(["docker", "rm", "-f", f'netflix-catalog-transfer-{job["id"]}'], capture_output=True, timeout=30, check=False)

    def validate(self, job, filename):
        if set(job) - {"id", "operation", "uploadId", "confirmation", "createdAt", "environment"}:
            raise TransferError("Unknown request fields")
        if not UUID.fullmatch(job.get("id", "")) or filename != f'{job["id"]}.json':
            raise TransferError("Invalid request identifier")
        if job.get("environment") != self.environment or job.get("operation") not in {"export", "import"}:
            raise TransferError("Invalid operation environment")
        if not isinstance(job.get("createdAt"), str) or len(job["createdAt"]) > 40:
            raise TransferError("Invalid request timestamp")
        if job["operation"] == "import":
            if self.environment == "production":
                raise TransferError("Production imports are forbidden")
            if not UUID.fullmatch(job.get("uploadId", "")) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,62}", job.get("confirmation", "")):
                raise TransferError("Invalid import request")

    def execute(self, job):
        self.check_app()
        if job["operation"] == "export":
            self.update(job, "running", "exporting", 10)
            self.cli(job, ["export", "--output", f'/catalog-transfers/exports/{job["id"]}.json'], "exporting")
        else:
            source = ["--input", f'/catalog-transfers/uploads/{job["uploadId"]}.json', "--target", self.environment]
            self.update(job, "running", "preparing", 10)
            self.cli(job, ["prepare"] + source, "preparing")
            self.update(job, "running", "stopping", 78)
            stopped = False
            try:
                stopped = True
                self.command(["stop", "app", "jobs-worker"])
                self.update(job, "running", "importing", 82)
                self.cli(job, ["import"] + source + ["--apply", "--confirm", job["confirmation"], "--backup", f'/catalog-transfers/backups/{job["id"]}.sql'], "importing")
            finally:
                if stopped:
                    self.update(job, "running", "restarting", 95)
                    self.restart()
        self.update(job, "succeeded", "completed", 100)

    def process(self, file, interrupted=False):
        job = None
        try:
            if file.is_symlink() or file.stat().st_size > 4096:
                raise TransferError("Invalid request file")
            job = json.loads(file.read_text(encoding="utf-8"))
            self.validate(job, file.name)
            if interrupted:
                status = self.root / "jobs" / file.name
                if status.is_file():
                    saved = json.loads(status.read_text())
                    if saved.get("state") in TERMINAL:
                        return
                    job["backupAvailable"] = saved.get("backupAvailable", False)
                if job["operation"] == "import":
                    self.check_app()
                    subprocess.run(["docker", "rm", "-f", f'netflix-catalog-transfer-{job["id"]}'], capture_output=True, timeout=30, check=False)
                    self.restart()
                raise TransferError("Host operation was interrupted")
            self.execute(job)
        except Exception:
            # Raw CLI output, snapshots and environment values never enter host logs.
            if isinstance(job, dict) and UUID.fullmatch(job.get("id", "")) and job.get("operation") in {"export", "import"} and isinstance(job.get("createdAt"), str):
                self.update(job, "failed", "failed", 0, "HOST_OPERATION_FAILED")
            print(json.dumps({"action": "catalog_transfer_failed", "jobId": job.get("id") if isinstance(job, dict) and UUID.fullmatch(job.get("id", "")) else None}), flush=True)
        finally:
            file.unlink(missing_ok=True)

    def run(self):
        with (self.root / "host.lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            for file in (self.root / "processing").glob("*.json"):
                self.process(file, interrupted=True)
            while True:
                self.heartbeat()
                for file in sorted((self.root / "requests").glob("*.json")):
                    claimed = self.root / "processing" / file.name
                    file.rename(claimed)
                    self.process(claimed)
                time.sleep(2)


def services_healthy(app, worker):
    app_ok = app.get("Running") is True and app.get("Health", {}).get("Status") == "healthy"
    worker_ok = worker.get("Running") is True and worker.get("Health", {}).get("Status", "healthy") == "healthy"
    return app_ok and worker_ok


if __name__ == "__main__":
    Host().run()
