---
wiki_id: wiki-contract
title: LLM Wiki 운영 계약
kind: schema
authority: canonical
owner: human
status: active
summary: "LLM Wiki의 검색, 근거 확인, 자율 쓰기와 검증 경계"
topics:
  - llm-wiki
  - governance
related:
  - "[[../README]]"
  - "[[../sources/registry]]"
---

# LLM Wiki 운영 계약

## 요청 시작의 읽기 루프

1. 사용자 요청을 그대로 `route`에 전달한다.
2. 상위 노트 1~3개만 읽는다.
3. 주제가 교차하거나 충돌할 때만 `neighbors`로 한 hop 확장한다.
4. `authority`, `owner`, `status`, `source_refs`, `freshness`를 확인한다.
5. 중요한 주장은 실제 Source로 다시 검증한다. 검색 순위와 graph 중심성은 권위가 아니다.

## 종료 전 갱신 루프

- 장기적으로 재사용할 durable delta가 없으면 Wiki를 수정하지 않는다.
- `authority: derived`이면서 `owner: llm`인 노트와 generated Map만 자율 수정한다.
- `canonical`, `mixed`, `evidence`, `owner: human`, raw Source는 자동 수정하지 않는다.
- 충돌은 한쪽을 선택하지 않고 `status: conflicted`로 보존해 사람의 결정을 요청한다.
- 허용된 노트를 바꾼 뒤 링크·요약·근거를 함께 정리하고 `reconcile`을 실행한다.

## 필수 frontmatter

```yaml
---
wiki_id: stable-kebab-case-id
title: 사람이 읽는 제목
kind: guide
authority: derived
owner: llm
status: verified
summary: "검색 결과에서 판단할 수 있는 한 문장"
topics:
  - example
source_refs:
  - "docs/source/example.md"
related:
  - "[[다른-노트]]"
---
```

`wiki_id`는 제목이나 경로가 바뀌어도 유지한다. `source_refs`는 원본 내용을 복제하지 않고 프로젝트 상대경로만 기록한다.

## 상태

| status | 의미 |
|---|---|
| `verified` | 연결된 근거를 확인함 |
| `active` | 현재 운영 중인 기록 또는 정책 |
| `draft` | 정리 중인 가설 |
| `proposed` | 사람 승인 전 제안 |
| `stale` | Source 변경 또는 오래된 경로가 발견됨 |
| `conflicted` | 둘 이상의 Source가 충돌함 |

`draft`, `proposed`, `stale`, `conflicted`는 확정 사실처럼 사용하지 않는다.

## 자동 진입

Codex와 Claude의 `UserPromptSubmit` hook은 같은 읽기 전용 handler로 수렴한다.

```text
node docs/wiki/tools/wiki.mjs hook UserPromptSubmit --json
```

handler는 최대 3개 노트의 경로·권위·상태·요약만 주입한다. 자동 쓰기용 Stop hook은 설치하지 않는다.
