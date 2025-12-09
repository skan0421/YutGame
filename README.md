# 🎲 YutGame - 온라인 윷놀이 게임

한국 전통 놀이 윷놀이를 웹/앱으로 즐기는 멀티플레이어 게임입니다.

## 📋 프로젝트 개요

### 최종 목표
PC-PC, PC-모바일, 모바일-모바일 간 크로스 플랫폼 윷놀이 게임 구현

### 개발 단계

| Phase | 설명 | 상태 | 버전 |
|-------|------|------|------|
| [Phase 0](./phase-0-console/) | 순수 Java 콘솔 게임 | ✅ 완료 | v0.1.0 |
| [Phase 1](./phase-1-web/) | Spring Boot + 웹 | 🚧 진행중 | v1.x.x |
| [Phase 2](./phase-2-deploy/) | 배포 + 기능 추가 | ⏳ 대기 | v2.x.x |
| [Phase 3](./phase-3-advanced/) | 고급 기능 | ⏳ 대기 | v3.x.x |
| [Phase 4](./phase-4-global/) | 글로벌 + 앱 | ⏳ 대기 | v4.x.x |

---

## 🎯 Phase 0: 콘솔 버전 (완료)

**목표**: 순수 Java로 완벽한 게임 로직 구현

**특징**:
- ✅ 2인 게임
- ✅ 완벽한 규칙 (잡기, 쌓기, 지름길, 한 번 더)
- ✅ 콘솔 UI
- ✅ 프레임워크 없는 순수 Java

**실행 방법**:
```bash
cd phase-0-console
./run.bat  # Windows
./run.sh   # Mac/Linux
```

[자세히 보기 →](./phase-0-console/README.md)

---

## 🌐 Phase 1: 웹 버전 (진행중)

**목표**: 2명이 웹에서 실시간 멀티플레이

**기술 스택**:
- Backend: Spring Boot, WebSocket, MySQL
- Frontend: HTML/CSS/JavaScript
- 개발 기간: 3개월

**진행 상황**:
- [ ] Week 1: 프로젝트 세팅
- [ ] Week 2-3: 데이터베이스
- [ ] Week 4-7: 도메인 로직 통합
- [ ] Week 8: REST API
- [ ] Week 9-10: WebSocket
- [ ] Week 11-13: 웹 UI
- [ ] Week 14: 테스트

[자세히 보기 →](./phase-1-web/README.md)

---

## 🚀 Phase 2: 배포 버전 (계획)

**목표**: 실제 사용자가 접근 가능한 서비스

**추가 기능**:
- 간단한 인증
- 채팅 기능
- 게임 통계
- 모바일 반응형

**배포**:
- Render.com (백엔드)
- Netlify (프론트엔드)
- MySQL (데이터베이스)

---

## ⭐ Phase 3: 고급 기능 (계획)

- 3-4인 게임
- 친구 초대
- 랭킹 시스템
- 관전 모드
- CI/CD

---

## 🌍 Phase 4: 글로벌 & 앱 (계획)

- 다국어 지원 (한국어, 영어, 일본어)
- Flutter 앱
- CDN 최적화
- 앱스토어 배포

---

## 📚 문서

- [개발 계획 전체](./docs/development-plan.md)
- [윷놀이 규칙](./docs/yut-rules.md)
- [아키텍처 설계](./docs/architecture.md)
- [API 문서](./docs/api-documentation.md)
- [Git 사용 가이드](./docs/git-guide.md)

---

## 🛠️ 개발 환경

### 필수 도구
- JDK 17+
- MySQL 8.0+
- Git
- IntelliJ IDEA (추천)

### Phase별 추가 도구
- Phase 1: Node.js, VS Code
- Phase 2: Docker (선택)
- Phase 4: Flutter SDK

---

## 📊 기술 스택

### Backend
- Java 17
- Spring Boot 3.x
- Spring WebSocket
- MySQL
- JDBC Template

### Frontend
- HTML5 / CSS3
- JavaScript (ES6+)
- SockJS + STOMP.js

### DevOps (Phase 2+)
- GitHub Actions
- Docker
- Render.com
- Netlify

---

## 🤝 Contributing

이 프로젝트는 개인 학습용 프로젝트입니다.

---

## 📝 라이선스

MIT License

---

## 👤 작성자

**우주**
- 학습 목표: Full-stack 개발
- 진행 기간: 2024.12 ~ 2025.06 (예상)

---

## 📈 진행 상황

```
Phase 0 ████████████████████ 100% (완료)
Phase 1 ████░░░░░░░░░░░░░░░░  20% (진행중)
Phase 2 ░░░░░░░░░░░░░░░░░░░░   0% (대기)
Phase 3 ░░░░░░░░░░░░░░░░░░░░   0% (대기)
Phase 4 ░░░░░░░░░░░░░░░░░░░░   0% (대기)
```

**마지막 업데이트**: 2024-12-09

---

## 🔗 참고 링크

- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [WebSocket 가이드](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [윷놀이 규칙 (한국어)](https://ko.wikipedia.org/wiki/윷놀이)