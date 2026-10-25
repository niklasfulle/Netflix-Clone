import json
import pathlib
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class VideoAnalysisDeploymentContract(unittest.TestCase):
    def test_app_and_worker_share_optional_host_settings_without_inline_credentials(self):
        docker = shutil.which("docker")
        if docker is None:
            self.skipTest("Docker Compose is required")
        result = subprocess.run(
            [docker, "compose", "-f", str(ROOT / "docker-compose.yml"), "config", "--no-env-resolution", "--format", "json"],
            cwd=ROOT, check=True, capture_output=True, text=True,
        )
        services = json.loads(result.stdout)["services"]
        for name in ("app", "jobs-worker"):
            env_files = services[name]["env_file"]
            model_file = [item for item in env_files if pathlib.PurePath(item["path"]).name == "video-analysis.env"]
            self.assertEqual(1, len(model_file))
            self.assertFalse(model_file[0]["required"])
            self.assertNotIn("VIDEO_ANALYSIS_API_KEY", services[name].get("environment", {}))
        self.assertNotIn("video-analysis.env", str(services["jobs-migrate"]["env_file"]))

    def test_ansible_preserves_operator_settings_and_checks_secret_file_metadata(self):
        template = (ROOT / "ansible/docker-compose.yml.j2").read_text(encoding="utf-8")
        self.assertEqual(2, template.count("path: /root/netflix-secrets/video-analysis.env"))
        playbook = (ROOT / "ansible/update-netflix-clone.yml").read_text(encoding="utf-8")
        check = playbook.split("name: Inspect optional external model configuration", 1)[1].split("name: Verify protected Redis credential files", 1)[0]
        self.assertIn("no_log: true", check)
        self.assertIn("video_analysis_env.stat.mode == '0600'", check)
        self.assertIn("video_analysis_env.stat.uid == 0", check)
        self.assertNotIn("copy:", check)
        self.assertNotIn("slurp:", check)


if __name__ == "__main__":
    unittest.main()
