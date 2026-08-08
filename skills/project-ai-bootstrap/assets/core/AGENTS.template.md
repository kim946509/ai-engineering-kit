# Project: {{PROJECT_NAME}}

## AI environment

- AI work entrypoint: `.ai/README.md`
- Shared project language: `CONTEXT.md`
- Work and improvement graphs: `.ai/GRAPHS.md`
- Development loops: `.ai/LOOPS.md`
- Environment operations: `docs/AI_ENVIRONMENT.md`
- Project-local skills: `.agents/skills/`
- CRITICAL: Do not weaken product scope, acceptance criteria, tests, security, or privacy rules for implementation convenience.
- CRITICAL: Separate harness-anchor changes from feature work and require explicit human approval.
- CRITICAL: Check approval boundaries before deployment, deletion, cost-incurring work, or external side effects.

## Sources of truth

{{SOURCE_DOCUMENTS}}

## Scope management

- Read the relevant source-of-truth documents before design or implementation.
- Prefer the user's latest explicit decision when it conflicts with existing documentation, then update the owning document before implementation.
- Do not infer new product scope from missing details.

## Architecture

{{ARCHITECTURE_RULES}}

## Development process

- Create a work item from `.ai/templates/work-item.md` before implementation.
- Record intent, scope, acceptance criteria, dependencies, and verification before changing code.
- Run deterministic verification and attach the actual result as evidence before `done`.
- Follow the project's commit convention: {{COMMIT_CONVENTION}}.

## Verified commands

{{VERIFIED_COMMANDS}}

- CRITICAL: Do not record a command as evidence unless it exists and was actually run.
