# Bootstrap Contract

## Required surfaces

| Surface | Canonical target | Responsibility |
|---|---|---|
| Agent rules | `AGENTS.md` or target-agent equivalent | Project invariants and verified commands |
| Shared language | `CONTEXT.md` | Terms shared by humans and agents |
| Harness entrypoint | `.ai/README.md` | Read order, state model, immutable principles |
| Machine policy | `.ai/harness.yaml` | Anchors, approvals, states, evidence requirements |
| Graphs | `.ai/GRAPHS.md` | Separate work and improvement graphs |
| Loop catalog | `.ai/LOOPS.md` | Trigger through memory for recurring work |
| Work state | `.ai/work/` | Small work items, dependencies, and evidence |
| Templates | `.ai/templates/` | Work item, handoff, and held-out evaluation |
| Local skills | `.agents/skills/` by default | Project-local reusable procedures |
| Skill lock | `.ai/skills.lock.json` | Provenance and integrity hashes |
| Human guide | `docs/AI_ENVIRONMENT.md` | How this project operates its AI environment |

Use the matching files under `assets/core/` as starting points. Adapt paths to an established target-agent convention instead of creating duplicate control surfaces.

## Required loops

Start with the smallest useful set drawn from:

1. planning and domain clarification;
2. specification and task graph creation;
3. test-first feature delivery;
4. bug diagnosis and regression coverage;
5. code review and impact analysis;
6. documentation synchronization;
7. release readiness and human approval;
8. harness improvement with held-out evaluation and rollback.

Each active loop declares trigger, goal, inputs, frozen anchors, actions or mapped skills, deterministic verification, terminal states, memory, owner, and cadence.

## Graph Engineering requirements

- Maintain separate work and improvement graphs.
- Pair every optimization metric with a counter-metric.
- Assign target ownership to a slower or human-governed loop.
- Separate fast implementation cadence from architecture, security, and release cadence.
- Freeze user decisions, product scope, security policy, acceptance criteria, and held-out evaluations.
- Give audit or governance nodes authority to veto and roll back changes.

## Migration rules

1. List old harness files and inspect their contents.
2. Preserve product documents and unrelated user changes.
3. Define replacements before removing unsafe or redundant hooks and executors.
4. Keep runtime-generated graph databases and logs untracked.
5. Record deliberate omissions and the condition that will activate them later.

## Validation checklist

- [ ] Required surfaces exist or have an explicit reason for omission.
- [ ] Agent rules point to the AI environment entrypoint.
- [ ] No verification command is invented or stale.
- [ ] Every installed skill maps to an active loop.
- [ ] Skill provenance and hashes are recorded.
- [ ] Work cannot reach `done` without evidence.
- [ ] Fast loops cannot modify frozen anchors.
- [ ] External side effects and deployment require human approval.
- [ ] Harness changes use one-variable experiments and rollback.
- [ ] Platform-specific extensions remain separate from the generic core.
