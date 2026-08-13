import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class DeploymentContractTests(unittest.TestCase):
    def test_staging_is_the_default_and_production_requires_promotion(self):
        deploy_script = (ROOT / "deploy.ps1").read_text(encoding="utf-8")
        self.assertIn('[string]$Environment = "Staging"', deploy_script)
        self.assertIn('[switch]$ConfirmProduction', deploy_script)
        self.assertIn('Production deployment requires -ConfirmProduction', deploy_script)
        self.assertIn('Production must promote the image tested in staging', deploy_script)
        self.assertIn('staging-{0}.json', deploy_script)
        self.assertIn('No successful staging deployment was recorded', deploy_script)
        self.assertIn('hosts.staging', deploy_script)
        self.assertIn('deployment_environment=$environmentName', deploy_script)

    def test_inventory_setup_keeps_staging_and_production_separate(self):
        setup_script = (ROOT / "ansible" / "setup-env.ps1").read_text(encoding="utf-8")
        env_example = (ROOT / "ansible" / ".env.example").read_text(encoding="utf-8")
        self.assertIn('[ValidateSet("Staging", "Production")]', setup_script)
        self.assertIn('".env.staging"', setup_script)
        self.assertIn('"hosts.staging"', setup_script)
        self.assertIn("$envVars['LXC_PORT']", setup_script)
        self.assertIn('LXC_PORT=22', env_example)

    def test_deployment_rejects_an_environment_mismatch(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(encoding="utf-8")
        self.assertIn("environment_marker_path: /etc/netflix-clone/environment", playbook)
        self.assertIn("Require an explicit LXC environment marker", playbook)
        self.assertIn("Prevent deployment to the wrong LXC", playbook)
        self.assertIn("Read staging environment declaration from app configuration", playbook)
        self.assertIn("Validate staging environment declaration", playbook)
        self.assertIn("Verify staging uses an isolated staging database", playbook)
        self.assertIn("staging_environment_declaration.stdout | trim == 'staging'", playbook)
        self.assertIn("DEPLOYMENT_ENVIRONMENT=staging without quotes", playbook)
        self.assertIn("Read staging database name", playbook)
        self.assertIn("'stage' in (staging_database_name.stdout | trim)", playbook)
        self.assertIn("'staging' in (staging_database_name.stdout | trim)", playbook)
        self.assertIn("POSTGRESQL_URL connects to database", playbook)
        self.assertIn('psql "$POSTGRESQL_URL"', playbook)
        self.assertNotIn('psql "$DATABASE_URL"', playbook)
        self.assertIn("SELECT lower(current_database())", playbook)
        self.assertIn(".get('environment') == deployment_environment", playbook)
        self.assertIn("DEPLOYMENT_ENVIRONMENT: {{ deployment_environment | quote }}", compose)
        self.assertIn("com.netflix-clone.environment", compose)

    def test_deployment_rejects_insufficient_lxc_cpu_capacity_early(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(encoding="utf-8")
        cpu_check = playbook.index("Require enough CPUs for the container limit")
        backup = playbook.index("Back up the PostgreSQL database before migration")
        self.assertLess(cpu_check, backup)
        self.assertIn("container_cpu_limit: 2", playbook)
        self.assertIn("available_lxc_cpus.stdout | trim | int", playbook)
        self.assertIn("cpus: {{ container_cpu_limit }}", compose)

    def test_container_starts_without_runtime_schema_mutation(self):
        dockerfile = (ROOT / "dockerfile").read_text(encoding="utf-8")
        dockerignore = (ROOT / ".dockerignore").read_text(encoding="utf-8")
        self.assertNotIn("prisma db push", dockerfile)
        self.assertIn('CMD ["./node_modules/.bin/next", "start"]', dockerfile)
        self.assertIn("USER 10001:10001", dockerfile)
        self.assertIn("**/.sonar", dockerignore)
        self.assertIn(
            "--from=builder /netflix-clone/node_modules/.prisma ./node_modules/.prisma",
            dockerfile,
        )

    def test_deployment_backs_up_and_migrates_before_start(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        backup_script = (ROOT / "ansible" / "files" / "backup-postgres.sh").read_text(
            encoding="utf-8"
        )
        backup = playbook.index("Back up the PostgreSQL database before migration")
        baseline_check = playbook.index("Verify legacy database schema before baselining")
        baseline_resolve = playbook.index("Record existing migrations as baseline")
        migrate = playbook.index("Apply versioned Prisma migrations")
        start = playbook.index("Start container with new version")
        self.assertLess(backup, migrate)
        self.assertLess(baseline_check, baseline_resolve)
        self.assertLess(baseline_resolve, migrate)
        self.assertLess(migrate, start)
        self.assertIn("prisma\n              - migrate\n              - deploy", playbook)
        self.assertIn("Install PostgreSQL backup helper", playbook)
        self.assertIn('postgres_backup_image: "postgres:18-alpine"', playbook)
        self.assertIn('- "{{ postgres_backup_image }}"', playbook)
        self.assertIn("BACKUP_PATH=/backups/pre-{{ app_version }}.dump", playbook)
        self.assertNotIn("no_log: true", playbook)
        self.assertIn("schema=*", backup_script)
        self.assertIn("pg_dump", backup_script)
        self.assertIn("pg_restore --list", backup_script)
        self.assertIn("[redacted]", backup_script)
        self.assertIn("--from-schema-datasource", playbook)
        self.assertIn("--to-schema-datamodel", playbook)
        self.assertIn("--exit-code", playbook)
        self.assertIn("migration-table-status", playbook)
        self.assertIn("prisma_migration_table_status.stdout | trim == 'missing'", playbook)
        self.assertIn("legacy_pre_integrity_migrations:", playbook)
        self.assertIn("- '20251224222337_'", playbook)
        self.assertIn("legacy_relational_integrity_diff:", playbook)
        self.assertIn("legacy_schema_diff.rc not in [0, 2]", playbook)
        self.assertIn("(item | basename) in legacy_pre_integrity_migrations", playbook)
        self.assertIn("failed-migration-status", playbook)
        self.assertIn("Recover failed legacy baseline migration", playbook)
        self.assertIn("--rolled-back", playbook)
        self.assertIn("- migration.sql", playbook)

    def test_only_an_empty_staging_database_is_bootstrapped(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        count_tables = playbook.index(
            "Count tables in a database without Prisma migration history"
        )
        initialize = playbook.index("Initialize an empty staging database schema")
        baseline = playbook.index("Verify legacy database schema before baselining")
        self.assertLess(count_tables, initialize)
        self.assertLess(initialize, baseline)
        self.assertIn("pg_catalog.pg_tables", playbook)
        self.assertIn("- deployment_environment == 'staging'", playbook)
        self.assertIn("- public_schema_table_count.stdout | trim | int == 0", playbook)
        self.assertIn("- db\n              - push\n              - --skip-generate", playbook)
        self.assertNotIn("--force-reset", playbook)

    def test_staging_users_are_seeded_from_a_protected_file_after_migrations(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        dockerfile = (ROOT / "dockerfile").read_text(encoding="utf-8")
        migrate = playbook.index("Apply versioned Prisma migrations")
        seed = playbook.index("Seed deterministic staging users")
        start = playbook.index("Start container with new version")

        self.assertLess(migrate, seed)
        self.assertLess(seed, start)
        self.assertIn(
            "staging_seed_env_file: /root/netflix-secrets/staging-users.env",
            playbook,
        )
        self.assertIn("Validate protected staging user seed file", playbook)
        self.assertIn("staging_seed_file.stat.mode == '0600'", playbook)
        self.assertIn("- \"{{ staging_seed_env_file }}\"", playbook)
        self.assertIn("- scripts/seed-staging-users.js", playbook)
        self.assertIn("when: deployment_environment == 'staging'", playbook)
        self.assertIn(
            "--from=builder /netflix-clone/scripts/seed-staging-users.js "
            "./scripts/seed-staging-users.js",
            dockerfile,
        )

    def test_staging_catalog_has_real_media_before_it_is_seeded(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        dockerfile = (ROOT / "dockerfile").read_text(encoding="utf-8")
        media_script = (
            ROOT / "ansible" / "files" / "seed-staging-media.sh"
        ).read_text(encoding="utf-8")

        generate_media = playbook.index("Generate and verify staging test media")
        seed_catalog = playbook.index("Seed deterministic staging catalog")
        start = playbook.index("Start container with new version")

        self.assertLess(generate_media, seed_catalog)
        self.assertLess(seed_catalog, start)
        self.assertIn("jrottenberg/ffmpeg:7.1-alpine@sha256:", playbook)
        self.assertIn("Pull pinned staging media generator", playbook)
        self.assertIn("when: deployment_environment == 'staging'", playbook)
        self.assertIn("staging-player-movie.mp4", media_script)
        self.assertIn("staging-player-series.mp4", media_script)
        self.assertIn("libx264", media_script)
        self.assertIn("-c:a aac", media_script)
        self.assertIn("+faststart", media_script)
        self.assertIn("ffprobe", media_script)
        self.assertIn(
            "--from=builder /netflix-clone/scripts/seed-staging-catalog.js "
            "./scripts/seed-staging-catalog.js",
            dockerfile,
        )

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

    def test_deployment_prepares_writable_chunk_upload_directories(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(encoding="utf-8")
        self.assertIn("owner: '10001'", playbook)
        self.assertIn("group: '10001'", playbook)
        self.assertIn("- /movies/temp", playbook)
        self.assertIn("- /series/temp", playbook)
        self.assertIn("recurse: true", playbook)
        self.assertGreaterEqual(playbook.count("runtime_permissions"), 2)


if __name__ == "__main__":
    unittest.main()
