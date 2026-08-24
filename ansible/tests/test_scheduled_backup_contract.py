import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class ScheduledBackupContractTests(unittest.TestCase):
    def test_manual_retention_requests_use_the_managed_backup_lock_and_hardened_service(self):
        runner = (
            ROOT / "ansible" / "files" / "run-postgres-backup-retention.sh"
        ).read_text(encoding="utf-8")
        service = (
            ROOT / "ansible" / "templates" / "netflix-backup-retention.service.j2"
        ).read_text(encoding="utf-8")
        path_unit = (
            ROOT / "ansible" / "templates" / "netflix-backup-retention.path.j2"
        ).read_text(encoding="utf-8")
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn("/root/netflix-database-backups", runner)
        self.assertIn("/run/lock/netflix-postgres-backup.lock", runner)
        self.assertIn('flock -w "$lock_wait_seconds" 9', runner)
        self.assertIn("/usr/local/lib/netflix-deploy/manage-postgres-backups.py", runner)
        self.assertNotIn("eval ", runner)
        self.assertIn("ExecStart=/usr/local/lib/netflix-deploy/run-postgres-backup-retention.sh", service)
        self.assertIn("NoNewPrivileges=true", service)
        self.assertIn("ReadWritePaths=/root/netflix-database-backups", service)
        self.assertIn("PathChanged=/var/lib/netflix-backup-status/retention/request.json", path_unit)
        self.assertIn("run-postgres-backup-retention.sh", playbook)
        self.assertIn("netflix-backup-retention.path", playbook)

    def test_systemd_timer_is_persistent_and_uses_protected_host_configuration(self):
        service = (
            ROOT / "ansible" / "templates" / "netflix-postgres-backup.service.j2"
        ).read_text(encoding="utf-8")
        timer = (
            ROOT / "ansible" / "templates" / "netflix-postgres-backup.timer.j2"
        ).read_text(encoding="utf-8")

        self.assertIn("run-postgres-backup.sh", service)
        self.assertIn("EnvironmentFile=/root/netflix-secrets/app.env", service)
        self.assertIn("NoNewPrivileges=true", service)
        self.assertIn("ReadWritePaths=/root/netflix-database-backups", service)
        self.assertIn("OnCalendar={{ postgres_backup_schedule }} {{ postgres_backup_timezone }}", timer)
        self.assertIn("Persistent=true", timer)
        self.assertIn("RandomizedDelaySec=", timer)

    def test_runner_serializes_dump_publish_verification_and_retention(self):
        runner = (
            ROOT / "ansible" / "files" / "run-postgres-backup.sh"
        ).read_text(encoding="utf-8")

        self.assertIn("/run/lock/netflix-postgres-backup.lock", runner)
        self.assertIn("flock -w", runner)
        self.assertIn("backup-postgres", runner)
        self.assertIn("sha256sum", runner)
        self.assertIn(".sha256.tmp", runner)
        self.assertIn("run-postgres-backup-verification.sh", runner)
        self.assertIn(
            r'\"backupName\":\"$backup_name\",\"status\":\"VERIFIED\"',
            runner,
        )
        self.assertIn("manage-postgres-backups.py", runner)
        self.assertIn("timeout --signal=TERM", runner)
        self.assertNotIn("docker.sock", runner)
        self.assertNotIn("eval ", runner)

    def test_retention_is_scoped_and_preserves_a_minimum_recovery_set(self):
        retention = (
            ROOT / "ansible" / "files" / "manage-postgres-backups.py"
        ).read_text(encoding="utf-8")

        self.assertIn("scheduled-", retention)
        self.assertIn("minimum_copies", retention)
        self.assertIn("daily_days", retention)
        self.assertIn("weekly_weeks", retention)
        self.assertIn("monthly_months", retention)
        self.assertIn("resolve(strict=True)", retention)
        self.assertIn("backup_directory", retention)
        self.assertNotIn("rmtree", retention)
        self.assertNotIn("glob(\"*\")", retention)

    def test_ansible_installs_and_enables_scheduled_backup_units(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )

        for value in (
            "Install scheduled PostgreSQL backup runner",
            "Install safe PostgreSQL backup retention manager",
            "Install scheduled PostgreSQL backup service",
            "Install scheduled PostgreSQL backup timer",
            "Enable scheduled PostgreSQL backups",
            "netflix-postgres-backup.timer",
        ):
            self.assertIn(value, playbook)
        self.assertIn("postgres_backup_minimum_copies", playbook)
        self.assertIn("postgres_backup_retention_daily_days", playbook)
        self.assertIn("postgres_backup_retention_weekly_weeks", playbook)
        self.assertIn("postgres_backup_retention_monthly_months", playbook)
        self.assertIn("/run/lock/netflix-postgres-backup.lock", playbook)


if __name__ == "__main__":
    unittest.main()
