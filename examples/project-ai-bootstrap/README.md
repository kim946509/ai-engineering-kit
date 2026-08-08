# project-ai-bootstrap example

`project-ai-bootstrap`을 완전한 generic engineering preset으로 실행했을 때 프로젝트가 어떻게 구성되고 사용되는지 설명합니다.

이 폴더는 설치되는 스킬이 아닙니다. 사람이 결과를 이해하기 위한 예제이며, 실제 생성 template과 preset은 [`skills/project-ai-bootstrap/assets`](../../skills/project-ai-bootstrap/assets)가 소유합니다.

## What it sets up

- 프로젝트별 AI 규칙과 기준 문서 연결
- 사람과 에이전트가 공유하는 프로젝트 용어
- 작업 상태와 evidence 기반 완료 계약
- 기획부터 릴리스까지 8개 개발 루프
- 별도의 작업 그래프와 하네스 개선 그래프
- 프로젝트 로컬 engineering 스킬과 provenance lock
- 작업 항목, handoff, held-out 평가 template
- 배포·삭제·외부 부작용·자격증명에 대한 사람 승인 경계

## Read next

1. [생성되는 프로젝트 구조](project-structure.md)
2. [설치되는 스킬과 루프 연결](installed-skills.md)
3. [초기화·감사·확장 사용 예시](usage.md)

## Result at a glance

```text
User request
→ repository inventory
→ product anchors and real commands discovery
→ generic AI environment generation
→ project-local skill installation
→ work and improvement graph wiring
→ deterministic validation
→ documented handoff
```

생성 결과는 프로젝트마다 달라질 수 있습니다. 기존 규칙과 동등한 스킬은 중복 설치하지 않고, 실제 애플리케이션이 없으면 build/test 명령을 지어내지 않습니다.
