package com.yutgame.domain;

/**
 * 윷판 위의 위치
 * 0: 시작, 21: 도착(종료)
 */
public class Position {
    private final int index;
    private final PathType pathType;

    public static final int START = 0;
    public static final int FINISH = 21;
    public static final int TOTAL_POSITIONS = 27; // 최고 인덱스 26까지 사용

    public Position(int index) {
        this(index, PathType.OUTER);
    }

    public Position(int index, PathType pathType) {
        if (index < 0 || index >= TOTAL_POSITIONS) {
            throw new IllegalArgumentException("Invalid position: " + index);
        }
        this.index = index;
        this.pathType = pathType;
    }
    
    public int getIndex() {
        return index;
    }

    public PathType getPathType() {
        return pathType;
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
