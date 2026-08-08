# AI Engineering Kit

프로젝트에서 실제로 사용하며 다듬은 AI 개발 환경, 스킬, 하네스, 피드백 루프와 Graph Engineering 패턴을 모아 공유하는 저장소입니다.

특정 모델에 종속된 거대한 실행기를 만드는 대신, 프로젝트 안에 남는 규칙·문서·스킬·검증 계약을 중심으로 구성합니다. 현재는 Codex를 지원하며, 공통 코어를 복제하지 않고 Claude Code와 Cursor 어댑터를 추가할 수 있는 구조를 유지합니다.

> A growing collection of reusable AI engineering environments, skills, harnesses, loops, and graph-oriented workflows. Codex is supported first; other agents will be added through adapters.

## 현재 제공하는 것

| 구성요소 | 상태 | 설명 |
|---|---|---|
| `project-ai-bootstrap` | 사용 가능 | 프로젝트 로컬 AI 개발 환경을 초기화·마이그레이션·감사·확장 |
| Generic Core Blueprint | 사용 가능 | 에이전트 규칙, 상태, 루프, 작업/개선 그래프, 증거 템플릿 |
| Codex plugin manifest | 사용 가능 | 저장소의 스킬을 Codex 플러그인으로 노출 |
| Code Review Graph profile | 실험적 | 변경 후 graph update와 주기적 `AGENTS.md` 유지보수 루프 |
| iOS profile | 예정 | SwiftUI, Xcode, Simulator, 성능·메모리·릴리스 루프 |
| Claude Code adapter | 예정 | 공통 스킬을 Claude Code에서 배포·호출하는 어댑터 |
| Cursor adapter | 예정 | 공통 스킬을 Cursor에서 배포·호출하는 어댑터 |

## 빠른 시작 — Codex

Codex에 다음과 같이 요청하면 프로젝트 로컬 설치를 진행할 수 있습니다.

```text
Install project-ai-bootstrap from
https://github.com/kim946509/ai-engineering-kit/tree/main/skills/project-ai-bootstrap
into this project's .agents/skills directory.
```

설치 후 대상 프로젝트에서 호출합니다.

```text
Use $project-ai-bootstrap to initialize a project-local AI development environment.
```

기존 환경은 `migrate`, 읽기 전용 점검은 `audit`, 플랫폼 추가는 generic core 안정화 후 `extend` 방식으로 요청합니다.

## 저장소 구조

```text
ai-engineering-kit/
├── .codex-plugin/              # 현재 지원하는 Codex 배포 manifest
├── skills/                     # 에이전트 간 공유할 수 있는 SKILL.md 패키지
│   └── project-ai-bootstrap/
│       ├── SKILL.md
│       ├── agents/openai.yaml  # Codex UI metadata
│       ├── references/
│       └── assets/core/        # 생성할 프로젝트 환경의 원본
├── profiles/                   # iOS 같은 선택적 환경 확장 계약
│   └── code-review-graph/      # 그래프 갱신 및 AGENTS.md 유지보수 루프
├── catalog.json                # 공개 구성요소와 지원 상태
├── docs/                       # 저장소 아키텍처와 호환성 정책
├── scripts/                    # 저장소 자체의 결정론적 검증
└── tests/
```

공통 로직은 `skills/`와 각 스킬의 `assets/`에 둡니다. `.codex-plugin`, 향후의 `.claude-plugin` 또는 Cursor 설정은 같은 공통 스킬을 가리키는 얇은 어댑터만 담당합니다.

## 설계 원칙

- 프로젝트 로컬 설치를 기본으로 한다.
- 제품 기준 문서와 AI 운영 규칙을 분리한다.
- 모델의 완료 주장보다 테스트·빌드·리뷰 같은 외부 증거를 우선한다.
- 작업 그래프와 하네스 개선 그래프를 분리한다.
- 빠른 구현 루프가 제품 범위, 보안, AC, held-out 평가를 변경하지 못하게 한다.
- 자동화와 훅은 수동 루프가 유용하고 결정적임을 확인한 뒤 추가한다.
- 지원하지 않는 에이전트나 플랫폼을 지원한다고 표시하지 않는다.

## 확장 방향

새 스킬은 `skills/<skill-name>/`에 독립 패키지로 추가합니다. 특정 개발 환경은 `profiles/`의 계약과 필요한 스킬 조합으로 추가합니다. 외부 스킬은 무단 복제하지 않고 출처, 고정 ref, 경로, 라이선스를 기록한 manifest로 연결하는 것을 우선합니다.

현재 사용 중인 Code Review Graph 자동 갱신과 주간 `AGENTS.md` 유지보수 방식은 [Code Review Graph 프로필](profiles/code-review-graph/README.md)에 재사용 가능한 템플릿으로 정리했습니다.

자세한 내용은 [아키텍처](docs/architecture.md), [호환성 정책](docs/compatibility.md), [기여 가이드](CONTRIBUTING.md)를 참고하세요.

## 검증

```bash
python -m unittest discover -s tests -v
python scripts/validate_repository.py
```

## License

[MIT](LICENSE)
