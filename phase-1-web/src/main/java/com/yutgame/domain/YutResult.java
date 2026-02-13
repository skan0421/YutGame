package com.yutgame.domain;

/**
 * 윷 던지기 결과
 */
public enum YutResult {
    BACK_DO(-1, "빽도"),
    DO(1, "도"),
    GAE(2, "개"),
    GEOL(3, "걸"),
    YUT(4, "윷"),
    MO(5, "모");
    
    private final int steps;
    private final String koreanName;
    
    YutResult(int steps, String koreanName) {
        this.steps = steps;
        this.koreanName = koreanName;
    }
    
    public int getSteps() {
        return steps;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    /**
     * 윷이나 모는 한 번 더 던질 수 있음
     */
    public boolean hasExtraTurn() {
        return this == YUT || this == MO;
    }
    
    @Override
    public String toString() {
        return koreanName + " (" + steps + "칸)";
    }
}
