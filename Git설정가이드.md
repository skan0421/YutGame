# YutGame Git 저장소 설정 가이드

## 1. 초기 설정

```bash
# YutGame 폴더로 이동
cd C:\Users\user\Desktop\YutGame

# Git 초기화
git init

# 현재 콘솔 버전을 phase-0-console로 이름 변경
# (Windows 탐색기에서 yut-console → phase-0-console)

# 또는 명령어로:
move yut-console phase-0-console
```

## 2. .gitignore 생성

```bash
# .gitignore 파일 생성 (아래 내용 복사)
notepad .gitignore
```

## 3. README.md 생성

```bash
# README.md 파일 생성 (아래 내용 복사)
notepad README.md
```

## 4. 첫 번째 커밋

```bash
git add .
git commit -m "첫 커밋: Phase 0 - 콘솔 버전"
git tag -a v0.1.0 -m "Phase 0: 순수 자바 콘솔 게임"
```

## 5. GitHub 저장소 생성 및 연결

```bash
# GitHub에서 새 저장소 생성 (yut-game)
# 그 다음:

git remote add origin https://github.com/본인아이디/yut-game.git
git branch -M main
git push -u origin main
git push origin v0.1.0
```

## 6. 다음 단계 개발 시

```bash
# phase-1-web 폴더 생성
mkdir phase-1-web

# 작업 진행...

# 커밋
git add phase-1-web/
git commit -m "Phase 1 추가: Spring Boot 웹 버전"

# 주요 마일스톤마다 태그
git tag -a v1.0.0 -m "Phase 1: 웹 버전 MVP 완성"
git push origin main
git push origin v1.0.0
```

## 7. 브랜치 전략

### 메인 브랜치
- `main`: 안정된 버전만
- `develop`: 개발 진행 중

### 기능 브랜치
- `feature/phase-1-setup`: Phase 1 초기 설정
- `feature/websocket`: WebSocket 구현
- `feature/ui-design`: UI 개선

```bash
# 기능 브랜치 생성
git checkout -b feature/phase-1-setup

# 작업 후
git add .
git commit -m "Spring Boot 프로젝트 구조 설정"

# main에 합치기
git checkout main
git merge feature/phase-1-setup
git branch -d feature/phase-1-setup
```

## 8. 버전 태그 전략

### 버전 번호 규칙
- v0.x.x: Phase 0 (콘솔)
- v1.x.x: Phase 1 (웹 MVP)
- v2.x.x: Phase 2 (배포 + 개선)
- v3.x.x: Phase 3 (고급 기능)

### 예시
```bash
git tag -a v0.1.0 -m "콘솔 버전 - 초기"
git tag -a v1.0.0 -m "웹 버전 - MVP 완성"
git tag -a v1.1.0 -m "웹 버전 - 채팅 기능 추가"
git tag -a v2.0.0 -m "프로덕션 배포"
```

## 9. 커밋 메시지 규칙

```bash
# 형식: [Phase-N] 타입: 제목

[Phase-0] 기능: 기본 게임 로직 추가
[Phase-1] 수정: WebSocket 연결 문제 해결
[Phase-1] 문서: API 문서 업데이트
[Phase-2] 배포: CI/CD 파이프라인 추가
```

**타입:**
- `기능`: 새 기능
- `수정`: 버그 수정
- `문서`: 문서 작업
- `리팩토링`: 코드 정리
- `테스트`: 테스트 추가
- `배포`: 배포 관련

## 10. GitHub 프로젝트 보드 활용 (선택)

### Issues로 작업 관리
```
Phase 1 작업:
- [ ] #1 Spring Boot 프로젝트 생성
- [ ] #2 데이터베이스 설계
- [ ] #3 도메인 로직 통합
- [ ] #4 REST API 구현
- [ ] #5 WebSocket 구현
- [ ] #6 웹 UI 개발
```

### 마일스톤
```
마일스톤: Phase 1 MVP
- 마감일: 2025-03-15
- 이슈: #1, #2, #3, #4, #5, #6
```

---

## 💡 Git 사용 팁

### 커밋하기 전에
```bash
# 변경된 파일 확인
git status

# 변경 내용 확인
git diff
```

### 특정 파일만 커밋
```bash
git add 파일명.java
git commit -m "특정 파일만 수정"
```

### 커밋 메시지 수정
```bash
# 마지막 커밋 메시지 수정
git commit --amend -m "새로운 메시지"
```

### 브랜치 관리
```bash
# 브랜치 목록 보기
git branch

# 브랜치 삭제
git branch -d 브랜치명

# 원격 브랜치 삭제
git push origin --delete 브랜치명
```

---

## 🔄 일반적인 작업 흐름

### 1. 새 기능 시작
```bash
git checkout develop
git pull origin develop
git checkout -b feature/새기능
```

### 2. 작업 중
```bash
# 파일 수정...

git add .
git commit -m "[Phase-1] 기능: 새 기능 구현"
```

### 3. GitHub에 올리기
```bash
git push origin feature/새기능
```

### 4. Pull Request 생성
- GitHub 웹사이트에서 PR 생성
- 코드 리뷰 (혼자면 생략)
- Merge

### 5. 로컬에서 정리
```bash
git checkout develop
git pull origin develop
git branch -d feature/새기능
```

---

## ⚠️ 주의사항

### 절대 커밋하면 안 되는 것
- 비밀번호
- API 키
- 데이터베이스 접속 정보
- 개인정보
- 큰 파일 (100MB 이상)

### .gitignore에 추가하기
```
# 민감한 정보
.env
application-secret.yml
credentials.json

# 큰 파일
*.mp4
*.zip
large-dataset/
```

---

## 🆘 문제 해결

### 실수로 잘못된 파일 추가
```bash
# 아직 커밋 안 했으면
git reset HEAD 파일명

# 커밋까지 했으면
git reset --soft HEAD~1
```

### 원격 저장소와 충돌
```bash
# 원격 변경사항 가져오기
git pull origin main

# 충돌 해결 후
git add .
git commit -m "충돌 해결"
git push origin main
```

### 브랜치가 꼬였을 때
```bash
# 현재 브랜치 상태 저장
git stash

# 다른 브랜치로 이동
git checkout main

# 저장한 상태 복원
git stash pop
```

---

## 📚 추가 학습 자료

### Git 기초
- [누구나 쉽게 이해할 수 있는 Git 입문](https://backlog.com/git-tutorial/kr/)
- [생활코딩 - Git](https://opentutorials.org/course/3837)

### GitHub 활용
- [GitHub 가이드 (한글)](https://guides.github.com/activities/hello-world/)
- [GitHub 공식 문서](https://docs.github.com/ko)

### Git 명령어 치트시트
- [Git 치트시트 (PDF)](https://training.github.com/downloads/ko/github-git-cheat-sheet.pdf)
