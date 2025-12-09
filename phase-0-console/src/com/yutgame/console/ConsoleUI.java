package com.yutgame.console;

import com.yutgame.domain.*;
import java.util.List;

/**
 * 콘솔 출력 담당
 */
public class ConsoleUI {
    
    public void printWelcome() {
        System.out.println("================================");
        System.out.println("     윷놀이 게임에 오신 것을");
        System.out.println("        환영합니다!");
        System.out.println("================================");
        System.out.println();
    }
    
    public void printGameState(Game game) {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("턴: " + game.getTurnCount());
        System.out.println("=".repeat(50));
        
        printPlayerInfo(game.getPlayer1(), game.getCurrentPlayer() == game.getPlayer1());
        System.out.println();
        printPlayerInfo(game.getPlayer2(), game.getCurrentPlayer() == game.getPlayer2());
        
        System.out.println("\n현재 턴: " + game.getCurrentPlayer().getName());
        if (game.hasExtraTurn()) {
            System.out.println(">>> 한 번 더! <<<");
        }
        System.out.println("=".repeat(50));
    }
    
    private void printPlayerInfo(Player player, boolean isCurrentPlayer) {
        String marker = isCurrentPlayer ? "▶ " : "  ";
        System.out.println(marker + player.getName() + " (도착: " + 
            player.getFinishedPieces().size() + "/4)");
        
        List<Piece> pieces = player.getPieces();
        for (int i = 0; i < pieces.size(); i++) {
            Piece piece = pieces.get(i);
            System.out.printf("  말%d: ", i + 1);
            
            if (piece.isFinished()) {
                System.out.print("도착!");
            } else {
                System.out.print("위치=" + piece.getPosition().getIndex());
                if (piece.isStacked()) {
                    System.out.print(" (×" + piece.getStackCount() + ")");
                }
            }
            System.out.println();
        }
    }
    
    public void printYutResult(YutResult result) {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("윷 결과: " + result);
        if (result.hasExtraTurn()) {
            System.out.println(">>> " + result.getKoreanName() + "! 한 번 더 던질 수 있습니다! <<<");
        }
        System.out.println("=".repeat(50));
    }
    
    public void printMoveResult(MoveResult result) {
        System.out.println("\n" + result);
        
        if (result.isCaptured()) {
            System.out.println("★★★ 상대 말을 잡았습니다! 한 번 더! ★★★");
        }
        
        if (result.isStacked()) {
            System.out.println("◆◆◆ 내 말과 겹쳤습니다! ◆◆◆");
        }
    }
    
    public void printMovablePieces(Player player) {
        System.out.println("\n이동 가능한 말:");
        List<Piece> movable = player.getMovablePieces();
        
        for (int i = 0; i < movable.size(); i++) {
            Piece piece = movable.get(i);
            int pieceNum = player.getPieces().indexOf(piece) + 1;
            
            System.out.printf("[%d] 말%d: ", pieceNum, pieceNum);
            
            if (piece.getPosition().isStart()) {
                System.out.print("시작 위치");
            } else {
                System.out.print("위치=" + piece.getPosition().getIndex());
            }
            
            if (piece.isStacked()) {
                System.out.print(" (×" + piece.getStackCount() + ")");
            }
            
            System.out.println();
        }
    }
    
    public void printWinner(Player winner, int turns) {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("           게임 종료!");
        System.out.println("=".repeat(50));
        System.out.println();
        System.out.println("    🏆 승자: " + winner.getName() + " 🏆");
        System.out.println();
        System.out.println("총 턴 수: " + turns);
        System.out.println("=".repeat(50));
    }
    
    public void printError(String message) {
        System.out.println("\n❌ 에러: " + message);
    }
    
    public void printDivider() {
        System.out.println("\n" + "-".repeat(50) + "\n");
    }
}
