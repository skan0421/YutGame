package com.yutgame.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * 말 하나를 나타냄
 */
public class Piece {
    private final String id;
    private final Player owner;
    private Position position;
    private List<Piece> stackedPieces; // 업힌 말들
    private boolean finished;
    
    public Piece(String id, Player owner) {
        this.id = id;
        this.owner = owner;
        this.position = new Position(Position.START);
        this.stackedPieces = new ArrayList<>();
        this.finished = false;
    }
    
    public String getId() {
        return id;
    }
    
    public Player getOwner() {
        return owner;
    }
    
    public Position getPosition() {
        return position;
    }
    
    public boolean isFinished() {
        return finished;
    }
    
    public boolean isStacked() {
        return !stackedPieces.isEmpty();
    }
    
    public int getStackCount() {
        return 1 + stackedPieces.size();
    }
    
    public List<Piece> getStackedPieces() {
        return new ArrayList<>(stackedPieces);
    }
    
    /**
     * 말을 새 위치로 이동
     */
    public void moveTo(Position newPosition) {
        this.position = newPosition;
        
        // 도착 지점이면 finished 처리
        if (newPosition.isFinish()) {
            this.finished = true;
        }
        
        // 업힌 말들도 함께 이동
        for (Piece stacked : stackedPieces) {
            stacked.position = newPosition;
            if (newPosition.isFinish()) {
                stacked.finished = true;
            }
        }
    }
    
    /**
     * 다른 말과 겹치기 (업기)
     */
    public void stackWith(Piece other) {
        this.stackedPieces.add(other);
        // 상대방이 이미 업힌 말이 있으면 모두 가져옴
        if (other.isStacked()) {
            this.stackedPieces.addAll(other.stackedPieces);
            other.stackedPieces.clear();
        }
    }
    
    /**
     * 잡혀서 처음으로 돌아감
     */
    public void sendToStart() {
        this.position = new Position(Position.START);
        this.finished = false;
        
        // 업힌 말들도 모두 처음으로
        for (Piece stacked : stackedPieces) {
            stacked.position = new Position(Position.START);
            stacked.finished = false;
        }
        stackedPieces.clear();
    }
    
    @Override
    public String toString() {
        String base = id + "@" + position.getIndex();
        if (isStacked()) {
            base += "(×" + getStackCount() + ")";
        }
        if (finished) {
            base += "[도착]";
        }
        return base;
    }
}
