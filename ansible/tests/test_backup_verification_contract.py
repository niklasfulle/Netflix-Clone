import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class BackupVerificationContractTests(unittest.TestCase):
    def test_restore_verifier_is_network_isolated_and_never_targets_the_live_database(self):
        verifier = (
            ROOT / "ansible" / "files" / "verify-postgres-backup.sh"
        ).read_text(encoding="utf-8")
        runner = (
            ROOT / "ansible" / "files" / "run-postgres-backup-verification.sh"
        ).read_text(encoding="utf-8")

        self.assertIn("/backups/*.dump", verifier)
        self.assertIn("initdb", verifier)
        self.assertIn("listen_addresses=''", verifier)
        self.assertIn("pg_restore", verifier)
        self.assertIn("--exit-on-error", verifier)
        self.assertIn("--username postgres", verifier)
        self.assertNotIn('timeout "${VERIFY_TIMEOUT_SECONDS}s" gosu postgres pg_restore', verifier)
        self.assertIn("to_regclass", verifier)
        self.assertNotIn("POSTGRESQL_URL", verifier)
        self.assertIn("--network", runner)
        self.assertIn("none", runner)
        self.assertIn(":/backups:ro", runner)
        self.assertNotIn("docker.sock", runner)

    def test_verifier_records_bounded_evidence_and_distinct_failure_results(self):
        verifier = (
            ROOT / "ansible" / "files" / "verify-postgres-backup.sh"
        ).read_text(encoding="utf-8")

        for value in (
            "checksumSha256",
            "sourcePostgresVersion",
            "dumpToolVersion",
            "verificationPostgresVersion",
            "publicTableCount",
            "migrationCount",
            "userCount",
            "contentCount",
            "CORRUPT",
            "TRUNCATED",
            "INCOMPATIBLE",
            "TIMEOUT",
            "INTERRUPTED",
            "INITDB_FAILED",
            "SERVER_START_FAILED",
            "DATABASE_CREATE_FAILED",
            "RESTORE_EXTENSION_UNAVAILABLE",
            "RESTORE_STORAGE_EXHAUSTED",
            "RESTORE_CONFLICT",
            "RESTORE_PERMISSION_DENIED_SET",
            "RESTORE_PERMISSION_DENIED_CREATE",
            "RESTORE_PERMISSION_DENIED_ALTER",
            "VERIFIED",
        ):
            self.assertIn(value, verifier)
        self.assertNotIn('"diagnostics"', verifier)
        self.assertIn("STATUS_PATH}.tmp", verifier)
        self.assertIn('mv "$status_temporary_path" "$STATUS_PATH"', verifier)

    def test_host_runner_serializes_requests_and_preserves_backup_artifacts(self):
        runner = (
            ROOT / "ansible" / "files" / "run-postgres-backup-verification.sh"
        ).read_text(encoding="utf-8")

        self.assertIn("flock", runner)
        self.assertIn("realpath", runner)
        self.assertIn("/root/netflix-database-backups", runner)
        self.assertIn("--read-only", runner)
        self.assertIn("--tmpfs", runner)
        self.assertIn("timeout", runner)
        self.assertIn("backup verification failed:", runner)
        self.assertNotIn('rm -f "$backup_path"', runner)
        self.assertNotIn('rm -rf "$backup_directory"', runner)

    def test_ansible_installs_manual_trigger_and_verifies_before_migration(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(
            encoding="utf-8"
        )
        path_unit = (
            ROOT / "ansible" / "templates" / "netflix-backup-verification.path.j2"
        ).read_text(encoding="utf-8")
        service_unit = (
            ROOT / "ansible" / "templates" / "netflix-backup-verification.service.j2"
        ).read_text(encoding="utf-8")

        backup = playbook.index("Back up the PostgreSQL database before migration")
        verify = playbook.index("Restore-verify the pre-migration database backup")
        migrate = playbook.index("Apply versioned Prisma migrations")
        self.assertLess(backup, verify)
        self.assertLess(verify, migrate)
        self.assertIn("Install isolated PostgreSQL backup verifier", playbook)
        self.assertIn("Enable manual PostgreSQL backup verification requests", playbook)
        self.assertIn("PathExists=/var/lib/netflix-backup-status/verification/request.json", path_unit)
        self.assertIn("Unit=netflix-backup-verification.service", path_unit)
        self.assertIn("run-postgres-backup-verification.sh", service_unit)
        self.assertIn("/var/lib/netflix-backup-status:/backup-status", compose)
        self.assertNotIn("/root/netflix-database-backups:/backups", compose)
        self.assertNotIn("docker.sock", compose)

    def test_backup_status_root_allows_the_app_to_read_without_writing_status_metadata(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn("Ensure backup status root is readable by the app", playbook)
        self.assertIn("path: /var/lib/netflix-backup-status", playbook)
        self.assertIn("owner: root", playbook)
        self.assertIn("group: '10001'", playbook)
        self.assertIn("mode: '0750'", playbook)
        self.assertIn("Verify backup status root access boundary", playbook)
        self.assertIn("backup_status_root.stat.gid == 10001", playbook)


if __name__ == "__main__":
    unittest.main()
