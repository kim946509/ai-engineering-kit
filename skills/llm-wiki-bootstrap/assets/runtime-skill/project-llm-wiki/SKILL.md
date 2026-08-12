---
name: project-llm-wiki
description: Route, verify, and maintain project knowledge through a local Obsidian-compatible LLM Wiki. Use for requests that depend on project concepts, decisions, architecture, documentation, source evidence, or that may produce reusable knowledge; also use for Wiki routing, backlinks, freshness, conflicts, and derived-note maintenance.
---

# Project LLM Wiki

Read `docs/wiki/schema/WIKI_CONTRACT.md` before changing Wiki content.

## Retrieve before acting

1. Run `node docs/wiki/tools/wiki.mjs route "<exact user request>" --json` from the project root.
2. Read only the top relevant notes, normally one to three.
3. Use `neighbors` for one link/backlink hop only when the topic crosses notes or contains a conflict.
4. Check authority, owner, status, source references, and freshness.
5. Verify material claims against actual code, tests, source documents, or approved read-only data.

## Harvest durable deltas

- Change nothing when the work produced no reusable knowledge.
- Autonomously create or update only `authority: derived` and `owner: llm` notes.
- Do not modify canonical, mixed, evidence, human-owned, raw, or product-decision sources.
- Preserve conflicting claims with exact sources and request human review.
- After an allowed change, run `node docs/wiki/tools/wiki.mjs reconcile --json`.
- Run `snapshot` only after deliberately re-verifying every affected registered Source.

## Degraded mode

If the CLI fails, search `docs/wiki/**/*.md` with `rg`, apply the same authority policy, and report the failed command. Obsidian is optional and never replaces Source verification.
