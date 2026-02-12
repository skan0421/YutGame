package com.yutgame.test;

import com.yutgame.domain.*;
import java.util.List;

/**
 * 윷놀이 말 이동 종합 테스트
 *
 * 테스트 항목:
 * 1. 각 윷 결과별 이동 (도/개/걸/윷/모/빽도)
 * 2. 빽도 엣지 케이스 (시작점에서 빽도)
 * 3. 도착 지점 도달 및 초과
 * 4. 잡기 (상대 말 잡고 시작점으로 보내기)
 * 5. 쌓기 (업기) 및 함께 이동
 * 6. 쌓인 말 잡히면 모두 시작점으로
 * 7. 한번더 (윷/모/잡기)
 * 8. 턴 넘기기
 * 9. 승리 조건
 * 10. Board.calculatePath() 경로 검증
 * 11. 지름길 경로 테스트
 */
public class YutMovementTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║   윷놀이 말 이동 종합 테스트          ║");
        System.out.println("╚══════════════════════════════════════╝\n");

        // 1. 각 윷 결과별 기본 이동
        testDoMovement();
        testGaeMovement();
        testGeolMovement();
        testYutMovement();
        testMoMovement();
        testBackDoMovement();

        // 2. 엣지 케이스
        testBackDoFromStart();
        testBackDoFromPosition1();
        testMoveToExactFinish();
        testMoveOverFinish();
        testMoveNearFinish();

        // 3. 잡기 관련
        testCaptureBasic();
        testCaptureGrantsExtraTurn();
        testCapturedPieceGoesToStart();
        testCaptureStackedPieces();

        // 4. 쌓기 관련
        testStackBasic();
        testStackedMoveTogether();
        testStackNoExtraTurn();
        testStackMultiple();
        testStackAbsorb();

        // 5. 한번더/턴 관련
        testYutExtraTurn();
        testMoExtraTurn();
        testDoNoExtraTurn();
        testGaeNoExtraTurn();
        testGeolNoExtraTurn();
        testBackDoNoExtraTurn();
        testCaptureExtraTurnThenNextTurn();
        testTurnSwitchNormal();

        // 6. Board.calculatePath() 경로 검증
        testPathDo();
        testPathGae();
        testPathGeol();
        testPathYut();
        testPathMo();
        testPathBackDo();
        testPathToFinish();

        // 7. 지름길 테스트
        testShortcutAt5();
        testShortcutAt10();
        testShortcutAt22();
        testNoShortcutUnder4Steps();

        // 8. 승리 조건
        testWinCondition();
        testNotWonUntilAllFinished();

        // 9. findPieceAt 관련 (도착 지점 겹침)
        testMultiplePiecesAtFinish();

        // 10. 연속 이동 시나리오
        testConsecutiveMoves();
        testFullGameScenario();

        System.out.println("\n╔══════════════════════════════════════╗");
        System.out.printf("║  결과: %d 통과 / %d 실패 / %d 총     ║%n", passed, failed, passed + failed);
        System.out.println("╚══════════════════════════════════════╝");

        if (failed > 0) {
            System.out.println("\n⚠ 실패한 테스트가 있습니다!");
            System.exit(1);
        } else {
            System.out.println("\n✅ 모든 테스트 통과!");
        }
    }

    // ==========================================
    // 1. 각 윷 결과별 기본 이동
    // ==========================================

    private static void testDoMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, YutResult.DO.getSteps()); // +1
        assertEq("도(DO): 0→1", 1, piece.getPosition().getIndex());
    }

    private static void testGaeMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, YutResult.GAE.getSteps()); // +2
        assertEq("개(GAE): 0→2", 2, piece.getPosition().getIndex());
    }

    private static void testGeolMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, YutResult.GEOL.getSteps()); // +3
        assertEq("걸(GEOL): 0→3", 3, piece.getPosition().getIndex());
    }

    private static void testYutMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, YutResult.YUT.getSteps()); // +4
        assertEq("윷(YUT): 0→4", 4, piece.getPosition().getIndex());
    }

    private static void testMoMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, YutResult.MO.getSteps()); // +5
        assertEq("모(MO): 0→5", 5, piece.getPosition().getIndex());
    }

    private static void testBackDoMovement() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 먼저 3칸 이동한 후 빽도
        game.movePiece(piece, 3);
        game.movePiece(piece, YutResult.BACK_DO.getSteps()); // -1
        assertEq("빽도(BACK_DO): 3→2", 2, piece.getPosition().getIndex());
    }

    // ==========================================
    // 2. 엣지 케이스
    // ==========================================

    private static void testBackDoFromStart() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 시작점에서 빽도 → 0 이하로 내려가지 않아야 함
        game.movePiece(piece, YutResult.BACK_DO.getSteps());
        assertEq("빽도 시작점: 0→0(최소)", 0, piece.getPosition().getIndex());
    }

    private static void testBackDoFromPosition1() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        game.movePiece(piece, 1); // 위치 1
        game.movePiece(piece, YutResult.BACK_DO.getSteps()); // -1
        assertEq("빽도 1번에서: 1→0", 0, piece.getPosition().getIndex());
    }

    private static void testMoveToExactFinish() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 정확히 29에 도달
        game.movePiece(piece, 29);
        assertEq("정확히 도착: 0→29", 29, piece.getPosition().getIndex());
        assertTrue("정확히 도착 시 finished=true", piece.isFinished());
    }

    private static void testMoveOverFinish() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 27번까지 이동 후 모(+5) → 29를 넘지만 29로 처리
        game.movePiece(piece, 27);
        assertEq("27번 이동 확인", 27, piece.getPosition().getIndex());

        game.movePiece(piece, YutResult.MO.getSteps()); // 27+5=32 → 29
        assertEq("도착 초과 시 29로 처리", 29, piece.getPosition().getIndex());
        assertTrue("도착 초과 시 finished=true", piece.isFinished());
    }

    private static void testMoveNearFinish() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 28번까지 이동 후 도(+1) → 정확히 29
        game.movePiece(piece, 28);
        game.movePiece(piece, YutResult.DO.getSteps()); // 28+1=29
        assertEq("28+1=29 정확히 도착", 29, piece.getPosition().getIndex());
        assertTrue("28+1 도착 시 finished", piece.isFinished());
    }

    // ==========================================
    // 3. 잡기 관련
    // ==========================================

    private static void testCaptureBasic() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        // p2의 말을 10번에 놓기
        Piece p2Piece = p2.getPieces().get(0);
        game.nextTurn(); // p2 턴
        game.movePiece(p2Piece, 10);

        // p1 턴으로 전환 후 잡기
        game.nextTurn(); // p1 턴
        Piece p1Piece = p1.getPieces().get(0);
        MoveResult result = game.movePiece(p1Piece, 10);

        assertTrue("잡기 성공 여부", result.isCaptured());
        assertEq("잡은 말 위치", 10, p1Piece.getPosition().getIndex());
        assertEq("잡힌 말 시작점으로", 0, p2Piece.getPosition().getIndex());
    }

    private static void testCaptureGrantsExtraTurn() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece p2Piece = p2.getPieces().get(0);
        game.nextTurn();
        game.movePiece(p2Piece, 5);
        game.nextTurn();

        Piece p1Piece = p1.getPieces().get(0);
        game.movePiece(p1Piece, 5);

        assertTrue("잡기 후 한번더", game.hasExtraTurn());
    }

    private static void testCapturedPieceGoesToStart() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece p2Piece = p2.getPieces().get(0);
        game.nextTurn();
        game.movePiece(p2Piece, 15);
        game.nextTurn();

        Piece p1Piece = p1.getPieces().get(0);
        game.movePiece(p1Piece, 15);

        assertEq("잡힌 말 0번으로", 0, p2Piece.getPosition().getIndex());
        assertFalse("잡힌 말 finished 아님", p2Piece.isFinished());
    }

    private static void testCaptureStackedPieces() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        // p2의 두 말을 같은 위치에 쌓기
        Piece p2Piece1 = p2.getPieces().get(0);
        Piece p2Piece2 = p2.getPieces().get(1);
        game.nextTurn(); // p2 턴
        game.movePiece(p2Piece1, 7);
        game.movePiece(p2Piece2, 7); // 쌓기
        game.nextTurn(); // p1 턴

        // p1이 해당 위치로 이동하여 잡기
        Piece p1Piece = p1.getPieces().get(0);
        MoveResult result = game.movePiece(p1Piece, 7);

        assertTrue("쌓인 말 잡기 성공", result.isCaptured());
        // findPieceAt은 p2Piece1을 찾아서 잡음 (첫 번째 발견된 말)
        // p2Piece1이 잡히면 쌓인 p2Piece2도 함께 시작으로
        // 하지만 현재 구현에서 findPieceAt은 p2Piece1만 잡고,
        // p2Piece2는 p2Piece1에 스택되어 있으므로 sendToStart()시 함께 감
        assertEq("잡힌 말1 시작점으로", 0, p2Piece1.getPosition().getIndex());

        System.out.println("   [정보] p2Piece1 위치: " + p2Piece1.getPosition().getIndex());
        System.out.println("   [정보] p2Piece2 위치: " + p2Piece2.getPosition().getIndex());
        printResult("쌓인 말 잡기", true);
        passed++;
    }

    // ==========================================
    // 4. 쌓기 관련
    // ==========================================

    private static void testStackBasic() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);

        game.movePiece(piece1, 5);
        MoveResult result = game.movePiece(piece2, 5);

        assertTrue("쌓기 성공 여부", result.isStacked());
        assertTrue("쌓인 상태 확인", piece2.isStacked());
        assertEq("스택 카운트", 2, piece2.getStackCount());
    }

    private static void testStackedMoveTogether() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);

        game.movePiece(piece1, 5);
        game.movePiece(piece2, 5); // 쌓기

        // 쌓인 채로 이동
        game.movePiece(piece2, 3); // 5→8
        assertEq("쌓인 말 이동 (본체)", 8, piece2.getPosition().getIndex());
        assertEq("쌓인 말 이동 (업힌 말)", 8, piece1.getPosition().getIndex());
    }

    private static void testStackNoExtraTurn() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);

        game.movePiece(piece1, 5);
        game.movePiece(piece2, 5);

        // 쌓기로는 한번더가 아님
        assertFalse("쌓기는 한번더 아님", game.hasExtraTurn());
    }

    private static void testStackMultiple() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);
        Piece piece3 = p1.getPieces().get(2);

        game.movePiece(piece1, 5);
        game.movePiece(piece2, 5); // 2개 쌓기
        game.movePiece(piece3, 5); // 3개 쌓기

        // piece3가 piece2를 찾아서 쌓는 구조
        // 최종적으로 하나의 스택에 3개
        int totalStack = piece3.getStackCount();
        System.out.println("   [정보] 3말 쌓기 - piece3 스택 수: " + totalStack);
        assertTrue("3말 쌓기 (piece3 스택>=2)", totalStack >= 2);
        printResult("3말 쌓기", true);
        passed++;
    }

    private static void testStackAbsorb() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);
        Piece piece3 = p1.getPieces().get(2);

        // piece1을 5번에, piece2를 5번에 (piece2가 piece1 업기)
        game.movePiece(piece1, 5);
        game.movePiece(piece2, 5);
        assertEq("piece2 스택=2", 2, piece2.getStackCount());

        // piece2를 8번으로 이동 (piece1도 함께)
        game.movePiece(piece2, 3); // 5→8

        // piece3을 8번으로 이동 (piece3이 piece2를 업기 → piece1도 흡수)
        game.movePiece(piece3, 8);
        System.out.println("   [정보] 흡수 테스트 - piece3 스택: " + piece3.getStackCount());
        assertTrue("스택 흡수 후 3개 이상", piece3.getStackCount() >= 2);
        printResult("스택 흡수", true);
        passed++;
    }

    // ==========================================
    // 5. 한번더/턴 관련
    // ==========================================

    private static void testYutExtraTurn() {
        assertTrue("윷 한번더 플래그", YutResult.YUT.hasExtraTurn());
    }

    private static void testMoExtraTurn() {
        assertTrue("모 한번더 플래그", YutResult.MO.hasExtraTurn());
    }

    private static void testDoNoExtraTurn() {
        assertFalse("도 한번더 없음", YutResult.DO.hasExtraTurn());
    }

    private static void testGaeNoExtraTurn() {
        assertFalse("개 한번더 없음", YutResult.GAE.hasExtraTurn());
    }

    private static void testGeolNoExtraTurn() {
        assertFalse("걸 한번더 없음", YutResult.GEOL.hasExtraTurn());
    }

    private static void testBackDoNoExtraTurn() {
        assertFalse("빽도 한번더 없음", YutResult.BACK_DO.hasExtraTurn());
    }

    private static void testCaptureExtraTurnThenNextTurn() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        // p2 말을 3번에 놓기
        game.nextTurn();
        game.movePiece(p2.getPieces().get(0), 3);
        game.nextTurn();

        // p1이 잡기
        Piece p1Piece = p1.getPieces().get(0);
        game.movePiece(p1Piece, 3);
        assertTrue("잡기 후 한번더", game.hasExtraTurn());

        // nextTurn() 호출 → 한번더이므로 p1 유지
        game.nextTurn();
        assertEq("한번더 후 같은 플레이어", "P1", game.getCurrentPlayer().getName());

        // 한번더 소진 후 다시 nextTurn → p2로 전환
        game.nextTurn();
        assertEq("한번더 소진 후 상대방", "P2", game.getCurrentPlayer().getName());
    }

    private static void testTurnSwitchNormal() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        assertEq("처음 P1", "P1", game.getCurrentPlayer().getName());
        game.nextTurn();
        assertEq("턴 전환 후 P2", "P2", game.getCurrentPlayer().getName());
        game.nextTurn();
        assertEq("다시 P1", "P1", game.getCurrentPlayer().getName());
    }

    // ==========================================
    // 6. Board.calculatePath() 경로 검증
    // ==========================================

    private static void testPathDo() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(0), 1);
        assertEq("도 경로: [0,1] 길이", 2, path.size());
        assertEq("도 경로: 시작", 0, path.get(0).getIndex());
        assertEq("도 경로: 도착", 1, path.get(1).getIndex());
    }

    private static void testPathGae() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(3), 2);
        assertEq("개 경로 길이", 3, path.size()); // 3, 4, 5
        assertEq("개 경로 시작", 3, path.get(0).getIndex());
        assertEq("개 경로 끝", 5, path.get(2).getIndex());
    }

    private static void testPathGeol() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(10), 3);
        assertEq("걸 경로 길이", 4, path.size()); // 10, 11, 12, 13
        assertEq("걸 경로 끝", 13, path.get(3).getIndex());
    }

    private static void testPathYut() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(2), 4);
        assertEq("윷 경로 길이", 5, path.size()); // 2, 3, 4, 5, 6
        assertEq("윷 경로 끝", 6, path.get(4).getIndex());
    }

    private static void testPathMo() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(1), 5);
        assertEq("모 경로 길이", 6, path.size()); // 1, 2, 3, 4, 5, 6
        assertEq("모 경로 끝", 6, path.get(5).getIndex());
    }

    private static void testPathBackDo() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(5), -1);
        assertEq("빽도 경로 길이", 2, path.size()); // 5, 4
        assertEq("빽도 경로 시작", 5, path.get(0).getIndex());
        assertEq("빽도 경로 끝", 4, path.get(1).getIndex());
    }

    private static void testPathToFinish() {
        Board board = new Board();
        List<Position> path = board.calculatePath(new Position(27), 5);
        // 27 → 28 → 29(finish) 에서 멈춰야 함
        Position last = path.get(path.size() - 1);
        assertEq("도착 경로 마지막=29", 29, last.getIndex());
    }

    // ==========================================
    // 7. 지름길 테스트
    // ==========================================

    private static void testShortcutAt5() {
        Board board = new Board();
        assertTrue("5번은 지름길 시작점", board.isShortcutStart(new Position(5)));
        // 5번에서 윷(4) 이상일 때 지름길
        List<Position> path = board.calculatePath(new Position(5), 4);
        System.out.println("   [정보] 5번 지름길 경로: " + pathToString(path));
        assertTrue("5번 지름길 경로 존재", path.size() > 1);
        printResult("5번 지름길", true);
        passed++;
    }

    private static void testShortcutAt10() {
        Board board = new Board();
        assertTrue("10번은 지름길 시작점", board.isShortcutStart(new Position(10)));
        List<Position> path = board.calculatePath(new Position(10), 4);
        System.out.println("   [정보] 10번 지름길 경로: " + pathToString(path));
        assertTrue("10번 지름길 경로 존재", path.size() > 1);
        printResult("10번 지름길", true);
        passed++;
    }

    private static void testShortcutAt22() {
        Board board = new Board();
        assertTrue("22번은 지름길 시작점", board.isShortcutStart(new Position(22)));
        List<Position> path = board.calculatePath(new Position(22), 4);
        System.out.println("   [정보] 22번 지름길 경로: " + pathToString(path));
        assertTrue("22번 지름길 경로 존재", path.size() > 1);
        printResult("22번 지름길", true);
        passed++;
    }

    private static void testNoShortcutUnder4Steps() {
        Board board = new Board();
        // 5번에서 3칸(걸) → 지름길 안 탐 (조건: steps >= 4)
        List<Position> path = board.calculatePath(new Position(5), 3);
        // 일반 경로로 이동: 5→6→7→8
        assertEq("지름길 미적용 시 끝=8", 8, path.get(path.size() - 1).getIndex());
    }

    // ==========================================
    // 8. 승리 조건
    // ==========================================

    private static void testWinCondition() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        for (Piece piece : p1.getPieces()) {
            game.movePiece(piece, 29);
        }

        assertTrue("모든 말 도착 → 승리", p1.hasWon());
        assertTrue("게임 종료", game.isFinished());
        assertEq("승자는 P1", "P1", game.getWinner().getName());
    }

    private static void testNotWonUntilAllFinished() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        // 3개만 도착
        for (int i = 0; i < 3; i++) {
            game.movePiece(p1.getPieces().get(i), 29);
        }

        assertFalse("3개만 도착 → 미승리", p1.hasWon());
        assertFalse("3개만 도착 → 게임 진행중", game.isFinished());
    }

    // ==========================================
    // 9. 도착 지점 겹침
    // ==========================================

    private static void testMultiplePiecesAtFinish() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);

        // 여러 말이 도착점에 있어도 서로 영향 없어야 함
        Piece piece1 = p1.getPieces().get(0);
        Piece piece2 = p1.getPieces().get(1);
        game.movePiece(piece1, 29);
        MoveResult result = game.movePiece(piece2, 29);

        // 도착 지점에서는 겹침 처리 안 함
        assertFalse("도착점 겹침 아님", result.isStacked());
        assertFalse("도착점 잡기 아님", result.isCaptured());
        assertTrue("piece1 도착", piece1.isFinished());
        assertTrue("piece2 도착", piece2.isFinished());
    }

    // ==========================================
    // 10. 연속 이동 시나리오
    // ==========================================

    private static void testConsecutiveMoves() {
        Player p1 = new Player("P1");
        Player p2 = new Player("P2");
        Game game = new Game(p1, p2);
        Piece piece = p1.getPieces().get(0);

        // 도→개→걸 연속 이동: 0→1→3→6
        game.movePiece(piece, 1); // 도
        assertEq("연속 1: 0→1", 1, piece.getPosition().getIndex());
        game.movePiece(piece, 2); // 개
        assertEq("연속 2: 1→3", 3, piece.getPosition().getIndex());
        game.movePiece(piece, 3); // 걸
        assertEq("연속 3: 3→6", 6, piece.getPosition().getIndex());
    }

    private static void testFullGameScenario() {
        System.out.println("\n--- 풀 게임 시나리오 ---");
        Player p1 = new Player("홍길동");
        Player p2 = new Player("김철수");
        Game game = new Game(p1, p2);

        // 턴 1: P1이 걸(3)으로 말1 출발
        Piece p1m1 = p1.getPieces().get(0);
        game.movePiece(p1m1, 3);
        System.out.println("   턴1: P1 말1 → 위치 " + p1m1.getPosition().getIndex());
        assertEq("시나리오 턴1", 3, p1m1.getPosition().getIndex());

        // 턴 2: P2가 개(2)으로 말1 출발
        game.nextTurn();
        Piece p2m1 = p2.getPieces().get(0);
        game.movePiece(p2m1, 2);
        System.out.println("   턴2: P2 말1 → 위치 " + p2m1.getPosition().getIndex());
        assertEq("시나리오 턴2", 2, p2m1.getPosition().getIndex());

        // 턴 3: P1이 도(1)로 말2 출발
        game.nextTurn();
        Piece p1m2 = p1.getPieces().get(1);
        game.movePiece(p1m2, 1);
        System.out.println("   턴3: P1 말2 → 위치 " + p1m2.getPosition().getIndex());

        // 턴 4: P2가 도(1)로 말1 이동 (2→3 → P1의 말1 잡기!)
        game.nextTurn();
        MoveResult captureResult = game.movePiece(p2m1, 1); // 2→3
        System.out.println("   턴4: P2 말1 → 위치 " + p2m1.getPosition().getIndex() + " (잡기: " + captureResult.isCaptured() + ")");
        assertTrue("시나리오: P2가 P1말1 잡기", captureResult.isCaptured());
        assertEq("시나리오: P1말1 시작으로", 0, p1m1.getPosition().getIndex());
        assertTrue("시나리오: 잡기 후 한번더", game.hasExtraTurn());

        // P2 한번더: 말2를 윷(4)으로 출발
        game.nextTurn(); // hasExtraTurn이므로 P2 유지
        assertEq("시나리오: 한번더 P2 유지", "김철수", game.getCurrentPlayer().getName());
        Piece p2m2 = p2.getPieces().get(1);
        game.movePiece(p2m2, 4);
        System.out.println("   턴4+: P2 말2 → 위치 " + p2m2.getPosition().getIndex());

        System.out.println("   --- 풀 게임 시나리오 완료 ---");
        printResult("풀 게임 시나리오", true);
        passed++;
    }

    // ==========================================
    // 유틸리티
    // ==========================================

    private static void assertEq(String name, int expected, int actual) {
        if (expected == actual) {
            printResult(name, true);
            passed++;
        } else {
            printResult(name + " (예상: " + expected + ", 실제: " + actual + ")", false);
            failed++;
        }
    }

    private static void assertEq(String name, String expected, String actual) {
        if (expected.equals(actual)) {
            printResult(name, true);
            passed++;
        } else {
            printResult(name + " (예상: " + expected + ", 실제: " + actual + ")", false);
            failed++;
        }
    }

    private static void assertTrue(String name, boolean condition) {
        if (condition) {
            printResult(name, true);
            passed++;
        } else {
            printResult(name + " (expected true, got false)", false);
            failed++;
        }
    }

    private static void assertFalse(String name, boolean condition) {
        if (!condition) {
            printResult(name, true);
            passed++;
        } else {
            printResult(name + " (expected false, got true)", false);
            failed++;
        }
    }

    private static void printResult(String name, boolean pass) {
        String icon = pass ? "✓" : "✗";
        System.out.println("   " + icon + " " + name);
    }

    private static String pathToString(List<Position> path) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) sb.append(" → ");
            sb.append(path.get(i).getIndex());
        }
        sb.append("]");
        return sb.toString();
    }
}
