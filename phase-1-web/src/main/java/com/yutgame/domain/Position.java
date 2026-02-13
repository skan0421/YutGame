package com.yutgame.domain;

/**
 * 윷판 위의 위치
 * 0: 시작, 29: 도착
 */
public class Position {
    private final int index;
    
    public static final int START = 0;
    public static final int FINISH = 29;
    public static final int TOTAL_POSITIONS = 30;
    
    public Position(int index) {
        if (index < 0 || index >= TOTAL_POSITIONS) {
            throw new IllegalArgumentException("Invalid position: " + index);
        }
        this.index = index;
    }
    
    public int getIndex() {
        return index;
    }
    
    public boolean isStart() {
        return index == START;
    }
    
    public boolean isFinish() {
        return index == FINISH;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Position position = (Position) o;
        return index == position.index;
    }
    
    @Override
    public int hashCode() {
        return Integer.hashCode(index);
    }
    
    @Override
    public String toString() {
        if (isStart()) return "시작";
        if (isFinish()) return "도착";
        return "위치" + index;
    }
}
