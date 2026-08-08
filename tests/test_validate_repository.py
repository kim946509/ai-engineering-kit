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

    def test_catalog_profile_path_must_exist(self):
        validator = load_validator()

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "catalog.json").write_text(
                json.dumps(
                    {
                        "skills": [],
                        "profiles": [
                            {"name": "missing-profile", "path": "profiles/missing"}
                        ],
                    }
                ),
                encoding="utf-8",
            )
            errors = []

            validator.validate_catalog(root, errors)

        self.assertIn(
            "catalog profile path does not exist: profiles/missing",
            errors,
        )


if __name__ == "__main__":
    unittest.main()
