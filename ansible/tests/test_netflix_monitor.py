import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "files" / "netflix_monitor.py"
SPEC = importlib.util.spec_from_file_location("netflix_monitor", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
netflix_monitor = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(netflix_monitor)


class NetflixMonitorTests(unittest.TestCase):
    def test_parse_size_supports_docker_units(self):
        self.assertEqual(netflix_monitor.parse_size("1.5 GiB"), 1610612736)
        self.assertEqual(netflix_monitor.parse_size("250MiB"), 262144000)
        self.assertEqual(netflix_monitor.parse_size("invalid"), 0)

    def test_missing_filesystem_is_reported_without_raising(self):
        result = netflix_monitor.collect_filesystem(
            "missing",
            Path("/definitely-not-a-real-netflix-path"),
        )

        self.assertEqual(result["label"], "missing")
        self.assertFalse(result["available"])
        self.assertTrue(result["path"].endswith("definitely-not-a-real-netflix-path"))

    def test_backup_metadata_is_reduced_to_safe_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            status_path = Path(directory) / "last-backup.json"
            status_path.write_text(
                json.dumps(
                    {
                        "createdAt": "2026-07-29T12:00:00.000Z",
                        "sizeBytes": 2048,
                        "records": 42,
                        "ignored": "not exported",
                    }
                ),
                encoding="utf-8",
            )
            original_path = netflix_monitor.BACKUP_STATUS_PATH
            netflix_monitor.BACKUP_STATUS_PATH = status_path
            try:
                result = netflix_monitor.collect_backup_status()
            finally:
                netflix_monitor.BACKUP_STATUS_PATH = original_path

        self.assertEqual(
            result,
            {
                "createdAt": "2026-07-29T12:00:00.000Z",
                "sizeBytes": 2048,
                "records": 42,
            },
        )

    def test_snapshot_write_is_atomic_and_readable(self):
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "status.json"
            original_path = netflix_monitor.OUTPUT_PATH
            netflix_monitor.OUTPUT_PATH = output_path
            try:
                netflix_monitor.write_snapshot({"schemaVersion": 1})
            finally:
                netflix_monitor.OUTPUT_PATH = original_path

            self.assertEqual(
                json.loads(output_path.read_text(encoding="utf-8")),
                {"schemaVersion": 1},
            )
            self.assertEqual(list(Path(directory).glob(".status-*.json")), [])


if __name__ == "__main__":
    unittest.main()
