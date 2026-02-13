# YutGame (윷놀이) 전체 분석 보고서

## 1. 프로젝트 개요

**프로젝트명:** YutGame (윷놀이 게임)
**작성자:** Wuju (우주)
**라이선스:** MIT
**개발 기간:** 2024.12 ~ 2025.06 (예정)
**현재 상태:** Phase 0 (콘솔 버전) 완료, Phase 1 (웹 버전) 계획 중

윷놀이(Yut-nori)는 한국 전통 보드게임으로, 2명의 플레이어가 각각 4개의 말을 출발점에서 도착점까지 이동시키는 턴 기반 전략 게임이다. 이 프로젝트는 단계적으로 콘솔 → 웹 → 배포 → 모바일까지 확장하는 구조로 설계되어 있다.

---

## 2. 기술 스택

| 구분 | Phase 0 (현재) | Phase 1+ (계획) |
|------|---------------|-----------------|
| 언어 | Java 17 | Java 17 + JavaScript (ES6+) |
| 프레임워크 | 없음 (Pure Java) | Spring Boot 3.x |
| 빌드 도구 | Maven 4.0.0 | Maven |
| DB | 없음 | MySQL 8.0+ |
| 네트워킹 | 없음 (로컬) | WebSocket, REST API |
| 프론트엔드 | Console (Scanner) | HTML5/CSS3/JS, SockJS, STOMP.js |
| 테스트 | 커스텀 assert | JUnit (계획) |
| 배포 | 로컬 전용 | Docker, Render.com, Netlify |

---

## 3. 프로젝트 구조

```
YutGame/
├── README.md                           # 전체 프로젝트 로드맵 (5단계)
├── ANALYSIS.md                         # 전체 분석 보고서 (이 파일)
├── 깃허브 빠른시작가이드.md              # GitHub 가이드 (한국어)
├── Git명령어가이드.md                   # Git 명령어 가이드 (한국어)
├── Git설정가이드.md                    # Git 설정 가이드 (한국어)
├── .gitignore                          # 버전 관리 제외 파일 설정
└── phase-0-console/                    # Phase 0: 콘솔 버전 (완료)
    ├── README.md                       # Phase 0 문서
    ├── STRUCTURE.md                    # 클래스 구조 문서
    ├── pom.xml                         # Maven 설정
    ├── run.sh                          # Mac/Linux 빌드·실행 스크립트
    ├── run.bat                         # Windows 빌드·실행 스크립트
    └── src/
        └── com/yutgame/
            ├── Main.java               # 진입점 (게임 루프)
            ├── domain/                 # 핵심 게임 로직
            │   ├── Game.java           # 게임 컨트롤러
            │   ├── Board.java          # 게임판 & 위치 계산
            │   ├── Player.java         # 플레이어 관리
            │   ├── Piece.java          # 개별 말 상태
            │   ├── Position.java       # 보드 위치 표현
            │   ├── YutResult.java      # 윷 던지기 결과 (Enum)
            │   └── MoveResult.java     # 이동 결과
            ├── console/                # 콘솔 UI 레이어
            │   ├── ConsoleUI.java      # 화면 출력
            │   └── InputHandler.java   # 사용자 입력 처리
            └── test/
                └── SimpleTest.java     # 기본 테스트
```

---

## 4. 핵심 도메인 모델 분석

### 4.1 Game.java — 게임 컨트롤러
**경로:** `phase-0-console/src/com/yutgame/domain/Game.java`

중앙 게임 오케스트레이터. 모든 게임 상태와 규칙을 관리한다.

**주요 필드:**
- `board`: Board — 게임판
- `player1`, `player2`: Player — 2명의 플레이어
- `currentPlayer`: Player — 현재 턴 플레이어
- `hasExtraTurn`: boolean — 추가 턴 여부
- `finished`: boolean — 게임 종료 여부
- `winner`: Player — 승자
- `turnCount`: int — 턴 수

**주요 메서드:**
- `throwYut()` → YutResult: 가중 확률로 윷 결과 생성
- `movePiece(Piece, int)` → MoveResult: 말 이동, 잡기/업기 처리
- `nextTurn()`: 턴 전환 (추가 턴이면 유지)
- `findPieceAt(Position)`: 충돌 감지
- `isFinished()`: 승리 조건 확인

### 4.2 Board.java — 게임판 로직
**경로:** `phase-0-console/src/com/yutgame/domain/Board.java`

30개 위치(0=출발, 29=도착)로 구성된 게임판.

**주요 기능:**
- `calculateNewPosition()`: 이동 후 새 위치 계산
- `calculatePath()`: 이동 경로 생성 (애니메이션용)
- 지름길 로직: 위치 5, 10, 22에서 특수 경로
- **TODO**: 실제 윷놀이 지름길 규칙 미구현 (현재 단순화됨)

### 4.3 Player.java — 플레이어 관리
**경로:** `phase-0-console/src/com/yutgame/domain/Player.java`

각 플레이어는 4개의 말(Piece)을 보유.

**주요 메서드:**
- `getWaitingPieces()`: 대기 중인 말 (위치 0)
- `getPlayingPieces()`: 진행 중인 말 (위치 1-28)
- `getFinishedPieces()`: 도착한 말 (위치 29)
- `getMovablePieces()`: 이동 가능한 말
- `hasWon()`: 4개 말 모두 도착 시 승리

### 4.4 Piece.java — 개별 말
**경로:** `phase-0-console/src/com/yutgame/domain/Piece.java`

**주요 필드:** id, owner, position, stackedPieces, finished

**주요 메서드:**
- `moveTo(Position)`: 말 이동 (스택된 말도 함께)
- `stackWith(Piece)`: 다른 말과 업기
- `sendToStart()`: 잡혔을 때 출발점으로 복귀
- `getStackCount()`: 업힌 말 수

### 4.5 Position.java — 위치 표현
**경로:** `phase-0-console/src/com/yutgame/domain/Position.java`

인덱스 기반(0-29) 불변 위치 객체. `equals()`/`hashCode()` 구현으로 충돌 감지 지원.

### 4.6 YutResult.java — 윷 결과 Enum
**경로:** `phase-0-console/src/com/yutgame/domain/YutResult.java`

| 결과 | 이동 | 확률 | 추가 턴 |
|------|------|------|---------|
| 빽도 (BACK_DO) | -1칸 | 5% | X |
| 도 (DO) | +1칸 | 35% | X |
| 개 (GAE) | +2칸 | 25% | X |
| 걸 (GEOL) | +3칸 | 20% | X |
| 윷 (YUT) | +4칸 | 10% | O |
| 모 (MO) | +5칸 | 5% | O |

### 4.7 MoveResult.java — 이동 결과
**경로:** `phase-0-console/src/com/yutgame/domain/MoveResult.java`

이동 후 결과(잡기, 업기, 새 위치, 추가 턴 여부)를 담는 값 객체.

---

## 5. 게임 규칙 구현 상태

### 구현 완료:
- **기본 이동**: 윷 던지기 결과에 따른 말 이동
- **잡기 (캡처)**: 상대 말 위치에 도착 시 상대 말을 출발점으로 보내고 추가 턴 획득
- **업기 (쌓기)**: 자기 말 위치에 도착 시 말을 합쳐 함께 이동
- **추가 턴**: 윷/모 또는 잡기 성공 시 추가 턴
- **승리 판정**: 4개 말 모두 도착 시 게임 종료

### 미구현 / TODO:
- **지름길 규칙**: Board.java에서 실제 윷놀이 지름길 규칙이 정확하게 구현되지 않음 (단순화)
- **3-4인 플레이**: 현재 2인만 지원
- **빽도 특수 규칙**: 출발점에서 빽도 시 처리
- **게임 저장/불러오기**: 미지원

---

## 6. UI 레이어 분석

### ConsoleUI.java
**경로:** `phase-0-console/src/com/yutgame/console/ConsoleUI.java`

텍스트 기반 출력 담당:
- `printWelcome()`: 시작 화면
- `printGameState()`: 현재 게임 상태 (턴, 플레이어 정보, 말 위치)
- `printYutResult()`: 윷 결과 표시
- `printMoveResult()`: 이동 결과 표시 (잡기/업기)
- `printMovablePieces()`: 이동 가능한 말 목록
- `printWinner()`: 승자 표시

### InputHandler.java
**경로:** `phase-0-console/src/com/yutgame/console/InputHandler.java`

Scanner 기반 입력 처리:
- `readPlayerName()`: 플레이어 이름 입력
- `readPieceNumber()`: 말 번호 선택 (1-4, 유효성 검증)
- `waitForEnter()`: 턴 진행 대기
- `askPlayAgain()`: 재시작 확인

---

## 7. 게임 흐름 (Main.java)

**경로:** `phase-0-console/src/com/yutgame/Main.java`

```
프로그램 시작
├── ConsoleUI 초기화
├── 플레이어 이름 입력 (2명)
├── Game 객체 생성
└── 게임 루프 (while !game.isFinished())
    ├── 현재 게임 상태 출력
    ├── 윷 던지기 → YutResult
    ├── 윷/모이면 추가 턴 플래그 설정
    ├── 이동 가능한 말 목록 표시
    ├── 말 선택
    ├── 말 이동 → MoveResult
    │   ├── 잡기 발생 → 추가 턴
    │   └── 업기 발생
    ├── 승리 확인
    └── nextTurn() (추가 턴 아니면 턴 전환)
```

---

## 8. 테스트 현황

**파일:** `phase-0-console/src/com/yutgame/test/SimpleTest.java`

JUnit 없이 Java assert 문을 사용한 커스텀 테스트:

| 테스트 | 검증 내용 |
|--------|----------|
| `testBasicSetup()` | 플레이어 생성, 게임 초기화 |
| `testPieceMovement()` | 기본 말 이동 (0→3) |
| `testCapture()` | 상대 말 잡기 + 추가 턴 |
| `testStacking()` | 말 업기 + 합쳐서 이동 |
| `testWinCondition()` | 승리 조건 감지 |

**실행:** `java -cp bin com.yutgame.test.SimpleTest`

---

## 9. 설계 패턴 및 아키텍처

| 패턴 | 적용 위치 | 설명 |
|------|----------|------|
| **도메인 모델** | `domain/` 패키지 전체 | OOP 기반 게임 로직 캡슐화 |
| **Enum 패턴** | YutResult.java | 타입 안전한 윷 결과 표현 |
| **값 객체** | Position.java, MoveResult.java | 불변 데이터 컨테이너 |
| **서비스 패턴** | Game.java | 도메인 객체 조율, 규칙 시행 |
| **팩토리 패턴** | Player 생성자 | 4개 말 자동 생성 |
| **계층 분리** | domain/ vs console/ | UI와 로직 분리 |

**장점:**
- 도메인 로직과 UI의 명확한 분리 → Phase 1 Spring Boot 이식 용이
- Stream API, 람다 등 모던 Java 활용
- 불변 Position 클래스
- movePiece()의 방어적 유효성 검증

---

## 10. 프로젝트 로드맵

| 단계 | 이름 | 상태 | 핵심 기술 |
|------|------|------|----------|
| Phase 0 | 콘솔 버전 | 완료 (100%) | Pure Java 17 |
| Phase 1 | 웹 버전 | 계획 중 (20%) | Spring Boot, WebSocket, MySQL |
| Phase 2 | 배포 | 대기 | Docker, Render.com, Netlify |
| Phase 3 | 고급 기능 | 대기 | AI 상대, 랭킹, 관전 모드 |
| Phase 4 | 글로벌/모바일 | 대기 | Flutter, 다국어 |

---

## 11. 개선 필요 사항 요약

1. **Board.java 지름길 규칙**: 실제 윷놀이 규칙과 다름 (TODO 표시됨)
2. **테스트 프레임워크**: JUnit 미도입, 커스텀 assert만 사용
3. **3-4인 지원**: 현재 2인 전용
4. **빽도 예외 처리**: 출발점에서의 빽도 동작 불명확
5. **게임 저장/로드**: 미구현
6. **외부 의존성 없음**: pom.xml에 디펜던시 미설정
