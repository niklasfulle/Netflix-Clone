import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class DeploymentContractTests(unittest.TestCase):
    def test_container_starts_without_runtime_schema_mutation(self):
        dockerfile = (ROOT / "dockerfile").read_text(encoding="utf-8")
        self.assertNotIn("prisma db push", dockerfile)
        self.assertIn('CMD ["./node_modules/.bin/next", "start"]', dockerfile)
        self.assertIn("USER 10001:10001", dockerfile)
        self.assertIn(
            "--from=builder /netflix-clone/node_modules/.prisma ./node_modules/.prisma",
            dockerfile,
        )

    def test_deployment_backs_up_and_migrates_before_start(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        backup = playbook.index("Back up the PostgreSQL database before migration")
        migrate = playbook.index("Apply versioned Prisma migrations")
        start = playbook.index("Start container with new version")
        self.assertLess(backup, migrate)
        self.assertLess(migrate, start)
        self.assertIn("prisma\n              - migrate\n              - deploy", playbook)

    def test_failed_health_or_monitoring_restores_previous_compose(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        self.assertIn("rescue:", playbook)
        self.assertIn("Preserve failed-container diagnostics", playbook)
        self.assertIn("Restore the previous compose definition", playbook)
        self.assertIn("Restart the previous working image", playbook)
        self.assertLess(
            playbook.index("Verify deployed container in system metrics"),
            playbook.index("Remove dangling Docker layers after successful start"),
        )

    def test_compose_applies_runtime_limits(self):
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(encoding="utf-8")
        for setting in (
            'user: "10001:10001"',
            "read_only: true",
            "no-new-privileges:true",
            "cap_drop:",
            "pids_limit:",
            "cpus:",
            "mem_limit:",
            'max-size: "10m"',
        ):
            self.assertIn(setting, compose)

    def test_deployment_uses_docker_cli_instead_of_python_docker_sdk(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        self.assertNotIn("community.docker.", playbook)
        self.assertIn("- pull\n          - \"{{ docker_registry }}/{{ image_name }}:{{ app_version }}\"", playbook)
        self.assertIn("- compose\n              - -f", playbook)
        self.assertIn("- down", playbook)
        self.assertIn("- up", playbook)


if __name__ == "__main__":
    unittest.main()
