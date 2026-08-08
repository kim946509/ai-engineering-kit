## Code Review Graph

- Build the local code graph once after installation and update it after relevant source changes.
- Start graph-assisted tasks with the smallest available context query, then request deeper impact, flow, or architecture data only when needed.
- Prefer incremental or delta review after the first full build.
- Keep `.code-review-graph/` runtime state untracked.
- Treat graph findings as supporting evidence. They do not replace source inspection, specifications, tests, builds, or human approval.
- Keep automatic graph updates fast; run expensive full builds, flow post-processing, or embeddings only when their value justifies the cost.
- Review periodic `AGENTS.md` maintenance diffs before adopting them. Fast implementation work must not rewrite frozen product, security, or release rules.
