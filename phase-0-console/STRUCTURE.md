# 프로젝트 구조

```
yut-console/
│
├── README.md                       # 프로젝트 설명
├── run.bat                         # Windows 실행 스크립트
├── run.sh                          # Mac/Linux 실행 스크립트
│
└── src/                            # 소스 코드
    └── com/
        └── yutgame/
            │
            ├── Main.java           # 프로그램 진입점
            │   └── 역할: 게임 시작, 플레이어 생성, 게임 루프
            │
            ├── domain/             # 게임 로직 (핵심!)
            │   │
            │   ├── Game.java       # 게임 메인 로직
            │   │   └── 역할: 윷 던지기, 말 이동, 잡기/쌓기, 승리 판정
            │   │
            │   ├── Board.java      # 윷판
            │   │   └── 역할: 경로 계산, 지름길 처리
            │   │
            │   ├── Player.java     # 플레이어
            │   │   └── 역할: 4개 말 관리, 승리 조건 확인
            │   │
            │   ├── Piece.java      # 말
            │   │   └── 역할: 위치 관리, 쌓기, 이동
            │   │
            │   ├── Position.java   # 위치
            │   │   └── 역할: 윷판 상의 위치 (0-29)
            │   │
            │   ├── YutResult.java  # 윷 결과 (enum)
            │   │   └── 역할: 도/개/걸/윷/모/빽도
            │   │
            │   └── MoveResult.java # 이동 결과
            │       └── 역할: 잡기/쌓기 정보 담기
            │
            ├── console/            # 콘솔 UI
            │   │
            │   ├── ConsoleUI.java  # 화면 출력
            │   │   └── 역할: 게임 상태, 결과 표시
            │   │
            │   └── InputHandler.java # 사용자 입력
            │       └── 역할: 이름, 말 번호 입력 받기
            │
            └── test/               # 테스트
                └── SimpleTest.java # 간단한 로직 테스트
                    └── 역할: 기본 기능 검증
```

## 클래스 간 관계

```
Main
 └─ creates ──> Game
                 ├─ has ──> Board
                 ├─ has ──> Player (2개)
                 │           └─ has ──> Piece (4개)
                 │                       └─ has ──> Position
                 ├─ throws ──> YutResult
                 └─ returns ──> MoveResult
```

## 데이터 흐름

```
사용자 입력
    ↓
InputHandler
    ↓
Main (게임 루프)
    ↓
Game.throwYut() → YutResult
    ↓
Game.movePiece() → MoveResult
    ↓
ConsoleUI (결과 출력)
    ↓
다음 턴 또는 게임 종료
```

## 핵심 메서드

### Game 클래스
- `throwYut()`: 윷 던지기 (랜덤)
- `movePiece(Piece, int)`: 말 이동 + 잡기/쌓기 처리
- `nextTurn()`: 턴 넘기기
- `isFinished()`: 게임 종료 확인

### Piece 클래스
- `moveTo(Position)`: 말 이동
- `stackWith(Piece)`: 말 쌓기
- `sendToStart()`: 잡혀서 시작점으로

### Board 클래스
- `calculateNewPosition(Position, int)`: 새 위치 계산
- `calculatePath(Position, int)`: 이동 경로 (지름길 포함)

## Spring Boot로 이식 시

이 `domain` 패키지를 그대로 복사하고:

1. **REST API 추가**: 
   - RoomController, GameController
   - 방 생성/참가, 게임 시작

2. **WebSocket 추가**:
   - GameWebSocketController
   - throwYut, movePiece 메시지 처리

3. **Service 계층 추가**:
   - GameService (메모리에서 Game 관리)
   - Map<String, Game> 사용

4. **프론트엔드 개발**:
   - ConsoleUI → HTML/CSS/JS로 변환
   - InputHandler → 버튼 클릭으로 변환
