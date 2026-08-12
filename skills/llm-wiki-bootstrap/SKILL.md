---
name: llm-wiki-bootstrap
description: Initialize, adopt, audit, or document a project-local, Obsidian-compatible LLM Wiki with Source/Wiki/Map layers, authority-aware autonomous updates, deterministic routing and freshness checks, and optional Codex and Claude Code prompt hooks. Use when project Markdown has become hard to find or keep current, when an agent needs bounded automatic knowledge retrieval, when migrating an existing docs folder or Obsidian vault into a governed Wiki, or when validating an existing LLM Wiki without publishing its project content.
---

# LLM Wiki Bootstrap

Build a local knowledge layer that helps agents find evidence without treating generated summaries or graph links as truth. Keep project-specific knowledge in the target project; this skill contributes only the reusable engine, policy, templates, and provider adapters.

## Read before changing a target

- Read `references/wiki-contract.md` completely for every mode.
- For an existing `docs/wiki`, docs collection, Obsidian vault, hook, or agent rule, also read `references/migration-and-safety.md` completely.
- When enabling Codex, Claude Code, or Obsidian integration, read `references/provider-adapters.md` completely.

## Select one mode

- `initialize`: no Wiki exists; install a new core.
- `adopt`: preserve an existing Wiki and add only missing contracts, runtime, skills, or adapters.
- `audit`: inspect and report without writing.
- `document`: explain the installed structure and operating flow without changing it.

Never run `install` against a non-empty `docs/wiki`; use `adopt` or `audit` instead.

## Workflow

### 1. Inventory the target

Read the root agent rules, project truth documents, docs entrypoints, Git status and repository boundaries, local skills, provider settings, hooks, CI, and existing Obsidian configuration. Treat uncommitted files as user-owned.

Classify candidate material before moving or rewriting it:

- Source: code, tests, raw documents, approved decisions, read-only query evidence.
- Wiki: explanatory or navigational Markdown derived from Source.
- Map: contract, Source Registry, generated catalog/graph/index, and source fingerprints.

Do not classify a file by folder name alone. Mixed documents may need section-level ownership instead of whole-file auto-write access.

### 2. Establish authority and privacy

For each Wiki note, assign `authority`, `owner`, `status`, stable `wiki_id`, a one-sentence `summary`, and exact project-relative `source_refs` where applicable.

Autonomous writes require both:

```text
authority: derived
owner: llm
```

Keep canonical, mixed, evidence, human-owned, raw, conflicted, credential-bearing, or extracted-data material protected. Never place absolute personal paths, secrets, raw datasets, or private note bodies in this distributable skill.

### 3. Initialize a clean target

Run the deterministic scaffold from this skill directory:

```text
python scripts/bootstrap_wiki.py install --target <project-root> --project-name "<project name>" --providers codex,claude
```

The command installs the generic Wiki core, project-local runtime skill, root request-loop marker, and selected read-only `UserPromptSubmit` adapters. It proves `build`, an empty initial fingerprint snapshot, and `reconcile` before enabling hooks. Existing provider JSON is merged, not replaced.

Add `--obsidian` to install only portable vault defaults for note location, attachments, link updates, and graph filters. Existing Obsidian files are preserved; personal workspace, sync, plugin, and hotkey state is never created.

Use `--git-mode nested-local` only when the user explicitly wants `docs/wiki` to be an independent local Git repository. It initializes Git with no remote and makes no commit. Otherwise use the default `inherit` mode.

### 4. Adopt an existing Wiki

Run the read-only audit first:

```text
python scripts/bootstrap_wiki.py audit --target <project-root> --providers codex,claude --json
```

Do not replace existing notes, generated files, fingerprint state, root rules, provider settings, or runtime skills with templates. Compare each missing surface to the matching asset, merge the smallest necessary change, and rerun the target's own tests. Preserve project-specific skill names when they already implement the runtime contract.

### 5. Populate target-local knowledge

Inventory the target's actual Sources and edit `docs/wiki/sources/registry.md` locally. Create a small home map and only the first high-value notes; do not bulk-convert all docs merely to increase graph density.

For each material claim:

1. route to the likely note;
2. inspect at most one link/backlink hop when needed;
3. verify against Source;
4. qualify stale, proposed, draft, or conflicted claims;
5. record only a durable delta in an allowed note.

Run `snapshot` only after deliberately verifying the registered Sources. Fingerprint equality means the files did not change; it does not prove every claim is correct.

### 6. Validate before claiming support

Run:

```text
node --check docs/wiki/tools/wiki.mjs
node --test docs/wiki/tests/*.test.mjs
node docs/wiki/tools/wiki.mjs build
node docs/wiki/tools/wiki.mjs lint --json
node docs/wiki/tools/wiki.mjs route "<real project question>" --json
node docs/wiki/tools/wiki.mjs freshness --json
node docs/wiki/tools/wiki.mjs reconcile --json
```

Test synthetic hook input before relying on provider lifecycle behavior. Confirm provider discovery in a real session separately; configuration presence alone is not proof that a host loaded it.

## Boundaries

- Do not add a Stop hook for automatic writing.
- Do not let route score, graph centrality, backlinks, or Obsidian UI determine authority.
- Do not overwrite a target's existing provider settings or agent rules.
- Do not initialize nested Git, add a remote, commit, push, or publish project knowledge without explicit authorization.
- Do not update a fingerprint baseline as routine cleanup.
- Do not claim Obsidian is required; the filesystem CLI must work while Obsidian is closed.

## Handoff

Report the selected mode, Source/Wiki/Map boundaries, files added or preserved, autonomous-write policy, provider adapters enabled, Git boundary, validation evidence, protected conflicts, and any provider or Obsidian checks still requiring a real host session.
