---
wiki_id: source-registry
title: LLM Wiki Source Registry
kind: source-registry
authority: canonical
owner: human
status: active
summary: "Wiki가 참조할 프로젝트 원본과 쓰기·검증 정책을 등록하는 문서"
topics:
  - llm-wiki
  - sources
related:
  - "[[../schema/WIKI_CONTRACT]]"
---

# LLM Wiki Source Registry

대상 프로젝트를 조사한 뒤 실제 Source만 프로젝트 상대경로로 등록한다. 자격증명, 개인 절대경로, 원본 데이터 본문과 임시 파일은 기록하지 않는다.

| Source | 역할 | LLM 쓰기 | 검증 방식 |
|---|---|---:|---|
| `AGENTS.md`와 프로젝트 규칙 | 운영 계약과 승인 경계 | 사람의 요청 범위에서만 | 문서와 실제 설정 비교 |
| 실제 코드와 테스트 | 구현 근거 | 별도 코드 작업 규칙에 따름 | 빌드·테스트·코드 확인 |
| 승인된 제품 문서 | 제품 결정과 요구사항 | 기본 금지 | 원본과 사람 검토 |

외부 URL은 fingerprint 대상이 아니다. 대형 디렉터리는 비용을 피하도록 필요한 하위 범위만 등록한다.
