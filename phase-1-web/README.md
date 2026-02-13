# Phase 1: 윷놀이 웹 버전

Spring Boot + WebSocket을 이용한 2인 실시간 온라인 윷놀이

## 기술 스택

- **Backend**: Spring Boot 3.2, WebSocket (STOMP + SockJS)
- **Frontend**: HTML/CSS/JavaScript (바닐라)
- **데이터**: 인메모리 (Map 기반, DB 없음)

## 실행 방법

```bash
cd phase-1-web
mvn spring-boot:run
```

브라우저에서 `http://localhost:8080` 접속

## 구조

```
src/main/java/com/yutgame/
├── YutGameApplication.java     # Spring Boot 진입점
├── domain/                     # Phase 0에서 가져온 게임 로직
├── config/WebSocketConfig.java # WebSocket 설정
├── controller/
│   ├── RoomController.java     # REST: 방 생성/참가/목록
│   └── GameController.java     # WebSocket: 윷 던지기/말 이동
├── service/GameService.java    # 게임 세션 관리
└── dto/                        # 요청/응답 DTO

src/main/resources/static/
├── index.html                  # 로비 (방 만들기/참가)
├── game.html                   # 게임 화면
├── css/style.css               # 스타일
└── js/
    ├── app.js                  # 로비 로직
    ├── board.js                # 윷판 Canvas 렌더링
    └── game.js                 # 게임 WebSocket 통신
```

## API

| 구분 | 엔드포인트 | 설명 |
|------|-----------|------|
| REST | `POST /api/rooms` | 방 생성 |
| REST | `GET /api/rooms` | 대기 중인 방 목록 |
| REST | `POST /api/rooms/{id}/join` | 방 참가 |
| REST | `GET /api/rooms/{id}` | 방 정보 |
| WS | `/app/game/{id}/throw` | 윷 던지기 |
| WS | `/app/game/{id}/move` | 말 이동 |
| WS | `/app/game/{id}/state` | 상태 요청 |
| WS → | `/topic/game/{id}` | 게임 상태 브로드캐스트 |

## 플레이 방법

1. 브라우저 2개 열기 (탭 또는 다른 브라우저)
2. Player 1: 이름 입력 → 방 만들기
3. Player 2: 이름 입력 → 방 목록에서 참가
4. 차례가 되면 "윷 던지기" → 말 선택 → 이동
5. 모든 말을 도착시키면 승리!
