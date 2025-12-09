package com.yutgame;

import com.yutgame.console.ConsoleUI;
import com.yutgame.console.InputHandler;
import com.yutgame.domain.*;

/**
 * 윷놀이 게임 메인 클래스
 */
public class Main {
    
    public static void main(String[] args) {
        ConsoleUI ui = new ConsoleUI();
        InputHandler input = new InputHandler();
        
        ui.printWelcome();
        
        boolean playAgain = true;
        
        while (playAgain) {
            playGame(ui, input);
            playAgain = input.askPlayAgain();
        }
        
        System.out.println("\n게임을 종료합니다. 감사합니다!");
        input.close();
    }
    
    private static void playGame(ConsoleUI ui, InputHandler input) {
        // 플레이어 생성
        String name1 = input.readPlayerName(1);
        String name2 = input.readPlayerName(2);
        
        Player player1 = new Player(name1);
        Player player2 = new Player(name2);
        
        // 게임 생성
        Game game = new Game(player1, player2);
        
        ui.printDivider();
        System.out.println("게임을 시작합니다!");
        ui.printDivider();
        
        // 게임 루프
        while (!game.isFinished()) {
            playTurn(game, ui, input);
        }
        
        // 게임 종료
        ui.printWinner(game.getWinner(), game.getTurnCount());
    }
    
    private static void playTurn(Game game, ConsoleUI ui, InputHandler input) {
        // 현재 게임 상태 표시
        ui.printGameState(game);
        
        Player currentPlayer = game.getCurrentPlayer();
        
        // 윷 던지기
        input.waitForEnter(">>> [Enter]를 눌러 윷을 던지세요...");
        YutResult yutResult = game.throwYut();
        ui.printYutResult(yutResult);
        
        // 윷/모면 한 번 더
        if (yutResult.hasExtraTurn()) {
            game.setExtraTurn(true);
        }
        
        // 이동 가능한 말 표시
        ui.printMovablePieces(currentPlayer);
        
        // 말 선택 및 이동
        boolean moveSuccess = false;
        while (!moveSuccess) {
            try {
                int pieceNumber = input.readPieceNumber(4);
                Piece selectedPiece = currentPlayer.getPieces().get(pieceNumber - 1);
                
                // 말 이동
                MoveResult moveResult = game.movePiece(selectedPiece, yutResult.getSteps());
                ui.printMoveResult(moveResult);
                
                moveSuccess = true;
                
                // 잡기 성공 시 한 번 더
                if (moveResult.hasExtraTurn()) {
                    game.setExtraTurn(true);
                }
                
            } catch (IllegalArgumentException e) {
                ui.printError(e.getMessage());
                System.out.println("다른 말을 선택하세요.");
            }
        }
        
        // 게임이 끝나지 않았으면 턴 넘김
        if (!game.isFinished()) {
            if (!game.hasExtraTurn()) {
                input.waitForEnter(">>> [Enter]를 눌러 턴을 넘기세요...");
            }
            game.nextTurn();
        }
    }
}
