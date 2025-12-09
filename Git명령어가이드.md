# YutGame Git 저장소 설정 - 실행 명령어

## 📋 준비물
- Git 설치 완료
- GitHub 계정
- 현재 위치: C:\Users\user\Desktop\YutGame

---

## 🚀 1단계: 폴더 정리하기

```bash
# PowerShell 또는 명령 프롬프트에서

# YutGame 폴더로 이동
cd C:\Users\user\Desktop\YutGame

# yut-console을 phase-0-console로 이름 변경
Rename-Item -Path "yut-console" -NewName "phase-0-console"

# 또는 탐색기에서 수동으로 이름 변경해도 됨
```

---

## 🚀 2단계: Git 초기화하기

```bash
# Git 초기화
git init

# 사용자 정보 설정 (처음 한 번만)
git config --global user.name "본인이름"
git config --global user.email "본인이메일@example.com"
```

---

## 🚀 3단계: 필수 파일 만들기

### 3-1. .gitignore 파일 만들기

```bash
# 메모장으로 .gitignore 파일 생성
notepad .gitignore
```

그리고 이 내용 붙여넣기:
```
# Java 관련
*.class
*.jar
*.war
*.ear
bin/
target/
out/

# IDE 관련
.idea/
*.iml
.vscode/
.settings/
.project
.classpath

# Gradle 관련
.gradle/
build/

# Maven 관련
.mvn/

# Node.js 관련
node_modules/
package-lock.json

# 환경 변수
.env
.env.local
application-local.yml

# 데이터베이스
*.db
*.sqlite
*.log

# 운영체제
.DS_Store
Thumbs.db
desktop.ini

# 빌드 결과물
dist/
*.zip
*.tar.gz

# 개인 메모
notes.txt
TODO.txt
개인메모.txt
```

### 3-2. README.md 만들기

```bash
# 메모장으로 README.md 파일 생성
notepad README.md
```

위에서 만든 내용 붙여넣기

### 3-3. docs 폴더 만들기

```bash
mkdir docs
cd docs

# 각 문서 파일 생성 (일단 빈 파일)
echo # YutGame 개발 계획 > 개발계획.md
echo # 윷놀이 규칙 > 윷놀이규칙.md
echo # 시스템 설계 > 시스템설계.md

cd ..
```

---

## 🚀 4단계: 첫 번째 커밋하기

```bash
# 현재 상태 확인
git status

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "첫 커밋: Phase 0 - 콘솔 버전 완성"

# 버전 태그 달기
git tag -a v0.1.0 -m "Phase 0: 순수 자바 콘솔 게임"
```

---

## 🚀 5단계: GitHub 저장소 만들기

1. **GitHub 웹사이트 접속** (https://github.com)
2. **New repository 클릭**
3. **설정**:
   - Repository name: `yut-game`
   - Description: `온라인 윷놀이 게임 - 학습 프로젝트`
   - Public 또는 Private 선택
   - ❌ Add a README 체크 **해제** (우리가 이미 만들었음)
   - ❌ Add .gitignore 체크 **해제** (우리가 이미 만들었음)
4. **Create repository 클릭**

---

## 🚀 6단계: GitHub에 업로드하기

```bash
# GitHub 저장소 연결 (your-username을 본인 것으로 변경)
git remote add origin https://github.com/본인아이디/yut-game.git

# 브랜치 이름을 main으로 변경
git branch -M main

# 업로드
git push -u origin main

# 태그도 업로드
git push origin v0.1.0
```

---

## 🚀 7단계: Phase 1 준비하기

```bash
# develop 브랜치 생성 (개발용)
git checkout -b develop

# phase-1-web 폴더 생성
mkdir phase-1-web
cd phase-1-web

# README 생성
echo # Phase 1: 웹 버전 > README.md

# 커밋
cd ..
git add .
git commit -m "Phase 1 폴더 구조 준비"

# GitHub에 develop 브랜치 업로드
git push -u origin develop
```

---

## 📝 일상적인 작업 흐름

### 새 기능 시작할 때

```bash
# develop 브랜치로 이동
git checkout develop

# 새 기능 브랜치 생성
git checkout -b feature/rest-api

# 작업 진행...

# 커밋
git add .
git commit -m "[Phase-1] 기능: 방 관리 REST API 구현"

# GitHub에 업로드
git push origin feature/rest-api
```

### 기능 완성했을 때

```bash
# develop에 합치기
git checkout develop
git merge feature/rest-api

# 브랜치 삭제
git branch -d feature/rest-api

# GitHub에 업로드
git push origin develop
```

### Phase 완성했을 때

```bash
# main에 합치기
git checkout main
git merge develop

# 버전 태그 달기
git tag -a v1.0.0 -m "Phase 1: 웹 버전 MVP 완성"

# 업로드
git push origin main
git push origin v1.0.0
```

---

## 🔍 자주 쓰는 명령어

```bash
# 현재 상태 확인
git status

# 변경 사항 보기
git diff

# 커밋 기록 보기
git log --oneline --graph --all

# 브랜치 목록
git branch -a

# 원격 저장소 상태 확인
git remote -v

# 최신 코드 가져오기
git pull origin main
```

---

## ⚠️ 문제 해결

### 실수로 잘못 커밋했을 때
```bash
# 마지막 커밋 취소 (변경사항 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (변경사항도 삭제)
git reset --hard HEAD~1
```

### GitHub 인증 에러
```bash
# GitHub Personal Access Token 사용
# Settings → Developer settings → Personal access tokens
# Classic token 생성 후 비밀번호 대신 사용
```

### 병합 충돌 발생 시
```bash
# 충돌 난 파일 확인
git status

# 파일 수정 후
git add .
git commit -m "충돌 해결"
```

---

## 🎯 최종 폴더 구조 (목표)

```
YutGame/                          # Git 저장소
├── .git/
├── .gitignore
├── README.md
├── docs/
│   ├── 개발계획.md
│   ├── 윷놀이규칙.md
│   ├── 시스템설계.md
│   └── Git사용가이드.md
│
├── phase-0-console/              ✅ 완료
│   ├── README.md
│   ├── STRUCTURE.md
│   └── src/...
│
├── phase-1-web/                  🚧 작업중
│   ├── README.md
│   ├── backend/
│   │   └── (Spring Boot)
│   └── frontend/
│       └── (HTML/CSS/JS)
│
└── phase-2-deploy/               ⏳ 대기
    └── ...
```

---

## ✅ 체크리스트

- [ ] Git 설치 완료
- [ ] GitHub 계정 있음
- [ ] yut-console → phase-0-console 이름 변경
- [ ] git init 실행
- [ ] .gitignore 생성
- [ ] README.md 생성
- [ ] 첫 커밋 완료
- [ ] GitHub 저장소 생성
- [ ] 원격 저장소 연결
- [ ] 업로드 완료
- [ ] v0.1.0 태그 달기
- [ ] develop 브랜치 생성
- [ ] phase-1-web 폴더 생성

---

## 🆘 도움이 필요하면

- Git 공식 문서: https://git-scm.com/doc
- GitHub 가이드: https://guides.github.com/
- 막히면 언제든 질문!

---

## 💡 커밋 메시지 작성 팁

### 좋은 예시
```bash
git commit -m "[Phase-1] 기능: 방 생성 API 추가"
git commit -m "[Phase-1] 수정: WebSocket 연결 버그 해결"
git commit -m "[Phase-2] 문서: API 사용법 추가"
git commit -m "[Phase-1] 리팩토링: 게임 로직 정리"
```

### 나쁜 예시
```bash
git commit -m "수정"
git commit -m "asdf"
git commit -m "ㅁㄴㅇㄹ"
git commit -m "거의다됨"
```

### 커밋 타입
- `기능`: 새 기능 추가
- `수정`: 버그 수정
- `문서`: 문서 수정
- `리팩토링`: 코드 정리
- `테스트`: 테스트 추가
- `배포`: 배포 관련

---

## 📊 브랜치 전략 정리

```
main (배포용)
  └─ develop (개발용)
       ├─ feature/rest-api (기능1)
       ├─ feature/websocket (기능2)
       └─ feature/ui-design (기능3)
```

**규칙**:
- `main`: 항상 안정된 버전만
- `develop`: 개발 진행 중
- `feature/*`: 각 기능별로 브랜치 생성

---

## 🎓 Git 기본 개념

### 커밋 (Commit)
- 변경 사항을 저장하는 것
- 사진 찍듯이 현재 상태를 기록

### 브랜치 (Branch)
- 독립적인 작업 공간
- 새 기능 개발할 때 사용

### 머지 (Merge)
- 브랜치를 합치는 것
- 기능 완성 후 develop/main에 합침

### 푸시 (Push)
- 로컬 → GitHub 업로드

### 풀 (Pull)
- GitHub → 로컬 다운로드

### 태그 (Tag)
- 특정 버전에 이름 붙이기
- v1.0.0, v2.0.0 등
