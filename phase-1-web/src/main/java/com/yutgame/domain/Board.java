package com.yutgame.domain;

import java.util.*;

/**
 * 윷판 — 전통 윷놀이 경로
 *
 * 외곽 (반시계, 20칸):
 *   0(시작/도착) → 1 → 2 → 3 → 4 → 5(좌하) → 6 → 7 → 8 → 9
 *   → 10(좌상) → 11 → 12 → 13 → 14 → 15(우상) → 16 → 17 → 18 → 19 → 도착(29)
 *
 * 지름길 (대각선):
 *   모서리5  → 20 → 21 → 22(중앙) → 27 → 28 → 도착
 *   모서리10 → 23 → 24 → 22(중앙) → 27 → 28 → 도착
 *   모서리15 → 25 → 26 → 22(중앙) → 27 → 28 → 도착
 */
public class Board {

    // 외곽 경로: position → next position
    private static final Map<Integer, Integer> OUTER_NEXT;
    // 지름길 경로: position → next position
    private static final Map<Integer, Integer> SHORTCUT_NEXT;
    // 빽도용: position → previous position
    private static final Map<Integer, Integer> BACKWARD;
    // 모서리 (지름길 입구)
    private static final Set<Integer> CORNERS = Set.of(5, 10, 15);
    // 지름길 위에 있는 위치들
    private static final Set<Integer> SHORTCUT_POSITIONS = Set.of(20, 21, 22, 23, 24, 25, 26, 27, 28);

    static {
        // 외곽 경로 (반시계 방향, 모서리도 그냥 통과)
        Map<Integer, Integer> outer = new HashMap<>();
        for (int i = 0; i <= 18; i++) {
            outer.put(i, i + 1);
        }
        outer.put(19, Position.FINISH); // 19 → 도착
        OUTER_NEXT = Collections.unmodifiableMap(outer);

        // 지름길 경로
        Map<Integer, Integer> sc = new HashMap<>();
        sc.put(5, 20);   sc.put(20, 21);  sc.put(21, 22);   // 모서리5 → 중앙
        sc.put(10, 23);  sc.put(23, 24);  sc.put(24, 22);   // 모서리10 → 중앙
        sc.put(15, 25);  sc.put(25, 26);  sc.put(26, 22);   // 모서리15 → 중앙
        sc.put(22, 27);  sc.put(27, 28);  sc.put(28, Position.FINISH); // 중앙 → 도착
        SHORTCUT_NEXT = Collections.unmodifiableMap(sc);

        // 빽도 (뒤로 가기)
        Map<Integer, Integer> bw = new HashMap<>();
        for (int i = 1; i <= 19; i++) {
            bw.put(i, i - 1);
        }
        bw.put(20, 5);   bw.put(21, 20);
        bw.put(22, 21);  // 중앙에서 빽도 → 5방향 (기본값)
        bw.put(23, 10);  bw.put(24, 23);
        bw.put(25, 15);  bw.put(26, 25);
        bw.put(27, 22);  bw.put(28, 27);
        BACKWARD = Collections.unmodifiableMap(bw);
    }

    /**
     * 현재 위치에서 steps만큼 이동한 새 위치 계산
     *
     * 규칙:
     * - 모서리(5,10,15)에 있는 말 → 지름길로 이동
     * - 이미 지름길 위에 있는 말 → 지름길 계속
     * - 외곽에 있는 말 → 외곽 경로 (모서리를 지나쳐도 지름길 안 탐)
     */
    public Position calculateNewPosition(Position currentPosition, int steps) {
        int current = currentPosition.getIndex();

        // 시작 위치에서 빽도 → 이동 없음
        if (steps < 0 && current == Position.START) {
            return currentPosition;
        }

        // 빽도 처리
        if (steps < 0) {
            int pos = current;
            for (int i = 0; i < Math.abs(steps); i++) {
                Integer prev = BACKWARD.get(pos);
                if (prev == null) break;
                pos = prev;
            }
            return new Position(pos);
        }

        // 정방향 이동
        boolean useShortcut = CORNERS.contains(current) || SHORTCUT_POSITIONS.contains(current);

        int pos = current;
        for (int i = 0; i < steps; i++) {
            Integer next;
            if (useShortcut) {
                next = SHORTCUT_NEXT.get(pos);
            } else {
                next = OUTER_NEXT.get(pos);
            }

            if (next == null) {
                return new Position(Position.FINISH);
            }

            pos = next;
            if (pos == Position.FINISH) break;
        }

        return new Position(pos);
    }

    /**
     * 이동 경로 (애니메이션용)
     * 시작 위치부터 도착 위치까지 거치는 모든 칸 반환
     */
    public List<Integer> getMovementPath(Position currentPosition, int steps) {
        List<Integer> path = new ArrayList<>();
        int current = currentPosition.getIndex();
        path.add(current);

        if (steps < 0 && current == Position.START) {
            return path;
        }

        if (steps < 0) {
            int pos = current;
            for (int i = 0; i < Math.abs(steps); i++) {
                Integer prev = BACKWARD.get(pos);
                if (prev == null) break;
                pos = prev;
                path.add(pos);
            }
            return path;
        }

        boolean useShortcut = CORNERS.contains(current) || SHORTCUT_POSITIONS.contains(current);
        int pos = current;
        for (int i = 0; i < steps; i++) {
            Integer next;
            if (useShortcut) {
                next = SHORTCUT_NEXT.get(pos);
            } else {
                next = OUTER_NEXT.get(pos);
            }
            if (next == null) {
                path.add(Position.FINISH);
                break;
            }
            pos = next;
            path.add(pos);
            if (pos == Position.FINISH) break;
        }

        return path;
    }

    public boolean isShortcutStart(Position position) {
        return CORNERS.contains(position.getIndex());
    }
}
