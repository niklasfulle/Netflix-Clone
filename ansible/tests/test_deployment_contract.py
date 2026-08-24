import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]


class DeploymentContractTests(unittest.TestCase):
    def test_backup_status_permissions_survive_monitoring_setup(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        monitor_tasks = (
            ROOT / "ansible" / "tasks" / "system-monitor.yml"
        ).read_text(encoding="utf-8")

        task_start = playbook.index(
            "- name: Ensure backup status root is readable by the app"
        )
        task_end = playbook.index(
            "- name: Inspect backup status root access boundary", task_start
        )
        permissions_task = playbook[task_start:task_end]

        self.assertIn("path: /var/lib/netflix-backup-status", permissions_task)
        self.assertIn("owner: root", permissions_task)
        self.assertIn("group: '10001'", permissions_task)
        self.assertIn("mode: '0750'", permissions_task)
        self.assertNotIn("/var/lib/netflix-backup-status", monitor_tasks)

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
        self.assertIn("$envVars['HTTPS_HOST']", setup_script)
        self.assertIn('HTTPS_HOST=', env_example)

    def test_internal_https_terminates_at_a_hardened_reverse_proxy(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(
            encoding="utf-8"
        )
        caddyfile = (ROOT / "ansible" / "Caddyfile.j2").read_text(encoding="utf-8")

        self.assertIn("Select the canonical LAN HTTPS hostname", playbook)
        self.assertIn("'netflix-staging' if deployment_environment == 'staging' else 'netflix'", playbook)
        self.assertIn("Validate canonical LAN HTTPS hostname", playbook)
        self.assertIn("Copy internal HTTPS reverse-proxy configuration", playbook)
        self.assertIn("Pull pinned internal HTTPS reverse proxy", playbook)
        self.assertIn("Verify canonical HTTPS health", playbook)
        self.assertIn("Preserve the previous reverse-proxy definition for rollback", playbook)
        self.assertIn("Restore the previous reverse-proxy definition", playbook)
        self.assertIn("Verify rollback through canonical HTTPS", playbook)
        self.assertIn('url: "https://{{ https_hostname }}/api/health"', playbook)
        self.assertIn('ca_path: "{{ caddy_root_certificate_path }}"', playbook)
        self.assertIn('"127.0.0.1:3000:3000"', compose)
        self.assertIn('"80:80"', compose)
        self.assertIn('"443:443"', compose)
        self.assertIn("AUTH_URL: {{ canonical_url | quote }}", compose)
        self.assertIn("AUTH_PUBLIC_URL: {{ canonical_url | quote }}", compose)
        self.assertIn("AUTH_TRUSTED_PROXY_HOPS: '1'", compose)
        self.assertIn("caddy_data:", compose)
        self.assertIn("tls internal", caddyfile)
        self.assertIn("reverse_proxy app:3000", caddyfile)
        self.assertIn("Strict-Transport-Security", caddyfile)

        manual_compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
        self.assertIn("HTTPS_HOST: ${HTTPS_HOST:-netflix}", manual_compose)

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
        self.assertIn("docker inspect netflix-jobs-migrate", playbook)
        self.assertIn("docker logs netflix-jobs-migrate", playbook)
        self.assertIn("docker inspect netflix-jobs-worker", playbook)
        self.assertIn("docker logs netflix-jobs-worker", playbook)
        self.assertIn("Restore the previous compose definition", playbook)
        self.assertIn("Restart the previous working image", playbook)
        self.assertIn(
            "deployed_system_metrics.docker.container.imageId ==",
            playbook,
        )
        self.assertIn(
            "(deployed_image_identity.stdout | trim | regex_replace('^sha256:', ''))",
            playbook,
        )
        self.assertNotIn(
            "deployed_system_metrics.docker.container.image == docker_registry",
            playbook,
        )
        self.assertLess(
            playbook.index("Verify deployed container in system metrics"),
            playbook.index("Remove dangling Docker layers after successful start"),
        )

    def test_deployment_forces_a_fresh_monitor_snapshot_after_health_checks(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        refresh_start = playbook.index("- name: Refresh deployed system metrics")
        refresh_end = playbook.index("- name: Read deployed system metrics", refresh_start)
        refresh_task = playbook[refresh_start:refresh_end]

        self.assertIn("state: restarted", refresh_task)

    def test_deployment_waits_for_background_worker_health(self):
        playbook = (ROOT / "ansible" / "update-netflix-clone.yml").read_text(
            encoding="utf-8"
        )
        compose = (ROOT / "ansible" / "docker-compose.yml.j2").read_text(
            encoding="utf-8"
        )

        self.assertIn("jobs-migrate:", compose)
        self.assertIn("jobs-worker:", compose)
        self.assertIn("container_name: netflix-jobs-worker", compose)
        self.assertIn("stop_grace_period: 105s", compose)
        migration = compose[
            compose.index("\n  jobs-migrate:\n"):compose.index("\n  jobs-worker:\n")
        ]
        worker = compose[
            compose.index("\n  jobs-worker:\n"):compose.index("\n  redis-runtime:\n")
        ]
        network_definitions = compose[compose.rindex("\nnetworks:"):]
        self.assertIn("- egress", migration)
        self.assertNotIn("- backend", migration)
        self.assertIn("- egress", worker)
        self.assertIn("- backend", worker)
        self.assertIn("  egress:\n", network_definitions)
        self.assertIn("/root/netflix-secrets/redis-app.env", worker)
        self.assertIn("DEPLOYMENT_ENVIRONMENT: {{ deployment_environment | quote }}", worker)
        self.assertIn("Wait for healthy background job worker", playbook)
        self.assertIn("- netflix-jobs-worker", playbook)
        self.assertLess(
            playbook.index("Wait for healthy background job worker"),
            playbook.index("Wait for healthy application version"),
        )

    def test_job_queue_migration_creates_dead_letter_queue_first(self):
        migration_script = (ROOT / "scripts" / "migrate-job-queue.mjs").read_text(
            encoding="utf-8"
        )

        dead_letter_queue = migration_script.index(
            "await boss.createQueue('media.integrity.scan.dead'"
        )
        primary_queue = migration_script.index(
            "await boss.createQueue('media.integrity.scan', queueOptions)"
        )

        self.assertLess(dead_letter_queue, primary_queue)

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
