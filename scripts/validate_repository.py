#!/usr/bin/env python3
"""Validate the portable structure of AI Engineering Kit."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REQUIRED_PATHS = (
    "README.md",
    "LICENSE",
    "AGENTS.md",
    "catalog.json",
    ".codex-plugin/plugin.json",
    "skills/project-ai-bootstrap/SKILL.md",
    "skills/project-ai-bootstrap/references/bootstrap-contract.md",
    "skills/project-ai-bootstrap/assets/core/.ai/harness.yaml",
    "docs/architecture.md",
    "docs/compatibility.md",
    "profiles/README.md",
    "profiles/code-review-graph/README.md",
    "profiles/code-review-graph/profile.json",
    "profiles/code-review-graph/codex/hooks.json",
    "profiles/code-review-graph/codex/automations/update-agents-md.template.toml",
    "profiles/code-review-graph/templates/AGENTS.snippet.md",
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


def validate_plugin(root: Path, errors: list[str]) -> None:
    path = root / ".codex-plugin" / "plugin.json"
    if not path.is_file():
        return

    plugin = load_json(path, errors)
    if plugin.get("name") != root.name:
        errors.append("plugin name must match the repository folder name")
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(plugin.get("version", ""))):
        errors.append("plugin version must use strict semantic versioning")
    if plugin.get("skills") != "./skills/":
        errors.append("plugin skills path must be './skills/'")

    prompts = plugin.get("interface", {}).get("defaultPrompt", [])
    if not isinstance(prompts, list) or not 1 <= len(prompts) <= 3:
        errors.append("plugin defaultPrompt must contain one to three prompts")
    elif any(not isinstance(prompt, str) or len(prompt) > 128 for prompt in prompts):
        errors.append("plugin prompts must be strings of at most 128 characters")


def validate_catalog(root: Path, errors: list[str]) -> None:
    path = root / "catalog.json"
    if not path.is_file():
        return

    catalog = load_json(path, errors)
    for component in catalog.get("skills", []):
        relative_path = component.get("path")
        if not relative_path or not (root / relative_path).is_dir():
            errors.append(f"catalog skill path does not exist: {relative_path}")
    for component in catalog.get("profiles", []):
        relative_path = component.get("path")
        if relative_path and not (root / relative_path).is_dir():
            errors.append(f"catalog profile path does not exist: {relative_path}")


def validate_portability(root: Path, errors: list[str]) -> None:
    scan_roots = (root / "skills", root / "docs")
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

    validate_plugin(root, errors)
    validate_catalog(root, errors)
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
