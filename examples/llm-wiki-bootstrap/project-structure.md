# 생성되는 프로젝트 구조

기본 설치 결과는 다음과 같습니다.

```text
project/
├── AGENTS.md                         # 매 요청 Wiki 루프 marker를 병합
├── CLAUDE.md                         # Claude가 공용 규칙을 읽는 진입점
├── .agents/skills/project-llm-wiki/
│   └── SKILL.md                      # provider-neutral runtime 절차
├── .codex/hooks.json                 # 선택: 읽기 전용 UserPromptSubmit
├── .claude/
│   ├── settings.json                 # 선택: 읽기 전용 UserPromptSubmit
│   └── skills/project-llm-wiki/
│       └── SKILL.md
└── docs/wiki/
    ├── README.md                     # 사람과 LLM의 Wiki 진입점
    ├── index.md                      # 자동 생성
    ├── schema/WIKI_CONTRACT.md       # 메타데이터·권위·쓰기 계약
    ├── sources/registry.md           # 실제 Source 위치와 검증 정책
    ├── generated/
    │   ├── catalog.json              # 노트 metadata projection
    │   └── graph.json                # link/backlink projection
    ├── state/sources.json            # 검토 후 만든 Source fingerprint 기준선
    ├── tools/wiki.mjs                # 공용 route/freshness/lint CLI
    └── tests/
        ├── wiki.test.mjs
        └── fixtures/                 # 제품과 무관한 합성 fixture
```

프로젝트별 지식 노트는 설치 후 대상 프로젝트 안에서만 추가합니다. 스킬 저장소에는 실제 노트, Source Registry 항목, 생성 catalog·graph, fingerprint state를 넣지 않습니다.

## Wiki 노트 예시

```yaml
---
wiki_id: component-ownership
title: Component ownership
kind: guide
authority: derived
owner: llm
status: verified
summary: "컴포넌트 소유권과 검증 경로를 설명"
source_refs:
  - "docs/architecture/component.md"
related:
  - "[[deployment-policy]]"
---
```

`authority: derived`와 `owner: llm`이 동시에 있어야만 LLM이 자율 수정할 수 있습니다.

## Git 선택

- 일반 Git 프로젝트: 기존 저장소가 `docs/wiki`를 함께 추적하는 `inherit`가 기본입니다.
- Git이 없는 중앙 작업공간: 명시적으로 `nested-local`을 선택하면 `docs/wiki/.git`만 만들고 remote는 추가하지 않습니다.
- 설치기는 커밋하거나 push하지 않습니다.
