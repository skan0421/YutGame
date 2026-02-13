package com.yutgame.domain;

import java.util.Random;

/**
 * 윷놀이 게임 (2인)
 * 
 * 게임 흐름:
 * 1. throwYut() - 윷 던지기
 * 2. movePiece() - 말 이동
 * 3. 잡기/쌓기/한번더 체크
 * 4. nextTurn() - 턴 넘김 (한번더가 아니면)
 */
public class Game {
    private final Board board;
    private final Player player1;
    private final Player player2;
    private Player currentPlayer;
    private boolean hasExtraTurn;  // 윷/모/잡기로 인한 한 번 더
    private boolean finished;
    private Player winner;
    private int turnCount;
    
    private final Random random;
    
    public Game(Player player1, Player player2) {
        this.board = new Board();
        this.player1 = player1;
        this.player2 = player2;
        this.currentPlayer = player1;
        this.hasExtraTurn = false;
        this.finished = false;
        this.turnCount = 0;
        this.random = new Random();
    }
    
    /**
     * 윷 던지기
     */
    public YutResult throwYut() {
        int value = random.nextInt(100);
        
        // 확률 분배 (실제 윷놀이와 유사하게)
        if (value < 5) return YutResult.BACK_DO;  // 5%
        if (value < 40) return YutResult.DO;      // 35%
        if (value < 65) return YutResult.GAE;     // 25%
        if (value < 85) return YutResult.GEOL;    // 20%
        if (value < 95) return YutResult.YUT;     // 10%
        return YutResult.MO;                       // 5%
    }
    
    /**
     * 말 이동
     * 
     * @throws IllegalArgumentException 내 말이 아니거나 이동 불가능한 경우
     */
    public MoveResult movePiece(Piece piece, int steps) {
        // 검증
        if (piece.getOwner() != currentPlayer) {
            throw new IllegalArgumentException("내 말이 아닙니다!");
        }
        
        if (piece.isFinished()) {
            throw new IllegalArgumentException("이미 도착한 말입니다!");
        }
        
        // 새 위치 계산
        Position currentPos = piece.getPosition();
        Position newPos = board.calculateNewPosition(currentPos, steps);
        
        // 해당 위치에 다른 말이 있는지 확인 (자기 자신 제외)
        Piece pieceAtPosition = findPieceAt(newPos, piece);

        boolean captured = false;
        boolean stacked = false;

        if (pieceAtPosition != null && !newPos.isFinish() && !newPos.isStart()) {
            if (pieceAtPosition.getOwner() == currentPlayer) {
                // 내 말 -> 쌓기 (업기)
                piece.stackWith(pieceAtPosition);
                stacked = true;
            } else {
                // 상대 말 -> 잡기
                pieceAtPosition.sendToStart();
                captured = true;
                hasExtraTurn = true;  // 잡으면 한 번 더
            }
        }
        
        // 말 이동
        piece.moveTo(newPos);
        
        // 승리 확인
        if (currentPlayer.hasWon()) {
            finished = true;
            winner = currentPlayer;
        }
        
        return new MoveResult(captured, stacked, newPos);
    }
    
    /**
     * 특정 위치에 있는 말 찾기
     * (도착 지점 제외)
     */
    private Piece findPieceAt(Position position, Piece exclude) {
        if (position.isFinish() || position.isStart()) {
            return null;  // 도착/시작 지점은 충돌 체크 안 함
        }

        // 플레이어1의 말 확인
        for (Piece p : player1.getPieces()) {
            if (p != exclude && p.getPosition().equals(position) && !p.isFinished()) {
                return p;
            }
        }

        // 플레이어2의 말 확인
        for (Piece p : player2.getPieces()) {
            if (p != exclude && p.getPosition().equals(position) && !p.isFinished()) {
                return p;
            }
        }

        return null;
    }
    
    /**
     * 턴 넘기기
     * 한 번 더가 아니면 상대방에게 턴 넘김
     */
    public void nextTurn() {
        if (!hasExtraTurn) {
            currentPlayer = (currentPlayer == player1) ? player2 : player1;
            turnCount++;
        }
        hasExtraTurn = false;
    }
    
    /**
     * 윷/모가 나왔을 때 한 번 더 설정
     */
    public void setExtraTurn(boolean extraTurn) {
        this.hasExtraTurn = extraTurn;
    }
    
    // Getters
    
    public Board getBoard() {
        return board;
    }
    
    public Player getPlayer1() {
        return player1;
    }
    
    public Player getPlayer2() {
        return player2;
    }
    
    public Player getCurrentPlayer() {
        return currentPlayer;
    }
    
    public boolean hasExtraTurn() {
        return hasExtraTurn;
    }
    
    public boolean isFinished() {
        return finished;
    }
    
    public Player getWinner() {
        return winner;
    }
    
    public int getTurnCount() {
        return turnCount;
    }
    
    public Player getOpponent(Player player) {
        return (player == player1) ? player2 : player1;
    }
}
