---
wiki_id: wiki-home
title: "{{PROJECT_NAME}} LLM Wiki"
kind: map
authority: canonical
owner: human
status: active
summary: "{{PROJECT_NAME}}의 Source-backed 지식을 사람과 LLM이 함께 탐색하는 진입점"
topics:
  - llm-wiki
  - project-knowledge
related:
  - "[[schema/WIKI_CONTRACT]]"
  - "[[sources/registry]]"
---

# {{PROJECT_NAME}} LLM Wiki

이 폴더는 프로젝트 원본을 복사하는 저장소가 아니라, 원본을 찾고 검증하기 위한 Obsidian 호환 지식 계층이다.

## 세 계층

1. **Source** — 코드, 테스트, 원본 문서, 승인된 결정처럼 실제 주장을 검증하는 근거다.
2. **Wiki** — Source를 연결하고 설명하는 Markdown 노트다. `authority: derived`, `owner: llm`인 노트만 LLM이 자율 갱신한다.
3. **Map** — 운영 계약, Source Registry, 생성 index·graph·fingerprint다. 탐색과 쓰기 경계를 기계적으로 검사한다.

## 기본 명령

프로젝트 루트에서 실행한다.

```text
node docs/wiki/tools/wiki.mjs route "질문" --json
node docs/wiki/tools/wiki.mjs neighbors "wiki_id" --json
node docs/wiki/tools/wiki.mjs freshness --json
node docs/wiki/tools/wiki.mjs reconcile --json
```

`route`, `neighbors`, `freshness`, `lint`는 읽기 전용이다. `build`와 `reconcile`은 generated Map만 다시 만든다. Source를 실제로 재검증한 경우에만 `snapshot`으로 fingerprint 기준선을 바꾼다.

운영 규칙은 [[schema/WIKI_CONTRACT]], 원본 범위는 [[sources/registry]]를 따른다.
