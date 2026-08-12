#!/usr/bin/env python3
"""Install or audit a project-local, source-backed LLM Wiki."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
CORE = SKILL_ROOT / "assets" / "core"
RUNTIME_SKILL = SKILL_ROOT / "assets" / "runtime-skill" / "project-llm-wiki"
AGENTS_SNIPPET = SKILL_ROOT / "assets" / "integrations" / "AGENTS.snippet.md"
OBSIDIAN = SKILL_ROOT / "assets" / "obsidian"
MARKER = "<!-- llm-wiki-bootstrap:start -->"


def copy_tree(
    source: Path,
    destination: Path,
    project_name: str,
    excluded: set[str] | None = None,
) -> None:
    excluded = excluded or set()
    for path in sorted(source.rglob("*")):
        relative = path.relative_to(source)
        if relative.as_posix() in excluded:
            continue
        target = destination / relative
        if path.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            continue
        try:
            body = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            shutil.copy2(path, target)
        else:
            target.write_text(body.replace("{{PROJECT_NAME}}", project_name), encoding="utf-8")


def append_agents_rules(target: Path) -> None:
    agents = target / "AGENTS.md"
    current = agents.read_text(encoding="utf-8") if agents.exists() else "# Project agent instructions\n"
    if MARKER not in current:
        snippet = AGENTS_SNIPPET.read_text(encoding="utf-8").strip()
        agents.write_text(f"{current.rstrip()}\n\n{snippet}\n", encoding="utf-8")


def merge_hook(path: Path, command: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    hooks = data.setdefault("hooks", {})
    groups = hooks.setdefault("UserPromptSubmit", [])
    exists = any(
        hook.get("command") == command
        for group in groups
        for hook in group.get("hooks", [])
        if isinstance(hook, dict)
    )
    if not exists:
        groups.append({"hooks": [{"type": "command", "command": command, "timeout": 10}]})
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(data, indent=2)}\n", encoding="utf-8")


def install_runtime_skill(target: Path, providers: set[str], project_name: str) -> None:
    copy_tree(RUNTIME_SKILL, target / ".agents" / "skills" / "project-llm-wiki", project_name)
    if "claude" in providers:
        copy_tree(
            RUNTIME_SKILL,
            target / ".claude" / "skills" / "project-llm-wiki",
            project_name,
            excluded={"agents/openai.yaml"},
        )


def run_node(target: Path, *arguments: str) -> None:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required to build and validate the Wiki")
    result = subprocess.run(
        [node, "docs/wiki/tools/wiki.mjs", *arguments],
        cwd=target,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())


def parse_providers(raw: str) -> set[str]:
    providers = {item.strip() for item in raw.split(",") if item.strip()}
    unsupported = providers - {"codex", "claude"}
    if unsupported:
        raise ValueError(f"unsupported providers: {', '.join(sorted(unsupported))}")
    return providers


def contains_command(path: Path, expected: str) -> bool:
    if not path.is_file():
        return False
    data = json.loads(path.read_text(encoding="utf-8"))

    def visit(value: object) -> bool:
        if isinstance(value, dict):
            if value.get("command") == expected:
                return True
            return any(visit(item) for item in value.values())
        if isinstance(value, list):
            return any(visit(item) for item in value)
        return False

    return visit(data)


def wiki_skill_exists(root: Path) -> bool:
    return any(
        "wiki.mjs route" in path.read_text(encoding="utf-8")
        for path in root.glob("*/SKILL.md")
        if path.is_file()
    )


def execute(command: list[str], target: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=target,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )


def install(args: argparse.Namespace) -> int:
    target = Path(args.target).resolve()
    wiki_root = target / "docs" / "wiki"
    if wiki_root.is_dir() and any(wiki_root.iterdir()):
        raise ValueError(
            f"{wiki_root} already exists; use audit/adopt workflow instead of install"
        )
    target.mkdir(parents=True, exist_ok=True)
    providers = parse_providers(args.providers)

    copy_tree(CORE, target, args.project_name)
    append_agents_rules(target)
    install_runtime_skill(target, providers, args.project_name)
    if args.obsidian:
        copy_tree(OBSIDIAN, target / ".obsidian", args.project_name)

    # Prove the deterministic manual loop before activating provider hooks.
    run_node(target, "build")
    run_node(target, "snapshot")
    run_node(target, "reconcile")

    if "codex" in providers:
        merge_hook(
            target / ".codex" / "hooks.json",
            'node "docs/wiki/tools/wiki.mjs" hook UserPromptSubmit --json',
        )
    if "claude" in providers:
        merge_hook(
            target / ".claude" / "settings.json",
            'node "${CLAUDE_PROJECT_DIR}/docs/wiki/tools/wiki.mjs" hook UserPromptSubmit --json',
        )
        claude = target / "CLAUDE.md"
        current = claude.read_text(encoding="utf-8") if claude.exists() else ""
        if "@AGENTS.md" not in current:
            claude.write_text(f"@AGENTS.md\n\n{current.lstrip()}", encoding="utf-8")
    if args.git_mode == "nested-local":
        git = shutil.which("git")
        if not git:
            raise RuntimeError("Git is required for --git-mode nested-local")
        result = execute([git, "init", "-b", "main", "docs/wiki"], target)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    print(json.dumps({
        "git_mode": args.git_mode,
        "installed": True,
        "obsidian": args.obsidian,
        "providers": sorted(providers),
        "target": str(target),
    }))
    return 0


def audit(args: argparse.Namespace) -> int:
    target = Path(args.target).resolve()
    providers = parse_providers(args.providers)
    errors: list[str] = []
    required = (
        "AGENTS.md",
        "docs/wiki/README.md",
        "docs/wiki/schema/WIKI_CONTRACT.md",
        "docs/wiki/sources/registry.md",
        "docs/wiki/tools/wiki.mjs",
        "docs/wiki/tests/wiki.test.mjs",
        "docs/wiki/generated/catalog.json",
        "docs/wiki/generated/graph.json",
        "docs/wiki/index.md",
        "docs/wiki/state/sources.json",
    )
    for relative in required:
        if not (target / relative).is_file():
            errors.append(f"missing required file: {relative}")

    if not wiki_skill_exists(target / ".agents" / "skills"):
        errors.append("missing project-local Wiki runtime skill under .agents/skills")

    commands = {
        "codex": 'node "docs/wiki/tools/wiki.mjs" hook UserPromptSubmit --json',
        "claude": 'node "${CLAUDE_PROJECT_DIR}/docs/wiki/tools/wiki.mjs" hook UserPromptSubmit --json',
    }
    configs = {
        "codex": target / ".codex" / "hooks.json",
        "claude": target / ".claude" / "settings.json",
    }
    for provider in sorted(providers):
        try:
            present = contains_command(configs[provider], commands[provider])
        except json.JSONDecodeError as error:
            errors.append(f"invalid {provider} hook JSON: {error}")
            present = True
        if not present:
            errors.append(f"missing {provider} UserPromptSubmit Wiki hook")
    if "claude" in providers and not wiki_skill_exists(target / ".claude" / "skills"):
        errors.append("missing Claude Wiki runtime skill under .claude/skills")

    node = shutil.which("node")
    checks: dict[str, dict[str, object]] = {}
    freshness: dict[str, object] = {}
    if not node:
        errors.append("Node.js is required to audit the Wiki")
    elif (target / "docs/wiki/tools/wiki.mjs").is_file():
        test_files = sorted((target / "docs/wiki/tests").glob("*.test.mjs"))
        commands_to_run = {
            "node_check": [node, "--check", "docs/wiki/tools/wiki.mjs"],
            "node_test": [node, "--test", *[str(path) for path in test_files]],
            "lint": [node, "docs/wiki/tools/wiki.mjs", "lint", "--json"],
            "freshness": [node, "docs/wiki/tools/wiki.mjs", "freshness", "--json"],
        }
        for name, command in commands_to_run.items():
            result = execute(command, target)
            checks[name] = {"returncode": result.returncode}
            if name == "freshness" and result.stdout.strip():
                freshness = json.loads(result.stdout)
            if result.returncode != 0:
                detail = result.stderr.strip() or result.stdout.strip()
                errors.append(f"{name} failed: {detail}")

    report = {
        "checks": checks,
        "errors": errors,
        "freshness": freshness,
        "ok": not errors,
        "providers": sorted(providers),
        "target": str(target),
    }
    print(json.dumps(report, indent=None if args.json else 2))
    return 0 if report["ok"] else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    install_parser = subparsers.add_parser("install")
    install_parser.add_argument("--target", required=True)
    install_parser.add_argument("--project-name", required=True)
    install_parser.add_argument("--providers", default="codex")
    install_parser.add_argument(
        "--git-mode",
        choices=("inherit", "nested-local"),
        default="inherit",
    )
    install_parser.add_argument("--obsidian", action="store_true")
    install_parser.set_defaults(handler=install)
    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("--target", required=True)
    audit_parser.add_argument("--providers", default="codex")
    audit_parser.add_argument("--json", action="store_true")
    audit_parser.set_defaults(handler=audit)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.handler(args)
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(f"llm-wiki-bootstrap: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
