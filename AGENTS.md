# AI Engineering Kit

## Repository purpose

This repository publishes reusable AI development environments, skills, harness contracts, loops, and graph-oriented workflows. Keep reusable content product-neutral.

## Source of truth

- Public component catalog: `catalog.json`
- Portable skills: `skills/`
- Environment and platform overlays: `profiles/`
- Architecture and compatibility rules: `docs/`
- Codex distribution metadata: `.codex-plugin/plugin.json`

## Contribution rules

- Keep shared skill behavior agent-neutral where practical.
- Isolate provider-specific manifests and metadata from portable skill instructions.
- Do not claim an agent or platform is supported until installation and invocation are tested.
- Do not copy third-party skills without checking their license and preserving attribution.
- Keep templates free of product names, secrets, personal paths, and invented verification commands.
- Require external evidence before generated project work reaches `done`.
- Use conventional commits.

## Validation

```text
python -m unittest discover -s tests -v
python scripts/validate_repository.py
```
