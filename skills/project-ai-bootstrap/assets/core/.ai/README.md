# Project AI Environment

This directory is the project-local AI harness contract. Product requirements belong in the project's source documents, shared agent rules in the repository agent file, shared terminology in `CONTEXT.md`, and reusable procedures in project-local skills.

## Read order

1. Read the project agent rules for invariants and verified commands.
2. Read `CONTEXT.md` and the relevant product sources for terms and scope.
3. Read `.ai/GRAPHS.md` for dependencies and approval boundaries.
4. Select the matching loop from `.ai/LOOPS.md`.
5. Create a work item from `.ai/templates/work-item.md`.
6. Run completion checks and record commands and results as evidence.

## Invariants

- Do not relax goals, acceptance criteria, tests, security rules, or privacy policy.
- Treat product scope, user approval, and held-out evaluations as frozen anchors.
- Complete one independently verifiable work item per implementation loop.
- Do not treat model self-evaluation as completion evidence.
- Separate harness improvement from feature work and change one element per experiment.
- Require human approval for production deployment, destructive work, credentials, costs, and external side effects.

## State model

`proposed → ready → active → verify → done`

- `blocked`: a decision, permission, dependency, or external state prevents progress.
- `rejected`: the work is intentionally discarded because it violates scope or quality criteria.

Fill the work item's verification and evidence sections before moving to `done`.
