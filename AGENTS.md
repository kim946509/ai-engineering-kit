# AI Engineering Kit

## Repository purpose

Publish reusable AI development skills and, only when they actually exist, plugins. Keep each distributable component in its own folder.

## Source of truth

- Installable skills: `skills/<skill-name>/`
- Human-facing examples: `examples/<skill-name>/`
- Future plugins: `plugins/<plugin-name>/`
- Repository validation: `scripts/` and `tests/`

## Contribution rules

- Keep a skill self-contained: instructions in `SKILL.md`, detailed contracts in `references/`, and generated output in `assets/`.
- Do not add README or other human-facing catalog documents inside an installable skill folder; put them in the matching `examples/<skill-name>/` folder.
- Keep optional extensions owned by the skill that installs them.
- Create `plugins/<plugin-name>/` only for an actual distributable plugin.
- Do not claim support until installation, discovery, invocation, and output have been tested.
- Do not copy third-party skills without checking their license and preserving attribution.
- Keep templates free of product names, secrets, personal paths, and invented commands.
- Use conventional commits.

## Validation

```text
python -m unittest discover -s tests -v
python scripts/validate_repository.py
```
