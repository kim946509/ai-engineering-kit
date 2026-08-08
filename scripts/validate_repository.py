#!/usr/bin/env python3
"""Validate the portable structure of AI Engineering Kit."""

from __future__ import annotations

import json
import sys
from pathlib import Path


REQUIRED_PATHS = (
    "README.md",
    "LICENSE",
    "AGENTS.md",
    "skills/project-ai-bootstrap/SKILL.md",
    "skills/project-ai-bootstrap/references/bootstrap-contract.md",
    "skills/project-ai-bootstrap/references/code-review-graph-extension.md",
    "skills/project-ai-bootstrap/assets/core/.ai/harness.yaml",
    "skills/project-ai-bootstrap/assets/presets/generic-engineering-skills.json",
    "skills/project-ai-bootstrap/assets/extensions/code-review-graph/extension.json",
    "skills/project-ai-bootstrap/assets/extensions/code-review-graph/codex/hooks.json",
    "skills/project-ai-bootstrap/assets/extensions/code-review-graph/codex/automations/update-agents-md.template.toml",
    "skills/project-ai-bootstrap/assets/extensions/code-review-graph/templates/AGENTS.snippet.md",
    "examples/project-ai-bootstrap/README.md",
    "examples/project-ai-bootstrap/project-structure.md",
    "examples/project-ai-bootstrap/installed-skills.md",
    "examples/project-ai-bootstrap/usage.md",
)

FORBIDDEN_PORTABLE_TEXT = (
    "Money Snap",
    "moneysnap",
    "C:\\Users\\",
)


def load_json(path: Path, errors: list[str]) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"invalid JSON at {path}: {error}")
        return {}


def read_frontmatter(path: Path) -> dict[str, str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return {}

    if not lines or lines[0].strip() != "---":
        return {}

    result: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return result
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return {}


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.is_file():
        return [f"missing SKILL.md in {skill_dir}"]

    frontmatter = read_frontmatter(skill_file)
    name = frontmatter.get("name")
    description = frontmatter.get("description")
    if not name:
        errors.append(f"missing frontmatter name in {skill_file}")
    elif name != skill_dir.name:
        errors.append(
            f"skill folder '{skill_dir.name}' does not match frontmatter name '{name}'"
        )
    if not description:
        errors.append(f"missing frontmatter description in {skill_file}")
    return errors


def validate_examples(root: Path, errors: list[str]) -> None:
    skills_root = root / "skills"
    examples_root = root / "examples"
    if not skills_root.is_dir():
        return

    for skill_dir in sorted(path for path in skills_root.iterdir() if path.is_dir()):
        if not (examples_root / skill_dir.name).is_dir():
            errors.append(f"missing matching example folder for skill: {skill_dir.name}")


def validate_preset(path: Path, errors: list[str]) -> None:
    preset = load_json(path, errors)
    if not preset:
        return

    source = preset.get("source")
    if not isinstance(source, dict) or not source.get("repository") or not source.get("ref"):
        errors.append(f"preset source must include repository and ref: {path}")
    if preset.get("install_root") != ".agents/skills":
        errors.append(f"preset install_root must be '.agents/skills': {path}")

    skills = preset.get("skills")
    if not isinstance(skills, list) or not skills:
        errors.append(f"preset must contain at least one skill: {path}")
        return

    seen: set[str] = set()
    for index, skill in enumerate(skills):
        if not isinstance(skill, dict):
            errors.append(f"preset skill at index {index} must be an object: {path}")
            continue
        name = skill.get("name")
        if not isinstance(name, str) or not name:
            errors.append(f"preset skill at index {index} is missing a name: {path}")
        elif name in seen:
            errors.append(f"preset contains duplicate skill name '{name}': {path}")
        else:
            seen.add(name)
        if not isinstance(skill.get("path"), str) or not skill["path"]:
            errors.append(f"preset skill '{name}' is missing a path: {path}")
        loops = skill.get("loops")
        if not isinstance(loops, list) or not loops:
            errors.append(f"preset skill '{name}' must map to at least one loop: {path}")


def validate_portability(root: Path, errors: list[str]) -> None:
    scan_roots = (root / "skills", root / "examples")
    for scan_root in scan_roots:
        if not scan_root.exists():
            continue
        for path in scan_root.rglob("*"):
            if not path.is_file() or path.suffix not in {
                ".md",
                ".yaml",
                ".yml",
                ".json",
                ".toml",
            }:
                continue
            text = path.read_text(encoding="utf-8")
            for forbidden in FORBIDDEN_PORTABLE_TEXT:
                if forbidden in text:
                    errors.append(f"portable content contains {forbidden!r}: {path}")


def validate_repository(root: Path) -> list[str]:
    root = root.resolve()
    errors = [
        f"missing required path: {relative}"
        for relative in REQUIRED_PATHS
        if not (root / relative).exists()
    ]

    skills_root = root / "skills"
    if skills_root.is_dir():
        for skill_dir in sorted(path for path in skills_root.iterdir() if path.is_dir()):
            errors.extend(validate_skill(skill_dir))

    validate_examples(root, errors)
    presets_root = root / "skills" / "project-ai-bootstrap" / "assets" / "presets"
    if presets_root.is_dir():
        for preset in sorted(presets_root.glob("*.json")):
            validate_preset(preset, errors)
    validate_portability(root, errors)
    return errors


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    errors = validate_repository(root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Repository validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
