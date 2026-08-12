# 안전과 공개 경계

## 자동 수정 가능

- `authority: derived`
- `owner: llm`
- 실제 Source로 확인한 durable delta
- `build`가 재생성하는 index·catalog·graph

## 사람 검토가 필요한 항목

- canonical, mixed, evidence, human-owned 노트
- 승인되지 않은 제품 결정과 충돌
- raw 문서, 원본 binary, 데이터 추출물
- 자격증명과 개인 경로
- fingerprint 기준선 갱신
- Git 경계 변경, remote 추가, commit, push

## 공개 스킬에 포함하는 것

- 범용 Wiki 운영 계약
- 제품 중립적인 CLI와 합성 테스트 fixture
- Codex·Claude hook 병합 방식
- runtime skill과 구조 예시

## 공개 스킬에 포함하지 않는 것

- 대상 프로젝트의 실제 Wiki 노트
- 실제 Source Registry 행
- 생성 catalog·graph·index
- Source path·크기·hash가 들어간 fingerprint state
- Obsidian workspace, sync, 개인 plugin 설정
- provider local permission 파일
- 사용자명, 개인 절대경로, 자격증명, 원본 데이터

Git remote가 없다는 사실은 GitHub에 push할 경로가 없다는 뜻입니다. 모델 제공자에게 선택된 문맥이 전달되는지, OneDrive 같은 동기화 프로그램이 파일을 복제하는지는 별도 경계입니다.
