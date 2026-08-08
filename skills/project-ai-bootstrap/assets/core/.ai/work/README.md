# Work graph state

Copy `.ai/templates/work-item.md` into this directory for active work. Use names such as `WORK-001-short-name.md`.

- Express blocking edges through `depends_on`.
- Use `ready` only when dependencies and required decisions are resolved.
- Keep at most one `active` item per agent unless the graph explicitly allows parallel work.
- Fill verification and evidence before `done`.
- Preserve completed items only when they carry durable product or technical decision value.
- Do not commit transient execution logs.
