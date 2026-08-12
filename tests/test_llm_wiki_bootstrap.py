import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP = ROOT / "skills" / "llm-wiki-bootstrap" / "scripts" / "bootstrap_wiki.py"


class LlmWikiBootstrapTests(unittest.TestCase):
    def run_bootstrap(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(BOOTSTRAP), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_install_creates_a_runnable_project_local_wiki(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            result = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex,claude",
            )

            self.assertEqual(0, result.returncode, result.stderr)
            expected = (
                "AGENTS.md",
                ".agents/skills/project-llm-wiki/SKILL.md",
                ".agents/skills/project-llm-wiki/agents/openai.yaml",
                ".claude/skills/project-llm-wiki/SKILL.md",
                ".codex/hooks.json",
                ".claude/settings.json",
                "docs/wiki/README.md",
                "docs/wiki/schema/WIKI_CONTRACT.md",
                "docs/wiki/sources/registry.md",
                "docs/wiki/tools/wiki.mjs",
                "docs/wiki/tests/wiki.test.mjs",
                "docs/wiki/generated/catalog.json",
                "docs/wiki/generated/graph.json",
                "docs/wiki/index.md",
            )
            for relative in expected:
                self.assertTrue((target / relative).is_file(), relative)
            self.assertFalse(
                (target / ".claude/skills/project-llm-wiki/agents/openai.yaml").exists()
            )

            codex = json.loads((target / ".codex/hooks.json").read_text(encoding="utf-8"))
            claude = json.loads((target / ".claude/settings.json").read_text(encoding="utf-8"))
            self.assertIn("UserPromptSubmit", codex["hooks"])
            self.assertIn("UserPromptSubmit", claude["hooks"])
            self.assertIn("Sample Project", (target / "docs/wiki/README.md").read_text(encoding="utf-8"))

    def test_install_refuses_an_existing_wiki_without_partial_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            existing = target / "docs" / "wiki" / "README.md"
            existing.parent.mkdir(parents=True)
            existing.write_text("# User-owned wiki\n", encoding="utf-8")

            result = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex,claude",
            )

            self.assertNotEqual(0, result.returncode)
            self.assertIn("already exists", result.stderr)
            self.assertEqual("# User-owned wiki\n", existing.read_text(encoding="utf-8"))
            self.assertFalse((target / "docs/wiki/tools/wiki.mjs").exists())
            self.assertFalse((target / ".codex/hooks.json").exists())

    def test_audit_verifies_an_installed_wiki_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            installed = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex,claude",
            )
            self.assertEqual(0, installed.returncode, installed.stderr)
            before = {
                path.relative_to(target).as_posix(): path.read_bytes()
                for path in target.rglob("*")
                if path.is_file()
            }

            audited = self.run_bootstrap(
                "audit",
                "--target",
                str(target),
                "--providers",
                "codex,claude",
                "--json",
            )
            after = {
                path.relative_to(target).as_posix(): path.read_bytes()
                for path in target.rglob("*")
                if path.is_file()
            }

            self.assertEqual(0, audited.returncode, audited.stderr)
            report = json.loads(audited.stdout)
            self.assertTrue(report["ok"])
            self.assertEqual([], report["errors"])
            self.assertTrue(report["freshness"]["fresh"])
            self.assertEqual(before, after)

    def test_nested_local_git_mode_creates_no_remote(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            result = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex",
                "--git-mode",
                "nested-local",
            )

            self.assertEqual(0, result.returncode, result.stderr)
            wiki = target / "docs" / "wiki"
            self.assertTrue((wiki / ".git").is_dir())
            remotes = subprocess.run(
                ["git", "remote"],
                cwd=wiki,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(0, remotes.returncode, remotes.stderr)
            self.assertEqual("", remotes.stdout.strip())

    def test_audit_handles_utf8_project_and_note_names(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            installed = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "샘플 프로젝트",
                "--providers",
                "codex,claude",
            )
            self.assertEqual(0, installed.returncode, installed.stderr)
            note = target / "docs" / "wiki" / "한국어-노트.md"
            note.write_text(
                "---\n"
                "wiki_id: korean-note\n"
                "title: 한국어 노트\n"
                "kind: guide\n"
                "authority: derived\n"
                "owner: llm\n"
                "status: verified\n"
                'summary: "한국어 경로 출력 검증"\n'
                "source_refs:\n"
                '  - "AGENTS.md"\n'
                "related:\n"
                '  - "[[README]]"\n'
                "---\n\n# 한국어 노트\n",
                encoding="utf-8",
            )
            subprocess.run(
                ["node", "docs/wiki/tools/wiki.mjs", "build"],
                cwd=target,
                check=True,
                capture_output=True,
            )
            subprocess.run(
                ["node", "docs/wiki/tools/wiki.mjs", "snapshot"],
                cwd=target,
                check=True,
                capture_output=True,
            )

            audited = self.run_bootstrap(
                "audit",
                "--target",
                str(target),
                "--providers",
                "codex,claude",
                "--json",
            )

            self.assertEqual(0, audited.returncode, audited.stderr)
            self.assertTrue(json.loads(audited.stdout)["ok"])

    def test_obsidian_adapter_installs_only_portable_vault_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            result = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex",
                "--obsidian",
            )

            self.assertEqual(0, result.returncode, result.stderr)
            app = json.loads((target / ".obsidian/app.json").read_text(encoding="utf-8"))
            graph = json.loads((target / ".obsidian/graph.json").read_text(encoding="utf-8"))
            self.assertEqual("docs/wiki", app["newFileFolderPath"])
            self.assertIn("path:docs/wiki", graph["search"])
            self.assertFalse((target / ".obsidian/workspace.json").exists())
            self.assertFalse((target / ".obsidian/core-plugins.json").exists())

    def test_install_merges_rules_and_hooks_without_replacing_existing_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / ".codex").mkdir(parents=True)
            (target / ".claude").mkdir(parents=True)
            (target / "AGENTS.md").write_text("# Existing rules\n\nKeep this.\n", encoding="utf-8")
            (target / "CLAUDE.md").write_text("# Existing Claude rules\n", encoding="utf-8")
            existing_hook = {"hooks": {"UserPromptSubmit": [{"hooks": [{"type": "command", "command": "existing-hook"}]}]}}
            (target / ".codex/hooks.json").write_text(json.dumps(existing_hook), encoding="utf-8")
            (target / ".claude/settings.json").write_text(
                json.dumps({"permissions": {"allow": ["Read"]}, **existing_hook}),
                encoding="utf-8",
            )

            result = self.run_bootstrap(
                "install",
                "--target",
                str(target),
                "--project-name",
                "Sample Project",
                "--providers",
                "codex,claude",
            )

            self.assertEqual(0, result.returncode, result.stderr)
            agents = (target / "AGENTS.md").read_text(encoding="utf-8")
            claude = (target / "CLAUDE.md").read_text(encoding="utf-8")
            self.assertIn("Keep this.", agents)
            self.assertEqual(1, agents.count("<!-- llm-wiki-bootstrap:start -->"))
            self.assertIn("# Existing Claude rules", claude)
            self.assertIn("@AGENTS.md", claude)
            for path in (target / ".codex/hooks.json", target / ".claude/settings.json"):
                text = path.read_text(encoding="utf-8")
                self.assertIn("existing-hook", text)
                self.assertEqual(1, text.count("hook UserPromptSubmit --json"))
            settings = json.loads((target / ".claude/settings.json").read_text(encoding="utf-8"))
            self.assertEqual(["Read"], settings["permissions"]["allow"])


if __name__ == "__main__":
    unittest.main()
