package com.yutgame.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * 플레이어 (4개의 말을 소유)
 */
public class Player {
    private final String name;
    private final List<Piece> pieces;
    
    private static final int PIECES_PER_PLAYER = 4;
    
    public Player(String name) {
        this.name = name;
        this.pieces = new ArrayList<>();
        
        // 4개의 말 생성
        for (int i = 0; i < PIECES_PER_PLAYER; i++) {
            pieces.add(new Piece(name + "-말" + (i + 1), this));
        }
    }
    
    public String getName() {
        return name;
    }
    
    public List<Piece> getPieces() {
        return new ArrayList<>(pieces);
    }
    
    /**
     * 아직 안 들어간 말들 (위치 0에 있는 말들)
     */
    public List<Piece> getWaitingPieces() {
        return pieces.stream()
            .filter(p -> p.getPosition().isStart() && !p.isFinished())
            .toList();
    }
    
    /**
     * 게임 중인 말들 (위치 1~28에 있는 말들)
     */
    public List<Piece> getPlayingPieces() {
        return pieces.stream()
            .filter(p -> !p.getPosition().isStart() 
                      && !p.getPosition().isFinish() 
                      && !p.isFinished())
            .toList();
    }
    
    /**
     * 도착한 말들
     */
    public List<Piece> getFinishedPieces() {
        return pieces.stream()
            .filter(Piece::isFinished)
            .toList();
    }
    
    /**
     * 모든 말이 도착했는지 확인
     */
    public boolean hasWon() {
        return pieces.stream().allMatch(Piece::isFinished);
    }
    
    /**
     * 이동 가능한 말 목록
     */
    public List<Piece> getMovablePieces() {
        return pieces.stream()
            .filter(p -> !p.isFinished())
            .toList();
    }
    
    @Override
    public String toString() {
        return name + " (도착: " + getFinishedPieces().size() + "/4)";
    }
}
