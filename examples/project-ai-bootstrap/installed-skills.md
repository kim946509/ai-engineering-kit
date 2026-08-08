# Installed skills

이 저장소가 직접 제공하는 스킬은 `project-ai-bootstrap` 하나입니다. 완전한 generic engineering preset을 선택하면 bootstrap 과정에서 다음 11개 외부 스킬을 [Matt Pocock skills](https://github.com/mattpocock/skills)의 고정 ref에서 프로젝트 로컬로 설치합니다.

정확한 기계 판독 목록은 [`generic-engineering-skills.json`](../../skills/project-ai-bootstrap/assets/presets/generic-engineering-skills.json)에 있습니다.

| Skill | Loop | Role |
|---|---|---|
| `project-ai-bootstrap` | 환경 관리 | 초기화, 마이그레이션, 감사, extension 적용 |
| `grill-with-docs` | 기획 | 질문을 통해 요구사항과 문서를 정제 |
| `domain-modeling` | 기획·설계 | 용어, 개념, 도메인 경계 정제 |
| `to-spec` | 명세 | 대화를 검증 가능한 구현 명세로 변환 |
| `to-tickets` | 작업 그래프 | 명세를 의존성이 있는 수직 작업으로 분해 |
| `implement` | 구현 | 명세 기반 구현 흐름 수행 |
| `tdd` | 구현·버그 수정 | red-green-refactor와 회귀 테스트 |
| `diagnosing-bugs` | 진단 | 재현, 가설, 계측, 원인 입증 |
| `codebase-design` | 설계·리팩터링 | 깊은 모듈과 테스트 가능한 경계 설계 |
| `code-review` | 리뷰 | 명세 충실도와 코드 품질을 분리 검토 |
| `research` | 조사·ADR | 1차 출처 기반 기술 조사와 결정 근거 작성 |
| `resolving-merge-conflicts` | 통합 | 양쪽 변경 의도를 보존하며 충돌 해결 |

## Installation rules

- 모든 스킬은 대상 프로젝트의 `.agents/skills/`에 설치한다.
- 이미 같은 역할을 수행하는 스킬이 있으면 중복 설치하지 않는다.
- 설치 source, immutable ref, path와 로컬 hash를 `.ai/skills.lock.json`에 기록한다.
- 대상 에이전트와 맞지 않는 metadata는 동작을 바꾸지 않는 최소 범위에서만 정규화하고 이를 lock에 기록한다.
- 전역 설치는 사용자가 명시적으로 요청한 경우에만 수행한다.

## Not included

- `setup-matt-pocock-skills`: 별도 설정 체계를 추가하므로 preset에 포함하지 않는다.
- Superpowers 전체 방법론: 현재 루프와 중복되는 두 번째 오케스트레이터가 되므로 포함하지 않는다.
- Code Review Graph: 스킬이 아니라 선택적 도구 extension이며, 사용할 수 있는 설치와 CLI/MCP가 있을 때만 연결한다.
