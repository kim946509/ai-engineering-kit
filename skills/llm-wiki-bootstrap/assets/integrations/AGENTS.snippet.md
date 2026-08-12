<!-- llm-wiki-bootstrap:start -->
## LLM Wiki request loop

For project requests that may depend on project knowledge:

1. Run `node docs/wiki/tools/wiki.mjs route "<exact user request>" --json` before planning or answering.
2. Read the top one to three notes. Use `neighbors` for one hop only when needed.
3. Check authority, owner, status, source references, and freshness; verify important claims against actual Source.
4. Before finishing, record only reusable durable deltas and only in `authority: derived`, `owner: llm` notes.
5. Never resolve conflicts or update fingerprint baselines automatically. Run `reconcile` after allowed Wiki changes.

The Wiki routes evidence; it does not outrank code, tests, approved documents, or explicit user decisions.
<!-- llm-wiki-bootstrap:end -->
