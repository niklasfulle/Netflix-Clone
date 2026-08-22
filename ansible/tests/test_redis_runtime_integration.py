import os
import pathlib
import secrets
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid


ROOT = pathlib.Path(__file__).resolve().parents[2]
REDIS_IMAGE = (
    "redis:7.2.15-alpine@"
    "sha256:05a97a479bc73de66f087dc05b569010772880f778cc8671fa6b8aadee32e5c6"
)


@unittest.skipUnless(
    os.environ.get("RUN_REDIS_INTEGRATION") == "1",
    "set RUN_REDIS_INTEGRATION=1 to run real Redis container checks",
)
class RedisRuntimeIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.docker = shutil.which("docker")
        if cls.docker is None:
            raise unittest.SkipTest("Docker is required for Redis integration tests")

    def docker_run(self, *arguments, check=True):
        return subprocess.run(
            [self.docker, *arguments],
            cwd=ROOT,
            check=check,
            capture_output=True,
            text=True,
        )

    def wait_until_healthy(self, container_name):
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            result = self.docker_run(
                "inspect",
                "--format={{.State.Health.Status}}",
                container_name,
                check=False,
            )
            if result.stdout.strip() == "healthy":
                return
            state = self.docker_run(
                "inspect",
                "--format={{.State.Status}}",
                container_name,
                check=False,
            )
            if state.stdout.strip() in {"dead", "exited"}:
                logs = self.docker_run("logs", container_name, check=False)
                self.fail(
                    f"Redis container {container_name} stopped before becoming healthy:\n"
                    f"{logs.stdout}{logs.stderr}"
                )
            time.sleep(0.5)
        self.fail(f"Redis container {container_name} did not become healthy")

    def test_secret_provisioning_is_idempotent_and_environment_bound(self):
        volume_name = f"netflix-redis-secrets-{uuid.uuid4().hex}"
        runtime_container_name = f"netflix-redis-provisioned-{uuid.uuid4().hex}"
        helper = ROOT / "ansible" / "files" / "provision-redis-secrets.sh"
        self.docker_run("volume", "create", volume_name)
        try:
            fake_openssl = (
                "printf '%s\\n' '#!/bin/sh' "
                "'[ \"$1\" = rand ] && [ \"$2\" = -hex ] && [ \"$3\" = 32 ] || exit 64' "
                "\"dd if=/dev/urandom bs=32 count=1 2>/dev/null | od -An -tx1 | tr -d ' ' | tr -d '\\\\n'\" "
                "\"printf '\\\\n'\" > /secrets/openssl; chmod 0755 /secrets/openssl"
            )
            self.docker_run(
                "run",
                "--rm",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "-ec",
                fake_openssl,
            )
            command = [
                "run",
                "--rm",
                "--env",
                "PATH=/secrets:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets",
                "--mount",
                f"type=bind,source={helper},target=/provision-redis-secrets,readonly",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "/provision-redis-secrets",
            ]
            first = self.docker_run(*command, "staging", "/secrets")
            self.docker_run(
                "run",
                "--rm",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "-ec",
                "chown root:root /secrets/redis-users.acl; "
                "chmod 0600 /secrets/redis-users.acl",
            )
            migrated = self.docker_run(*command, "staging", "/secrets")
            repeated = self.docker_run(*command, "staging", "/secrets")
            wrong_environment = self.docker_run(
                *command, "production", "/secrets", check=False
            )

            self.assertEqual("created", first.stdout.strip())
            self.assertEqual("updated", migrated.stdout.strip())
            self.assertEqual("unchanged", repeated.stdout.strip())
            self.assertNotEqual(0, wrong_environment.returncode)
            self.assertIn("different deployment environment", wrong_environment.stderr)

            self.docker_run(
                "run",
                "--rm",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "-ec",
                "chmod 0755 /secrets",
            )
            health_password = self.docker_run(
                "run",
                "--rm",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets,readonly",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "-ec",
                ". /secrets/redis-health.env; printf '%s' \"$REDISCLI_AUTH\"",
            ).stdout
            self.assertTrue(health_password)

            self.docker_run(
                "run",
                "--detach",
                "--name",
                runtime_container_name,
                "--user",
                "999:1000",
                "--env",
                f"REDISCLI_AUTH={health_password}",
                "--mount",
                f"type=volume,source={volume_name},target=/run/netflix-secrets,readonly",
                "--health-cmd",
                "redis-cli --user health --no-auth-warning ping | grep -qx PONG",
                "--health-interval",
                "1s",
                "--health-timeout",
                "2s",
                "--health-retries",
                "10",
                REDIS_IMAGE,
                "redis-server",
                "--aclfile",
                "/run/netflix-secrets/redis-users.acl",
                "--save",
                "",
                "--appendonly",
                "no",
                "--dir",
                "/tmp",
            )
            self.wait_until_healthy(runtime_container_name)

            permissions = self.docker_run(
                "run",
                "--rm",
                "--mount",
                f"type=volume,source={volume_name},target=/secrets,readonly",
                "--entrypoint",
                "/bin/sh",
                REDIS_IMAGE,
                "-ec",
                "stat -c '%u:%g:%a' /secrets/redis-users.acl "
                "/secrets/redis-app.env /secrets/redis-health.env",
            )
            self.assertEqual(
                ["0:1000:640", "0:0:600", "0:0:600"],
                permissions.stdout.splitlines(),
            )
        finally:
            self.docker_run(
                "rm", "--force", runtime_container_name, check=False
            )
            self.docker_run("volume", "rm", "--force", volume_name, check=False)

    def test_runtime_enforces_acl_isolation_and_discards_cache_on_restart(self):
        container_name = f"netflix-redis-runtime-{uuid.uuid4().hex}"
        app_password = secrets.token_hex(32)
        health_password = secrets.token_hex(32)

        with tempfile.TemporaryDirectory(prefix="netflix-redis-") as temp_directory:
            temp = pathlib.Path(temp_directory)
            acl_path = temp / "users.acl"
            health_env_path = temp / "health.env"
            app_password_path = temp / "app-password"
            acl_path.write_text(
                "user default off\n"
                f"user app on >{app_password} ~netflix:staging:* "
                "&netflix:staging:* +@read +@write +@scripting +@connection "
                "-@dangerous -flushall -flushdb -config -acl -module -debug "
                "-shutdown -replicaof -slaveof\n"
                f"user health on >{health_password} -@all +ping +info +acl|whoami\n",
                encoding="utf-8",
            )
            health_env_path.write_text(
                f"REDISCLI_AUTH={health_password}\n", encoding="utf-8"
            )
            app_password_path.write_text(app_password, encoding="utf-8")

            config = ROOT / "ansible" / "files" / "redis-runtime.conf"
            self.docker_run(
                "run",
                "--detach",
                "--name",
                container_name,
                "--user",
                "999:1000",
                "--read-only",
                "--cap-drop",
                "ALL",
                "--security-opt",
                "no-new-privileges:true",
                "--memory",
                "256m",
                "--pids-limit",
                "100",
                "--tmpfs",
                "/data:rw,size=32m,mode=0700,uid=999,gid=1000",
                "--tmpfs",
                "/tmp:rw,size=16m,mode=1777",
                "--env-file",
                str(health_env_path),
                "--mount",
                f"type=bind,source={config},target=/usr/local/etc/redis/redis.conf,readonly",
                "--mount",
                f"type=bind,source={acl_path},target=/usr/local/etc/redis/users.acl,readonly",
                "--mount",
                f"type=bind,source={app_password_path},target=/run/secrets/app-password,readonly",
                "--health-cmd",
                "redis-cli --user health --no-auth-warning ping | grep -qx PONG",
                "--health-interval",
                "1s",
                "--health-timeout",
                "2s",
                "--health-retries",
                "10",
                REDIS_IMAGE,
                "redis-server",
                "/usr/local/etc/redis/redis.conf",
            )
            try:
                self.wait_until_healthy(container_name)
                self.assertEqual("", self.docker_run("port", container_name).stdout.strip())

                health_identity = self.docker_run(
                    "exec",
                    container_name,
                    "redis-cli",
                    "--user",
                    "health",
                    "--no-auth-warning",
                    "ACL",
                    "WHOAMI",
                )
                self.assertEqual("health", health_identity.stdout.strip())

                memory_state = self.docker_run(
                    "exec",
                    container_name,
                    "redis-cli",
                    "--user",
                    "health",
                    "--no-auth-warning",
                    "--raw",
                    "INFO",
                    "memory",
                )
                self.assertIn("maxmemory:167772160", memory_state.stdout)
                self.assertIn("maxmemory_policy:allkeys-lfu", memory_state.stdout)

                app_command = [
                    "exec",
                    container_name,
                    "/bin/sh",
                    "-ec",
                    'export REDISCLI_AUTH="$(cat /run/secrets/app-password)"; '
                    'exec redis-cli --user app --no-auth-warning "$@"',
                    "redis-app",
                ]
                allowed = self.docker_run(
                    *app_command, "SET", "netflix:staging:smoke", "ok"
                )
                denied_key = self.docker_run(
                    *app_command, "SET", "netflix:production:smoke", "blocked"
                )
                denied_admin = self.docker_run(*app_command, "FLUSHDB")
                atomic_counters = self.docker_run(
                    *app_command,
                    "EVAL",
                    "return {redis.call('INCR', KEYS[1]), redis.call('INCR', KEYS[2])}",
                    "2",
                    "netflix:staging:v1:auth-rate-limit:account",
                    "netflix:staging:v1:auth-rate-limit:ip",
                )
                denied_script_key = self.docker_run(
                    *app_command,
                    "EVAL",
                    "return redis.call('INCR', KEYS[1])",
                    "1",
                    "netflix:production:v1:auth-rate-limit:account",
                )

                self.assertEqual("OK", allowed.stdout.strip())
                self.assertIn("NOPERM", denied_key.stdout)
                self.assertIn("NOPERM", denied_admin.stdout)
                self.assertEqual(["1", "1"], atomic_counters.stdout.splitlines())
                self.assertIn("NOPERM", denied_script_key.stdout)

                self.docker_run("restart", container_name)
                self.wait_until_healthy(container_name)
                exists = self.docker_run(
                    *app_command, "EXISTS", "netflix:staging:smoke"
                )
                self.assertEqual("0", exists.stdout.strip())
            finally:
                self.docker_run("rm", "--force", container_name, check=False)


if __name__ == "__main__":
    unittest.main()
