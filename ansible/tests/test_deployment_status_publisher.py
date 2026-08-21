import base64
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "files" / "publish_deployment_status.py"
SPEC = importlib.util.spec_from_file_location("publish_deployment_status", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
publisher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publisher)


class DeploymentStatusPublisherTests(unittest.TestCase):
    def test_publishes_a_bounded_atomic_envelope_without_sensitive_values(self):
        record = publisher.build_record(
            environment="staging",
            deployment_id="deployment-20260815-120000",
            application_version="1.12.0-rc.1",
            image_reference="salkin263/netflix-clone:1.12.0-rc.1",
            image_identity="sha256:" + "a" * 64,
            started_at="2026-08-15T11:55:00.000Z",
            completed_at="2026-08-15T12:00:00.000Z",
            published_at="2026-08-15T12:00:00.000Z",
            result="succeeded",
            migration_result="succeeded",
            health_results={
                "application": "passed",
                "https": "passed",
                "monitoring": "passed",
            },
            rollback_result="not_required",
            rollback_image_reference="",
            backup_reference="pre-1.12.0-rc.1.dump",
        )

        with tempfile.TemporaryDirectory() as directory:
            output = publisher.publish_status(
                record=record,
                status_root=Path(directory),
                key_id="staging-host-v1",
                signer=lambda payload: b"s" * 64,
            )

            envelope = json.loads(output.read_text(encoding="utf-8"))
            payload = json.loads(base64.b64decode(envelope["payloadBase64"]))

            self.assertEqual(payload["environment"], "staging")
            self.assertEqual(payload["result"], "succeeded")
            self.assertEqual(payload["backupReference"], "pre-1.12.0-rc.1.dump")
            self.assertEqual(base64.b64decode(envelope["signatureBase64"]), b"s" * 64)
            self.assertLess(output.stat().st_size, 32768)
            self.assertEqual(list(output.parent.glob(".staging-*.tmp")), [])
            serialized = output.read_text(encoding="utf-8").lower()
            for forbidden in ("postgresql_url", "ssh", "password", "token", "registry_auth"):
                self.assertNotIn(forbidden, serialized)

    def test_replaces_partial_status_with_a_visible_rollback_result(self):
        common = {
            "environment": "production",
            "deployment_id": "deployment-20260815-120000",
            "application_version": "1.12.0",
            "image_reference": "salkin263/netflix-clone:1.12.0",
            "image_identity": "sha256:" + "b" * 64,
            "started_at": "2026-08-15T11:55:00.000Z",
            "migration_result": "succeeded",
            "health_results": {
                "application": "passed",
                "https": "failed",
                "monitoring": "pending",
            },
            "backup_reference": "pre-1.12.0.dump",
        }
        partial = publisher.build_record(
            **common,
            completed_at="",
            published_at="2026-08-15T11:59:00.000Z",
            result="in_progress",
            rollback_result="pending",
            rollback_image_reference="salkin263/netflix-clone:1.11.0",
        )
        rolled_back = publisher.build_record(
            **common,
            completed_at="2026-08-15T12:01:00.000Z",
            published_at="2026-08-15T12:01:00.000Z",
            result="rolled_back",
            rollback_result="succeeded",
            rollback_image_reference="salkin263/netflix-clone:1.11.0",
        )

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            publisher.publish_status(
                record=partial,
                status_root=root,
                key_id="production-host-v1",
                signer=lambda payload: b"p" * 64,
            )
            output = publisher.publish_status(
                record=rolled_back,
                status_root=root,
                key_id="production-host-v1",
                signer=lambda payload: b"r" * 64,
            )
            envelope = json.loads(output.read_text(encoding="utf-8"))
            payload = json.loads(base64.b64decode(envelope["payloadBase64"]))

            self.assertEqual(payload["result"], "rolled_back")
            self.assertEqual(payload["rollback"]["result"], "succeeded")
            self.assertEqual(
                payload["rollback"]["imageReference"],
                "salkin263/netflix-clone:1.11.0",
            )

    @unittest.skipUnless(shutil.which("openssl"), "OpenSSL is required")
    def test_openssl_ed25519_signature_verifies_with_the_exported_public_key(self):
        record = publisher.build_record(
            environment="staging",
            deployment_id="staging-1.12.0-20260815",
            application_version="1.12.0",
            image_reference="salkin263/netflix-clone:1.12.0",
            image_identity="sha256:" + "c" * 64,
            started_at="2026-08-15T11:55:00.000Z",
            completed_at="2026-08-15T12:00:00.000Z",
            published_at="2026-08-15T12:00:00.000Z",
            result="succeeded",
            migration_result="succeeded",
            health_results={"application": "passed", "https": "passed", "monitoring": "passed"},
            rollback_result="not_required",
            rollback_image_reference="",
            backup_reference="pre-1.12.0.dump",
        )

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            private_key = root / "host.key"
            public_key = root / "host.pem"
            subprocess.run(
                ["openssl", "genpkey", "-algorithm", "ED25519", "-out", private_key],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            os.chmod(private_key, 0o600)
            with public_key.open("wb") as output:
                subprocess.run(
                    ["openssl", "pkey", "-in", private_key, "-pubout"],
                    check=True,
                    stdout=output,
                    stderr=subprocess.DEVNULL,
                )

            output = publisher.publish_status(
                record=record,
                status_root=root,
                key_id="staging-host-v1",
                signer=publisher._openssl_signer(private_key),
            )
            envelope = json.loads(output.read_text(encoding="utf-8"))
            payload_path = root / "payload.json"
            signature_path = root / "signature.bin"
            payload_path.write_bytes(base64.b64decode(envelope["payloadBase64"]))
            signature_path.write_bytes(base64.b64decode(envelope["signatureBase64"]))

            result = subprocess.run(
                [
                    "openssl", "pkeyutl", "-verify", "-pubin", "-inkey", public_key,
                    "-rawin", "-in", payload_path, "-sigfile", signature_path,
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
