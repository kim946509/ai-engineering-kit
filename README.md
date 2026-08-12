# AI Engineering Kit

실제 프로젝트에서 사용하며 다듬은 AI 개발 스킬과 환경 설정 방법을 모아 공유하는 저장소입니다.

현재 제공하는 스킬은 두 개입니다. 새로운 스킬이나 플러그인이 준비되면 각각 독립된 폴더로 추가합니다.

## Skills

### project-ai-bootstrap

새 프로젝트의 AI 개발 환경을 초기화하거나, 기존 하네스를 마이그레이션·감사·확장하는 스킬입니다. 프로젝트 안에 에이전트 규칙, 공용 언어, 작업 상태, 개발 루프, 작업/개선 그래프, 검증 계약과 프로젝트 로컬 스킬을 구성합니다.

- [스킬 소스](skills/project-ai-bootstrap/SKILL.md)
- [사용하면 무엇이 만들어지는지](examples/project-ai-bootstrap/README.md)
- [생성되는 프로젝트 구조](examples/project-ai-bootstrap/project-structure.md)
- [설치되는 스킬과 역할](examples/project-ai-bootstrap/installed-skills.md)
- [사용 예시](examples/project-ai-bootstrap/usage.md)

### llm-wiki-bootstrap

프로젝트의 코드·테스트·원본 문서를 Source로 유지하면서, Obsidian Markdown 노트와 생성 Map을 통해 LLM이 필요한 지식을 제한적으로 찾고 최신화하도록 구성하는 스킬입니다. 새 Wiki 초기화, 기존 docs/Wiki 도입, 읽기 전용 감사, Codex·Claude Code prompt hook과 local-only Git 선택을 지원합니다.

- [스킬 소스](skills/llm-wiki-bootstrap/SKILL.md)
- [문제와 해결 구조](examples/llm-wiki-bootstrap/README.md)
- [생성되는 프로젝트 구조](examples/llm-wiki-bootstrap/project-structure.md)
- [초기화·도입·감사 사용법](examples/llm-wiki-bootstrap/usage.md)
- [안전과 공개 경계](examples/llm-wiki-bootstrap/safety-and-privacy.md)

## Codex에서 설치

대상 프로젝트에서 Codex에 다음과 같이 요청합니다.

```text
Install project-ai-bootstrap from
https://github.com/kim946509/ai-engineering-kit/tree/main/skills/project-ai-bootstrap
into this project's .agents/skills directory.
```

설치 후 전체 범용 환경을 구성합니다.

```text
Use $project-ai-bootstrap to initialize this project with the generic engineering preset.
```

LLM Wiki만 추가하려면 다음 스킬을 별도로 설치합니다.

```text
Install llm-wiki-bootstrap from
https://github.com/kim946509/ai-engineering-kit/tree/main/skills/llm-wiki-bootstrap
into this project's .agents/skills directory.
```

```text
Use $llm-wiki-bootstrap to initialize or audit a project-local LLM Wiki.
```

스킬 설치·발견·명시 호출의 실제 검증 대상은 Codex입니다. `llm-wiki-bootstrap`은 Codex와 Claude Code용 hook·runtime skill을 생성하고 공용 handler를 테스트하지만, 각 host가 설정을 실제로 발견했는지는 대상 프로젝트의 새 세션에서 별도로 확인해야 합니다. Cursor 지원은 아직 표시하지 않습니다.

## Repository convention

```text
ai-engineering-kit/
├── skills/
│   └── <skill-name>/           # 설치 가능한 독립 스킬
├── examples/
│   └── <skill-name>/           # 결과 구조, 설치 항목, 사용 예시
└── plugins/
    └── <plugin-name>/          # 실제 플러그인이 생길 때 추가
```

현재 플러그인은 제공하지 않으므로 `plugins/` 폴더도 만들지 않습니다. 스킬에 필요한 template, preset, 선택적 extension은 해당 스킬의 `assets/`가 소유합니다.

## Validation

```bash
python -m unittest discover -s tests -v
python scripts/validate_repository.py
```

## License

[MIT](LICENSE)
