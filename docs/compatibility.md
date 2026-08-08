# Compatibility

## Support levels

- `supported`: installation, discovery, invocation, and core workflow have been tested.
- `experimental`: an adapter exists but has incomplete evaluation or known limitations.
- `planned`: no usable adapter is shipped yet.

## Current matrix

| Agent | Status | Distribution surface |
|---|---|---|
| Codex | supported | `.codex-plugin/plugin.json`, `agents/openai.yaml` |
| Claude Code | planned | none |
| Cursor | planned | none |

The portable `SKILL.md` format is intentionally kept free of unnecessary Codex-only behavior. That design goal does not by itself count as support for another agent.

## Adding another agent

1. Reuse the existing `skills/` source.
2. Add only the manifest, hook mapping, or metadata required by the target agent.
3. Test installation, automatic or explicit invocation, bundled assets, and project-local output.
4. Record limitations and change the catalog status only after validation.

Provider-specific hooks must not silently weaken human approvals, frozen anchors, sandbox boundaries, or evidence requirements defined by the portable core.
