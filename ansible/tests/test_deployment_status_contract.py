import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class DeploymentStatusContractTests(unittest.TestCase):
    def test_deployment_status_is_host_signed_and_read_only_in_the_application(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(encoding="utf-8")

        self.assertIn("Generate the host deployment-status signing key", playbook)
        self.assertIn("openssl genpkey -algorithm ED25519", playbook)
        self.assertIn("Install deployment status publisher", playbook)
        self.assertIn("Publish deployment start status", playbook)
        self.assertIn("Publish successful deployment status", playbook)
        self.assertIn("Publish failed deployment status", playbook)
        self.assertIn("Publish successful rollback status", playbook)
        self.assertIn("/var/lib/netflix-deployment-status:/deployment-status:ro", compose)
        self.assertNotIn("docker.sock", compose)
        self.assertIn("DEPLOYMENT_STATUS_APPROVED_PEERS", compose)

    def test_status_lifecycle_surrounds_migration_health_and_rollback(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")

        start = playbook.index("Publish deployment start status")
        migrate = playbook.index("Apply versioned Prisma migrations")
        health = playbook.index("Verify deployed container in system metrics")
        success = playbook.index("Publish successful deployment status")
        failed = playbook.index("Publish failed deployment status")
        rollback = playbook.index("Publish successful rollback status")

        self.assertLess(start, migrate)
        self.assertLess(migrate, health)
        self.assertLess(health, success)
        self.assertLess(failed, rollback)
        self.assertIn("Prevent deployment to the wrong LXC", playbook)
        self.assertIn("deployment_environment", playbook)
        self.assertIn("environment_marker_path", playbook)


if __name__ == "__main__":
    unittest.main()
