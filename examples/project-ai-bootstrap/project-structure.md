# Generated project structure

완전한 generic engineering preset의 기본 결과입니다.

```text
target-project/
├── AGENTS.md
├── CONTEXT.md
├── docs/
│   └── AI_ENVIRONMENT.md
├── .ai/
│   ├── README.md
│   ├── harness.yaml
│   ├── GRAPHS.md
│   ├── LOOPS.md
│   ├── skills.lock.json
│   ├── templates/
│   │   ├── work-item.md
│   │   ├── handoff.md
│   │   └── evaluation.md
│   └── work/
│       └── README.md
└── .agents/
    └── skills/
        ├── project-ai-bootstrap/
        ├── grill-with-docs/
        ├── domain-modeling/
        ├── to-spec/
        ├── to-tickets/
        ├── implement/
        ├── tdd/
        ├── diagnosing-bugs/
        ├── codebase-design/
        ├── code-review/
        ├── research/
        └── resolving-merge-conflicts/
```

## File responsibilities

| Path | Responsibility |
|---|---|
| `AGENTS.md` | 프로젝트 불변 규칙, 기준 문서, 실제 검증 명령 |
| `CONTEXT.md` | 사람과 에이전트가 함께 쓰는 용어와 제품 불변 조건 |
| `.ai/README.md` | AI 작업 시작점과 읽는 순서 |
| `.ai/harness.yaml` | frozen anchor, 승인 경계, 상태, evidence 계약 |
| `.ai/GRAPHS.md` | 기획부터 릴리스까지의 work graph와 별도 improvement graph |
| `.ai/LOOPS.md` | trigger부터 memory까지 반복 가능한 개발 루프 |
| `.ai/skills.lock.json` | 설치 스킬의 원본 ref, 경로, 정규화와 SHA-256 |
| `.ai/work/` | 의존성과 evidence가 있는 활성 작업 항목 |
| `docs/AI_ENVIRONMENT.md` | 이 프로젝트에서 실제 활성화된 AI 환경 설명 |
| `.agents/skills/` | 이 프로젝트에서만 사용하는 로컬 스킬 |

## What is not generated automatically

- 존재하지 않는 build, test, lint, deploy 명령
- 제품 문서에 없는 기능이나 정책
- 완전 자율 에이전트 런타임
- 검증되지 않은 hook이나 CI 강제 규칙
- iOS, web, backend 등 플랫폼별 extension

Code Review Graph를 명시적으로 확장하면 스킬 내부 [`code-review-graph` extension](../../skills/project-ai-bootstrap/references/code-review-graph-extension.md)의 hook·automation template을 기존 설정에 병합합니다. 그래프 DB 자체는 `.code-review-graph/`에 생성하고 추적하지 않습니다.
