import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "validate_repository.py"


def load_validator():
    spec = importlib.util.spec_from_file_location("validate_repository", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RepositoryValidationTests(unittest.TestCase):
    def test_repository_passes_validation(self):
        validator = load_validator()

        self.assertEqual([], validator.validate_repository(ROOT))

    def test_missing_required_surface_is_reported(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            errors = validator.validate_repository(Path(directory))

        self.assertTrue(any("missing required path" in error for error in errors))

    def test_skill_folder_must_match_frontmatter_name(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            skill = Path(directory) / "sample-skill"
            skill.mkdir()
            (skill / "SKILL.md").write_text(
                "---\nname: different-name\ndescription: test\n---\n",
                encoding="utf-8",
            )

            errors = validator.validate_skill(skill)

        self.assertIn(
            "skill folder 'sample-skill' does not match frontmatter name 'different-name'",
            errors,
        )

    def test_skill_requires_matching_example_folder(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            skill = root / "skills" / "sample-skill"
            skill.mkdir(parents=True)
            (skill / "SKILL.md").write_text(
                "---\nname: sample-skill\ndescription: test\n---\n",
                encoding="utf-8",
            )
            errors = []

            validator.validate_examples(root, errors)

        self.assertIn(
            "missing matching example folder for skill: sample-skill",
            errors,
        )

    def test_preset_skill_names_must_be_unique(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            preset = Path(directory) / "preset.json"
            preset.write_text(
                json.dumps(
                    {
                        "name": "test",
                        "source": {
                            "repository": "https://example.com/skills",
                            "ref": "abc123",
                        },
                        "install_root": ".agents/skills",
                        "skills": [
                            {"name": "duplicate", "path": "skills/a", "loops": ["a"]},
                            {"name": "duplicate", "path": "skills/b", "loops": ["b"]},
                        ],
                    }
                ),
                encoding="utf-8",
            )
            errors = []

            validator.validate_preset(preset, errors)

        self.assertIn(
            f"preset contains duplicate skill name 'duplicate': {preset}",
            errors,
        )

    def test_portability_rejects_private_project_paths(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            skill = root / "skills" / "sample-skill"
            skill.mkdir(parents=True)
            path = skill / "SKILL.md"
            path.write_text(
                "---\nname: sample-skill\ndescription: test\n---\n"
                "Read C:\\source\\private-project\\docs.\n",
                encoding="utf-8",
            )
            errors = []

            validator.validate_portability(root, errors)

        self.assertTrue(
            any("portable content contains" in error and "source" in error for error in errors),
            errors,
        )


if __name__ == "__main__":
    unittest.main()
