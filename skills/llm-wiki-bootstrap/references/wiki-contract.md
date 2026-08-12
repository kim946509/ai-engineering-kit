# LLM Wiki contract

## Contents

1. Purpose
2. Three layers
3. Note metadata
4. Retrieval and update loops
5. Generated state
6. What the graph can and cannot do

## Purpose

An LLM Wiki is a governed routing layer over project evidence. It improves discovery, bounded context selection, freshness detection, and durable knowledge capture. It does not make summaries authoritative and does not replace source code, tests, approved product documents, or explicit human decisions.

## Three layers

| Layer | Responsibility | Typical paths |
|---|---|---|
| Source | Evidence used to verify claims | code, tests, raw docs, approved decisions |
| Wiki | Obsidian-compatible explanatory notes | `docs/wiki/**/*.md` |
| Map | Machine-checkable navigation and policy | `schema/`, `sources/`, `generated/`, `state/`, `tools/` |

Generated JSON and index files belong to Map. They are rebuildable projections, not a fourth knowledge layer.

## Note metadata

Every indexed note requires:

- `wiki_id`: stable kebab-case identity independent of filename;
- `title`: human-readable title;
- `kind`: map, guide, concept, decision-log, schema, source-registry, or a project-specific category;
- `authority`: canonical, derived, evidence, or mixed;
- `owner`: human or llm;
- `status`: verified, active, draft, proposed, stale, or conflicted;
- `summary`: one sentence useful in bounded route output.

Derived notes also require one or more `source_refs`. Use project-relative paths. External URLs are allowed but are not content-fingerprinted.

Only `derived + llm` is autonomously writable. `owner: llm` with any other authority is a lint error.

## Retrieval and update loops

At request start, route lexically from the exact request, read one to three notes, expand at most one graph hop when needed, then verify claims against Source. At request end, write only a durable delta that will help later work. A trivial rephrasing, temporary debugging observation, or unverified guess is not a durable delta.

Conflicts remain visible until a human decides. A conflict note should retain both claims, exact sources, status `conflicted`, and a clear open decision.

## Generated state

- `build` regenerates `index.md`, `generated/catalog.json`, and `generated/graph.json` only when content changes.
- `snapshot` writes source paths, sizes, and SHA-256 fingerprints after deliberate verification.
- `freshness` compares current Source fingerprints with the last snapshot.
- `lint` validates metadata, authority/owner safety, links, Sources, duplicate IDs, and generated-index drift.
- `reconcile` runs build, freshness, and lint as one gate.

Do not expose fingerprint state when it would reveal private filenames or project structure.

## What the graph can and cannot do

Wikilinks and backlinks make nearby context discoverable. They do not prove truth, recency, causal relationships, or importance. Initial routing is lexical plus metadata; graph traversal is bounded navigation. Authority, status, Source references, and direct verification decide whether a claim is usable.
