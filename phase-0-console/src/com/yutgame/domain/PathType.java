package com.yutgame.domain;

/**
 * 말을 전진/후진시 어떤 경로를 따라가고 있는지 표현.
 * 분기 지점(5, 10)에서 지름길을 선택했는지 기록해 뒤로 가기 계산에도 활용한다.
 */
public enum PathType {
    OUTER,
    DIAGONAL_FROM_5,
    DIAGONAL_FROM_10
}
