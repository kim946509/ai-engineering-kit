# Migration and safety

## Contents

1. Inventory
2. Mode selection
3. Existing-content classification
4. Non-destructive adoption
5. Git and publication boundaries
6. Failure handling

## Inventory

Before writing, inspect all root agent rules, provider settings, local skills, docs indexes, raw-document locations, generated transcripts, Git repositories, uncommitted changes, and existing Obsidian vault state. Record exact repository boundaries; a workspace may contain several independent repositories or none at its root.

## Mode selection

- Initialize only when `docs/wiki` is absent or empty.
- Adopt when a Wiki, docs routing system, or provider hook already exists.
- Audit when the user asked for diagnosis, review, permission checking, or a compatibility report.
- Document when the implementation is already stable and the goal is human understanding.

The scaffold refuses a non-empty `docs/wiki` so an installer cannot silently combine two ownership systems.

## Existing-content classification

Classify each file or section as raw Source, approved decision, evidence, derived explanation, generated projection, or transient state. Do not move open Office files, lock files, binary originals, generated source outputs, or mixed-authority documents without separate review.

Graph links are not a reason to convert every document. Prefer a small number of stable maps and high-value notes that point to existing Sources.

## Non-destructive adoption

Run audit first. Merge provider JSON structurally and append bounded marker blocks to agent rules; never replace whole files. Keep provider-local permission files, personal Obsidian workspace state, plugin state, credentials, logs, raw source data, generated project catalogs, and fingerprint state out of reusable assets.

If the target already has a project-specific runtime skill implementing route, one-hop neighbors, freshness, durable-delta handling, and the same write boundary, preserve its name instead of installing a duplicate generic skill.

## Git and publication boundaries

Default to the target repository's existing Git boundary. An independent local `docs/wiki/.git` is appropriate only when the workspace root is not a repository or the user explicitly wants separate history. In that mode:

- initialize only `docs/wiki`;
- add no remote;
- make no automatic commit;
- never stage nested code repositories;
- report that local model-provider access and cloud-sync tools are separate from GitHub publication.

Before publishing the reusable skill, scan `skills/llm-wiki-bootstrap` and its examples for project names, note titles, usernames, absolute paths, secrets, raw Sources, catalog/graph output, and fingerprint state.

## Failure handling

If install fails before provider activation, leave hooks disabled and report created files. If audit, lint, tests, or freshness fail, do not snapshot, commit, or claim support. Preserve conflicts and user changes; propose the smallest next action with exact evidence.
