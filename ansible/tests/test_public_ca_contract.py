from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PublicCaContractTests(unittest.TestCase):
    def test_compose_mounts_only_the_public_certificate_directory_read_only(self):
        compose = (ROOT / "docker-compose.yml.j2").read_text(encoding="utf-8")

        self.assertIn(
            "/var/lib/netflix-public-certificates:/public-certificates:ro",
            compose,
        )
        self.assertNotIn("/data/caddy:/public-certificates", compose)

    def test_playbook_requires_explicit_rotation_and_installs_publisher(self):
        playbook = (ROOT / "update-netflix-clone.yml").read_text(encoding="utf-8")

        self.assertIn("allow_public_ca_rotation: false", playbook)
        self.assertIn("retire_previous_public_ca: false", playbook)
        self.assertIn("public_ca_overlap_days: 30", playbook)
        self.assertIn("files/publish-public-ca.sh", playbook)
        self.assertIn("Validate and publish the public HTTPS root certificate", playbook)

    def test_publisher_rejects_private_keys_and_unapproved_root_changes(self):
        publisher = (ROOT / "files" / "publish-public-ca.sh").read_text(encoding="utf-8")

        self.assertIn('grep -q "PRIVATE KEY"', publisher)
        self.assertIn('grep -q "CA:TRUE"', publisher)
        self.assertIn('if [ "$allow_rotation" != "true" ]', publisher)
        self.assertIn('chmod 0644 "$current_tmp"', publisher)
        self.assertIn('mtime "+$overlap_days"', publisher)
        self.assertNotIn("rm -rf", publisher)


if __name__ == "__main__":
    unittest.main()
