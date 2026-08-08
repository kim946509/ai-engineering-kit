# AI Development Environment

## Purpose

This project stores AI working rules, state, verification contracts, and reusable procedures in the repository so work remains inspectable and repeatable across sessions.

## Installed environment

```text
.
├── AGENTS.md                 # Project invariants and verified commands
├── CONTEXT.md                # Shared project terminology
├── .ai/
│   ├── README.md             # AI work entrypoint
│   ├── harness.yaml          # Anchors, approvals, states, evidence
│   ├── GRAPHS.md             # Work and improvement graphs
│   ├── LOOPS.md              # Recurring development loops
│   ├── skills.lock.json      # Installed skill provenance and hashes
│   ├── templates/            # Work, handoff, and evaluation templates
│   └── work/                 # Active work graph state
├── .agents/skills/           # Project-local reusable skills
└── docs/                     # Product, architecture, and operation sources
```

## Active skills

{{ACTIVE_SKILLS_AND_LOOP_MAPPING}}

## Operating flow

```text
Planning → specification → task graph → test-first implementation
→ review → integration verification → documentation → release approval
```

Start implementation from a work item with frozen scope and acceptance criteria. Record real commands and results as evidence. Do not use model self-assessment as completion evidence.

## Graph and loop boundary

- The harness provides context, permissions, state, and verification rules.
- Loop Engineering defines repeatable trigger-to-memory contracts for one class of work.
- Graph Engineering connects loops through ownership, cadence, evidence, counter-metrics, veto, and rollback.

The work graph and harness improvement graph remain separate. Feature work cannot change frozen anchors for its own convenience.

## Project-specific verification

{{VERIFICATION_AND_RELEASE_NOTES}}

## Platform extensions

{{ACTIVE_PLATFORM_PROFILES_OR_DEFERRED_REASON}}

## Provenance

- Bootstrap source: `https://github.com/kim946509/ai-engineering-kit`
- Kit version or commit: `{{KIT_VERSION_OR_COMMIT}}`
- Local adaptations: {{LOCAL_ADAPTATIONS}}
