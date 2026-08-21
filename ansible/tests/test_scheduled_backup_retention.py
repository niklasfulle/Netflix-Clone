import argparse
import importlib.util
import pathlib
import tempfile
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ansible" / "files" / "manage-postgres-backups.py"
SPEC = importlib.util.spec_from_file_location("manage_postgres_backups", MODULE_PATH)
RETENTION = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(RETENTION)


class ScheduledBackupRetentionTests(unittest.TestCase):
    def test_preserves_minimum_and_protected_backups_while_ignoring_unmanaged_files(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = pathlib.Path(temporary_directory).resolve()
            names = [
                "scheduled-staging-20260820T031500Z.dump",
                "scheduled-staging-20260819T031500Z.dump",
                "scheduled-staging-20260818T031500Z.dump",
                "scheduled-production-20260820T031500Z.dump",
                "manual.dump",
            ]
            for name in names:
                (directory / name).write_bytes(b"PGDMP backup")

            backups = RETENTION.scheduled_backups(directory, "staging")
            arguments = argparse.Namespace(
                minimum_copies=2,
                daily_days=1,
                weekly_weeks=1,
                monthly_months=1,
                protected_backup="scheduled-staging-20260818T031500Z.dump",
            )
            keep = RETENTION.retention_set(backups, arguments)

            kept_names = {path.name for path in keep}
            self.assertIn("scheduled-staging-20260820T031500Z.dump", kept_names)
            self.assertIn("scheduled-staging-20260819T031500Z.dump", kept_names)
            self.assertIn("scheduled-staging-20260818T031500Z.dump", kept_names)
            self.assertNotIn("scheduled-production-20260820T031500Z.dump", kept_names)
            self.assertNotIn("manual.dump", kept_names)

    def test_removes_only_one_validated_dump_and_its_checksum(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = pathlib.Path(temporary_directory).resolve()
            backup = directory / "scheduled-staging-20260101T031500Z.dump"
            checksum = directory / f"{backup.name}.sha256"
            unrelated = directory / "keep-me.txt"
            backup.write_bytes(b"PGDMP backup")
            checksum.write_text("checksum", encoding="utf-8")
            unrelated.write_text("keep", encoding="utf-8")

            RETENTION.remove_backup(directory, backup)

            self.assertFalse(backup.exists())
            self.assertFalse(checksum.exists())
            self.assertTrue(unrelated.exists())


if __name__ == "__main__":
    unittest.main()
