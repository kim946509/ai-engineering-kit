# Provider and Obsidian adapters

## Contents

1. Shared runtime
2. Codex
3. Claude Code
4. Obsidian
5. Verification

## Shared runtime

All agents use the same filesystem command:

```text
node docs/wiki/tools/wiki.mjs hook UserPromptSubmit --json
```

The handler reads hook JSON from stdin, routes the prompt, and emits bounded context containing at most three note paths with authority, owner, status, writability, and summaries. It never writes Wiki notes.

## Codex

Merge the handler into `.codex/hooks.json` under `hooks.UserPromptSubmit`. Use a project-relative command and a short timeout. Existing hooks must remain in their original order. A host may require project trust or a new session before discovering changed hooks.

## Claude Code

Merge the handler into `.claude/settings.json` and anchor the command at `${CLAUDE_PROJECT_DIR}`. Preserve `.claude/settings.local.json`; it is local state and must not become a reusable template. Install the runtime skill under `.claude/skills/` without Codex-only `agents/openai.yaml` metadata.

Use `CLAUDE.md` to import or point to the shared root agent rules. Do not duplicate the entire project contract in both files.

## Obsidian

Obsidian is the human navigation surface, not the agent's database. Open the project root as a vault so Wiki notes can link to Sources elsewhere in the project. Recommended settings are:

- new notes under `docs/wiki`;
- attachments under `docs/wiki/assets`;
- automatic link updates enabled;
- Graph filters focused on `path:"docs/wiki"` and excluding operational `generated`, `tests`, and `tools` paths.

Do not distribute `workspace.json`, sync configuration, enabled-community-plugin state, or personal hotkeys. The common CLI must remain functional while Obsidian is closed.

## Verification

First feed synthetic JSON to the hook and verify valid JSON output, bounded results, conflict preservation, and no filesystem writes. Then verify actual provider discovery in a fresh target session. For Obsidian, inspect links, backlinks, unresolved links, orphans, and properties through read-only commands or the UI.

Configuration syntax and handler tests prove the adapter files are valid. They do not prove a particular desktop or CLI host loaded the hook until that host is exercised.
