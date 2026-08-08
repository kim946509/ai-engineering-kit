# Development Loop Catalog

Every active loop declares `trigger → goal → inputs → actions → verification → stop → memory`. Replace skill placeholders with installed project-local skill names.

## 1. Planning and domain clarification

- Trigger: new project, new feature, or unclear scope
- Goal: freeze terminology, included and excluded scope, and open decisions
- Inputs: user goal, product sources, policies, ADRs
- Skills: {{PLANNING_SKILLS}}
- Actions: question → conflict check → scenario review → source update
- Verification: human confirmation of scope and unresolved decisions
- Stop: implementable decision or explicit `blocked`
- Memory: `CONTEXT.md`, product sources, ADRs

## 2. Specification and task graph

- Trigger: goal and policy are sufficiently decided
- Goal: produce a verifiable specification and dependency graph
- Inputs: source documents and explicit decisions
- Skills: {{SPECIFICATION_SKILLS}}
- Actions: define AC → choose boundaries → split vertical work → mark blocking edges
- Verification: every work item is independently verifiable and contains no hidden scope
- Stop: each item is `ready` or `blocked`
- Memory: `.ai/work/*.md`, ADRs

## 3. Test-first implementation

- Trigger: one `ready` work item
- Goal: complete one vertical slice test-first
- Inputs: work item, relevant code, architecture rules
- Skills: {{IMPLEMENTATION_SKILLS}}
- Actions: failing test → minimal implementation → passing test → small refactor
- Verification: item-specific command and appropriate regression checks
- Stop: evidence-backed `done` or reasoned `blocked`
- Memory: code, tests, work-item evidence

## 4. Bug diagnosis

- Trigger: reproducible defect or performance regression
- Goal: prove the cause and lock it with a regression test
- Inputs: symptom, logs, history, affected flow
- Skills: {{DIAGNOSIS_SKILLS}}
- Actions: reproduce → minimize → hypothesize → measure → fix → regression test
- Verification: evidence that fails before the fix and passes after it
- Stop: proven cause and regression coverage, or explicit `blocked`
- Memory: tests, diagnosis record, ADR when needed

## 5. Code review

- Trigger: implementation and automated checks are complete
- Goal: independently inspect specification fidelity and engineering quality
- Inputs: fixed comparison point, original specification, repository rules
- Skills: {{REVIEW_SKILLS}}
- Optional observers: {{CODE_GRAPH_OBSERVERS}}
- Actions: refresh observers when configured → inspect diff → review specification → review quality → inspect impact and test gaps → reverify fixes
- Verification: actionable findings resolved or rejected with evidence
- Stop: no unresolved material finding
- Memory: review result and work item

## 6. Documentation synchronization

- Trigger: behavior, API, architecture, or operations changed
- Goal: remove code-document drift
- Inputs: diff, tests, ADRs, user flows
- Skills: {{DOCUMENTATION_SKILLS}}
- Actions: identify changed facts → update only owning documents → remove duplication
- Verification: documented commands, paths, and policies match reality
- Stop: relevant documents are current or a no-change rationale is recorded
- Memory: source documents and ADRs

## 7. Release

- Trigger: release candidate passed integration verification
- Goal: deploy an approved version and preserve recovery evidence
- Inputs: release diff, checks, operating checklist
- Skills: {{RELEASE_SKILLS}}
- Actions: build → test → configuration/security check → human approval → deploy → smoke test
- Verification: health or smoke evidence from the real target
- Stop: successful release or completed rollback
- Memory: version, release evidence, rollback result

## 8. Harness improvement

- Trigger: the same failure recurs at least three times or a human explicitly requests improvement
- Goal: improve one harness element without moving frozen anchors
- Inputs: failure records, time/cost evidence, held-out evaluations
- Skills: {{HARNESS_SKILLS}}
- Actions: classify → hypothesize → change one element → evaluate
- Verification: target evaluation improves without regression elsewhere
- Stop: human-approved keep or immediate rollback
- Memory: environment change record and evaluation result
