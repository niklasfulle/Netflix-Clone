import json
import pathlib
import shutil
import subprocess
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
REDIS_IMAGE = (
    "redis:7.2.15-alpine@"
    "sha256:05a97a479bc73de66f087dc05b569010772880f778cc8671fa6b8aadee32e5c6"
)


class RedisComposeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        docker = shutil.which("docker")
        if docker is None:
            raise unittest.SkipTest("Docker Compose is required for this contract test")

        result = subprocess.run(
            [
                docker,
                "compose",
                "-f",
                str(ROOT / "docker-compose.yml"),
                "config",
                "--no-env-resolution",
                "--format",
                "json",
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        cls.compose = json.loads(result.stdout)

    def test_redis_is_an_internal_authenticated_ephemeral_service(self):
        redis = self.compose["services"]["redis-runtime"]

        self.assertEqual(REDIS_IMAGE, redis["image"])
        self.assertEqual({"backend": None}, redis["networks"])
        self.assertNotIn("ports", redis)
        self.assertEqual("999:1000", redis["user"])
        self.assertTrue(redis["read_only"])
        self.assertEqual(["ALL"], redis["cap_drop"])
        self.assertIn("no-new-privileges:true", redis["security_opt"])
        self.assertEqual("268435456", redis["mem_limit"])
        self.assertEqual(100, redis["pids_limit"])
        self.assertEqual("unless-stopped", redis["restart"])

        healthcheck = " ".join(redis["healthcheck"]["test"])
        self.assertIn("redis-cli", healthcheck)
        self.assertIn("--user health", healthcheck)
        self.assertNotIn("password", healthcheck.lower())

        targets = {volume["target"]: volume for volume in redis["volumes"]}
        self.assertTrue(targets["/usr/local/etc/redis/redis.conf"]["read_only"])
        self.assertTrue(targets["/usr/local/etc/redis/users.acl"]["read_only"])
        self.assertNotIn("/data", targets)
        self.assertTrue(any(item.startswith("/data:") for item in redis["tmpfs"]))

    def test_frontend_and_backend_networks_enforce_service_boundaries(self):
        self.assertTrue(self.compose["networks"]["backend"]["internal"])
        self.assertEqual({"frontend": None, "backend": None}, self.compose["services"]["app"]["networks"])
        self.assertEqual({"frontend": None}, self.compose["services"]["proxy"]["networks"])
        self.assertEqual({"backend": None}, self.compose["services"]["redis-runtime"]["networks"])

    def test_app_receives_redis_credentials_only_from_a_host_env_file(self):
        env_files = {
            pathlib.PurePath(item["path"]).name
            for item in self.compose["services"]["app"]["env_file"]
        }
        self.assertEqual({"app.env", "redis-app.env"}, env_files)
        self.assertNotIn("REDIS_URL", self.compose["services"]["app"]["environment"])


class RedisAnsibleContractTests(unittest.TestCase):
    def test_secret_provisioner_is_linux_executable(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        helper = (
            ROOT / "ansible" / "files" / "provision-redis-secrets.sh"
        ).read_bytes()
        attributes = (ROOT / ".gitattributes").read_text(encoding="utf-8")

        self.assertIn('dest: "{{ redis_secret_provisioner_path }}"', playbook)
        self.assertIn('- "{{ redis_secret_provisioner_path }}"', playbook)
        self.assertTrue(helper.startswith(b"#!"))
        self.assertNotIn(b"\r\n", helper)
        self.assertIn("ansible/files/*.sh text eol=lf", attributes)

    def test_template_matches_the_runtime_isolation_contract(self):
        template = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(
            encoding="utf-8"
        )

        self.assertIn("redis-runtime:", template)
        self.assertIn("image: {{ redis_image }}", template)
        self.assertIn("/root/netflix-secrets/redis-app.env", template)
        self.assertIn("/root/netflix-secrets/redis-health.env", template)
        self.assertIn("/root/netflix-secrets/redis-users.acl", template)
        self.assertIn("backend:\n    internal: true", template)
        self.assertNotIn("6379:6379", template)

    def test_playbook_provisions_and_verifies_redis_before_promotion(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )

        provision = playbook.index("Provision protected Redis credentials")
        copy_config = playbook.index("Install Redis runtime configuration")
        pull = playbook.index("Pull pinned Redis runtime")
        start = playbook.index("Start container with new version")
        ready = playbook.index("Wait for healthy Redis runtime")
        publish = playbook.index("Publish successful deployment status")

        self.assertLess(provision, start)
        self.assertLess(copy_config, start)
        self.assertLess(pull, start)
        self.assertLess(start, ready)
        self.assertLess(ready, publish)
        self.assertIn(REDIS_IMAGE, playbook)
        self.assertIn("redis_secret_files", playbook)
        self.assertIn("path: /root/netflix-secrets/redis-users.acl", playbook)
        self.assertIn("gid: 1000", playbook)
        self.assertIn("mode: '0640'", playbook)
        self.assertIn("item.stat.gid == item.item.gid", playbook)
        self.assertIn("item.stat.mode == item.item.mode", playbook)
        self.assertIn("redis_runtime_health.stdout | trim == 'healthy'", playbook)
        self.assertIn("redis_runtime_identity.stdout | trim == deployment_environment", playbook)

    def test_redis_configuration_and_credentials_are_rollback_safe(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        helper = (ROOT / "ansible" / "files" / "provision-redis-secrets.sh").read_text(
            encoding="utf-8"
        )
        config = (ROOT / "ansible" / "files" / "redis-runtime.conf").read_text(
            encoding="utf-8"
        )

        self.assertIn("Preserve the previous Redis runtime configuration", playbook)
        self.assertIn("Restore the previous Redis runtime configuration", playbook)
        self.assertIn("Remove the new Redis configuration after a first-deployment failure", playbook)
        self.assertIn("all Redis secret files must exist together", helper)
        self.assertIn("user default off", helper)
        self.assertIn("user app on", helper)
        self.assertIn("user health on", helper)
        self.assertIn("REDIS_URL=redis://app:", helper)
        self.assertIn("save \"\"", config)
        self.assertIn("appendonly no", config)
        self.assertIn("maxmemory 160mb", config)
        self.assertIn("maxmemory-policy allkeys-lfu", config)

    def test_operations_document_first_repeat_outage_upgrade_and_rollback(self):
        operations = (ROOT / "docs" / "operations" / "redis-runtime.md").read_text(
            encoding="utf-8"
        )
        ansible_readme = (ROOT / "ansible" / "README.md").read_text(
            encoding="utf-8"
        )

        for heading in (
            "## First deployment",
            "## Repeat deployment",
            "## Redis unavailable",
            "## Upgrade",
            "## Rollback and recovery",
        ):
            self.assertIn(heading, operations)
        self.assertIn("RUN_REDIS_INTEGRATION=1", operations)
        self.assertIn("Redis does not require a backup", operations)
        self.assertIn("docs/operations/redis-runtime.md", ansible_readme)

    def test_release_runbook_covers_resilience_and_safe_disablement(self):
        operations = (ROOT / "docs" / "operations" / "redis-runtime.md").read_text(
            encoding="utf-8"
        )
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

        for heading in (
            "## Capacity and alert thresholds",
            "## Failure drill matrix",
            "### Latency and reconnect storm",
            "### Memory pressure and eviction",
            "### Worker crash and duplicate delivery",
            "### Stale leases, dead letters, and deployment drain",
            "## Safe disablement",
            "## Debugging and evidence collection",
            "## Release verification",
        ):
            self.assertIn(heading, operations)

        self.assertEqual(
            "node scripts/run-redis-resilience-tests.mjs",
            package["scripts"]["test:redis-resilience"],
        )
        self.assertIn("yarn test:redis-resilience --with-docker", operations)
        self.assertIn("PostgreSQL", operations)
        self.assertIn("secret-redaction", operations)


if __name__ == "__main__":
    unittest.main()
