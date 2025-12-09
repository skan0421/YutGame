package com.yutgame.test;

import com.yutgame.domain.*;

/**
 * 간단한 게임 로직 테스트
 * (실제 단위 테스트는 JUnit 사용 예정)
 */
public class SimpleTest {
    
    public static void main(String[] args) {
        System.out.println("=== 윷놀이 게임 로직 테스트 ===\n");
        
        testBasicSetup();
        testPieceMovement();
        testCapture();
        testStacking();
        testWinCondition();
        
        System.out.println("\n=== 모든 테스트 통과! ===");
    }
    
    private static void testBasicSetup() {
        System.out.println("1. 기본 설정 테스트");
        
        Player p1 = new Player("테스트1");
        Player p2 = new Player("테스트2");
        Game game = new Game(p1, p2);
        
        assert game.getCurrentPlayer() == p1;
        assert p1.getPieces().size() == 4;
        assert p2.getPieces().size() == 4;
        assert !game.isFinished();
        
        System.out.println("   ✓ 플레이어 생성");
        System.out.println("   ✓ 게임 초기화");
        System.out.println();
    }
    
    private static void testPieceMovement() {
        System.out.println("2. 말 이동 테스트");
        
        Player p1 = new Player("테스트1");
        Player p2 = new Player("테스트2");
        Game game = new Game(p1, p2);
        
        Piece piece = p1.getPieces().get(0);
        assert piece.getPosition().getIndex() == 0;
        
        // 3칸 이동
        MoveResult result = game.movePiece(piece, 3);
        assert piece.getPosition().getIndex() == 3;
        assert !result.isCaptured();
        assert !result.isStacked();
        
        System.out.println("   ✓ 말 이동 (0 → 3)");
        System.out.println();
    }
    
    private static void testCapture() {
        System.out.println("3. 잡기 테스트");
        
        Player p1 = new Player("테스트1");
        Player p2 = new Player("테스트2");
        Game game = new Game(p1, p2);
        
        // p2의 말을 5번에 놓기
        Piece p2Piece = p2.getPieces().get(0);
        game.nextTurn(); // p2 턴
        game.movePiece(p2Piece, 5);
        assert p2Piece.getPosition().getIndex() == 5;
        
        // p1의 말로 잡기
        game.nextTurn(); // p1 턴
        Piece p1Piece = p1.getPieces().get(0);
        MoveResult result = game.movePiece(p1Piece, 5);
        
        assert result.isCaptured();
        assert p2Piece.getPosition().getIndex() == 0; // 시작점으로
        assert p1Piece.getPosition().getIndex() == 5;
        assert game.hasExtraTurn(); // 한 번 더
        
        System.out.println("   ✓ 상대 말 잡기");
        System.out.println("   ✓ 잡힌 말 시작점으로");
        System.out.println("   ✓ 한 번 더");
        System.out.println();
    }
    
    private static void testStacking() {
        System.out.println("4. 쌓기 테스트");
        
        Player p1 = new Player("테스트1");
        Player p2 = new Player("테스트2");
        Game game = new Game(p1, p2);
        
        // p1의 첫 번째 말을 3번에
        Piece piece1 = p1.getPieces().get(0);
        game.movePiece(piece1, 3);
        
        // p1의 두 번째 말도 3번에 (쌓기)
        Piece piece2 = p1.getPieces().get(1);
        MoveResult result = game.movePiece(piece2, 3);
        
        assert result.isStacked();
        assert piece2.isStacked();
        assert piece2.getStackCount() == 2;
        
        // 쌓인 말 함께 이동
        game.movePiece(piece2, 2);
        assert piece2.getPosition().getIndex() == 5;
        assert piece1.getPosition().getIndex() == 5; // 함께 이동
        
        System.out.println("   ✓ 말 쌓기");
        System.out.println("   ✓ 쌓인 말 함께 이동");
        System.out.println();
    }
    
    private static void testWinCondition() {
        System.out.println("5. 승리 조건 테스트");
        
        Player p1 = new Player("테스트1");
        Player p2 = new Player("테스트2");
        Game game = new Game(p1, p2);
        
        // p1의 모든 말을 도착시킴
        for (Piece piece : p1.getPieces()) {
            game.movePiece(piece, 29);
        }
        
        assert p1.hasWon();
        assert game.isFinished();
        assert game.getWinner() == p1;
        
        System.out.println("   ✓ 승리 조건 확인");
        System.out.println();
    }
}
