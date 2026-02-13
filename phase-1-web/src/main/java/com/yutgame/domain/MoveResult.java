package com.yutgame.domain;

/**
 * 말 이동 결과
 */
public class MoveResult {
    private final boolean captured;  // 상대 말을 잡았는지
    private final boolean stacked;   // 내 말과 겹쳤는지
    private final Position newPosition;
    
    public MoveResult(boolean captured, boolean stacked, Position newPosition) {
        this.captured = captured;
        this.stacked = stacked;
        this.newPosition = newPosition;
    }
    
    public boolean isCaptured() {
        return captured;
    }
    
    public boolean isStacked() {
        return stacked;
    }
    
    public Position getNewPosition() {
        return newPosition;
    }
    
    /**
     * 한 번 더 던질 수 있는지 (잡기 성공 시)
     */
    public boolean hasExtraTurn() {
        return captured;
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("이동 완료: ").append(newPosition);
        if (captured) {
            sb.append(" [잡기 성공!]");
        }
        if (stacked) {
            sb.append(" [말 겹침]");
        }
        return sb.toString();
    }
}
