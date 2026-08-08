---
name: project-ai-bootstrap
description: Initialize, migrate, audit, extend, or document a portable project-local AI development environment. Use when starting AI-assisted development in a repository, replacing an ad-hoc harness, installing project-local skills, defining planning/development/test/review/release loops, designing work and improvement graphs, or adding a platform-specific profile after the generic core is stable.
---

# Project AI Bootstrap

Build the smallest reliable project-local AI environment. Keep product truth, agent instructions, reusable skills, work state, verification, and improvement governance separate.

## Resources

- Read `references/bootstrap-contract.md` completely before changing a target repository.
- Use `assets/core/` as the canonical generic template when initializing or migrating.
- Adapt every `{{PLACEHOLDER}}` to the target repository. Never leave placeholders or invent build, test, lint, format, or deployment commands.

## Workflow

1. Inventory the target repository.
   - Read agent rules, product documents, architecture records, real verification commands, local skills, hooks, CI, and git status.
   - Treat uncommitted changes as user-owned.
   - Identify an old harness precisely; do not classify product documents as harness files.

2. Select one mode.
   - `initialize`: create a generic core where none exists.
   - `migrate`: replace an existing harness while preserving product truth and user changes.
   - `audit`: report gaps without modifying files.
   - `extend`: add one platform or tool profile after the core is stable.

3. Create or repair the required surfaces.
   - Copy and adapt only the files needed from `assets/core/`.
   - Keep reusable skills under `.agents/skills/` unless the target agent has an explicit project-local convention.
   - Keep agent-independent control files under `.ai/`.
   - Keep project-specific facts in the repository's source-of-truth documents.
   - Keep provider-specific manifests separate from the portable core.

4. Install only skills mapped to active loops.
   - Prefer project-local installation.
   - Record source repository, immutable ref, path, normalization, and local SHA-256 values in `.ai/skills.lock.json`.
   - Do not install globally unless explicitly requested.

5. Adapt verification to the project.
   - Discover and run real build, test, lint, format, and deployment checks where available.
   - Put authoritative commands in the project agent rules.
   - Require deterministic evidence before a work item reaches `done`.
   - Keep destructive operations, credentials, external side effects, and production deployment behind human approval.

6. Validate the environment.
   - Check required files, links, skill metadata, provenance, and hashes.
   - Confirm fast loops cannot rewrite frozen product, security, acceptance, or evaluation anchors.
   - Confirm improvement experiments change one element at a time and can roll back.
   - Report platform-specific work deferred because code, tooling, or a profile does not exist yet.

## Boundaries

- Do not create a custom agent runtime when the host already provides tools, approvals, sandboxing, sessions, and subagents.
- Do not add hooks until the equivalent manual verification loop is proven useful and deterministic.
- Do not let an executor approve its own completion without external evidence.
- Do not mix the generic core and a platform-specific extension in one migration.
- Do not overwrite product documents with generic templates.
- Do not claim support for an AI agent until its installation and invocation path has been tested.

## Output

Summarize files added, removed, and preserved; installed skills and loop mappings; work and improvement graphs; frozen anchors; human approval boundaries; validation evidence; and deferred extensions.
