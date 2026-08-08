# Usage examples

## Install the skill locally

```text
Install project-ai-bootstrap from
https://github.com/kim946509/ai-engineering-kit/tree/main/skills/project-ai-bootstrap
into this project's .agents/skills directory.
```

## Initialize a complete generic environment

```text
Use $project-ai-bootstrap to initialize this repository with the generic engineering preset. Preserve existing product documents and install skills project-locally.
```

The skill inventories the repository first, generates only missing control surfaces, installs non-duplicated preset skills, writes provenance, and validates the result.

## Migrate an existing harness

```text
Use $project-ai-bootstrap in migrate mode. Inspect the old harness, preserve product truth and uncommitted user changes, and replace unsafe or duplicated automation only after defining its replacement.
```

## Audit without changes

```text
Use $project-ai-bootstrap in audit mode and report missing surfaces, stale commands, untracked skill provenance, weak approval boundaries, and graph/loop gaps. Do not modify files.
```

## Add Code Review Graph later

```text
Use $project-ai-bootstrap in extend mode to add the Code Review Graph extension. Merge with existing hooks and automation settings instead of overwriting them, and verify one incremental update.
```

This extension adds an event-driven graph freshness loop and a slower weekly `AGENTS.md` maintenance loop. It does not make graph findings a substitute for tests, builds, source inspection, or human approval.

## Normal feature workflow after setup

```text
planning and domain clarification
→ specification
→ dependency-aware work items
→ test-first implementation
→ code review and impact analysis
→ integration verification
→ documentation sync
→ release approval
```

Every work item starts with frozen intent, scope, acceptance criteria, dependencies, and verification. It reaches `done` only after actual evidence is recorded.
