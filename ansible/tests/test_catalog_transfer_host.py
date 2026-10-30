import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("catalog_transfer_host", ROOT / "scripts/catalog-transfer-host.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CatalogTransferHostTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.host = module.Host({
            "CATALOG_TRANSFER_ENVIRONMENT": "local", "CATALOG_TRANSFER_STORAGE": self.directory.name,
            "CATALOG_TRANSFER_MOUNT": "isolated-volume", "CATALOG_TRANSFER_COMPOSE_FILE": "/test/compose.yml",
        })
        self.host.check_app = Mock()
        self.host.command = Mock()
        self.host.cli = Mock()
        self.host.wait_healthy = Mock()
        self.job = {"id": "550e8400-e29b-41d4-a716-446655440000", "operation": "import",
                    "environment": "local", "uploadId": "750e8400-e29b-41d4-a716-446655440000",
                    "confirmation": "netflix_local", "createdAt": "2026-10-30T12:00:00.000Z"}

    def tearDown(self):
        self.directory.cleanup()

    def status(self):
        return json.loads((self.host.root / "jobs" / f'{self.job["id"]}.json').read_text())

    def test_import_prepares_before_stopping_and_restarts_exactly_once(self):
        events = []
        self.host.cli.side_effect = lambda _, args, __: events.append(args[0])
        self.host.command.side_effect = lambda args: events.append(args[0])
        self.host.execute(self.job)
        self.assertEqual(events, ["prepare", "stop", "import", "up"])
        self.host.wait_healthy.assert_called_once()
        self.assertTrue(self.status()["restartCompleted"])
        self.assertEqual(self.status()["state"], "succeeded")

    def test_export_never_stops_or_restarts_services(self):
        self.job["operation"] = "export"
        self.host.execute(self.job)
        self.host.command.assert_not_called()
        self.assertFalse(self.status()["restartCompleted"])

    def test_import_failure_still_restores_services_and_reports_failure(self):
        self.host.cli.side_effect = [None, module.TransferError("private error")]
        file = self.host.root / "processing" / f'{self.job["id"]}.json'
        file.write_text(json.dumps(self.job))
        self.host.process(file)
        self.assertEqual([call.args[0][0] for call in self.host.command.call_args_list], ["stop", "up"])
        self.assertEqual(self.status()["state"], "failed")
        self.assertNotIn("private error", json.dumps(self.status()))

    def test_preparation_failure_does_not_interrupt_playback(self):
        self.host.cli.side_effect = module.TransferError("preparation failed")
        with self.assertRaises(module.TransferError):
            self.host.execute(self.job)
        self.host.command.assert_not_called()

    def test_production_imports_and_injected_requests_are_rejected(self):
        self.host.environment = "production"
        self.job["environment"] = "production"
        with self.assertRaises(module.TransferError):
            self.host.validate(self.job, f'{self.job["id"]}.json')
        self.host.environment = "local"
        self.job["environment"] = "local"
        self.job["uploadId"] = "../../private"
        with self.assertRaises(module.TransferError):
            self.host.validate(self.job, f'{self.job["id"]}.json')

    def test_completed_claim_is_not_executed_twice_after_a_host_restart(self):
        self.host.update(self.job, "succeeded", "completed", 100)
        file = self.host.root / "processing" / f'{self.job["id"]}.json'
        file.write_text(json.dumps(self.job))
        self.host.process(file, interrupted=True)
        self.host.command.assert_not_called()
        self.host.cli.assert_not_called()
        self.assertFalse(file.exists())

    def test_restart_requires_healthy_app_and_accepts_worker_without_healthcheck(self):
        app = {"Running": True, "Health": {"Status": "healthy"}}
        self.assertTrue(module.services_healthy(app, {"Running": True}))
        self.assertFalse(module.services_healthy(app, {"Running": False}))
        self.assertFalse(module.services_healthy({"Running": True, "Health": {"Status": "unhealthy"}}, {"Running": True}))
        self.assertFalse(module.services_healthy(app, {"Running": True, "Health": {"Status": "unhealthy"}}))

    def test_deployment_keeps_docker_access_outside_the_application(self):
        local = (ROOT / "compose.local.yml").read_text(encoding="utf-8")
        shared_app = local.split("x-app: &app", 1)[1].split("services:", 1)[0]
        self.assertNotIn("docker.sock", shared_app)
        self.assertIn("catalog-transfers:/catalog-transfers", shared_app)
        service = (ROOT / "ansible/templates/netflix-catalog-transfer.service.j2").read_text(encoding="utf-8")
        self.assertIn("/usr/bin/python3 /usr/local/lib/netflix-deploy/catalog-transfer-host.py", service)
        self.assertIn("CATALOG_TRANSFER_ENVIRONMENT={{ deployment_environment }}", service)
        playbook = (ROOT / "ansible/update-netflix-clone.yml").read_text(encoding="utf-8")
        self.assertIn("Install catalog transfer host controller", playbook)
        self.assertIn("Enable catalog transfers and automatic application restarts", playbook)


if __name__ == "__main__":
    unittest.main()
