package com.yutgame.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 윷판
 * 
 * 기본 경로: 0 -> 1 -> 2 -> ... -> 29 (도착)
 * 
 * TODO: 실제 윷놀이 지름길 규칙에 맞게 수정 필요
 * 현재는 간단하게 특정 위치에서 점프하는 방식으로 구현
 */
public class Board {
    
    // 지름길 정의 (시작 위치 -> 지름길 경로)
    // TODO: 실제 윷놀이 규칙에 맞게 수정
    private static final Map<Integer, List<Integer>> SHORTCUTS = Map.of(
        5, List.of(20, 21, 22),      // 5번에서 대각선
        10, List.of(23, 24, 25),     // 10번에서 중앙
        22, List.of(25, 26, 27)      // 합류
    );
    
    /**
     * 현재 위치에서 steps만큼 이동한 새 위치 계산
     */
    public Position calculateNewPosition(Position currentPosition, int steps) {
        int current = currentPosition.getIndex();
        
        // 빽도 처리
        if (steps < 0) {
            int newIndex = Math.max(0, current + steps);
            return new Position(newIndex);
        }
        
        // 일반 이동
        int newIndex = current + steps;
        
        // 도착 지점을 넘으면 도착으로 처리
        if (newIndex >= Position.FINISH) {
            return new Position(Position.FINISH);
        }
        
        return new Position(newIndex);
    }
    
    /**
     * 이동 경로 계산 (지름길 포함)
     * 나중에 애니메이션이나 상세 표시에 사용 가능
     */
    public List<Position> calculatePath(Position from, int steps) {
        List<Position> path = new ArrayList<>();
        path.add(from);
        
        int current = from.getIndex();
        
        // 빽도
        if (steps < 0) {
            for (int i = 1; i <= Math.abs(steps); i++) {
                int next = Math.max(0, current - i);
                path.add(new Position(next));
                if (next == 0) break;
            }
            return path;
        }
        
        // 지름길 체크
        if (SHORTCUTS.containsKey(current) && steps >= 4) {
            // 지름길로 이동
            List<Integer> shortcut = SHORTCUTS.get(current);
            for (int i = 0; i < Math.min(steps, shortcut.size()); i++) {
                path.add(new Position(shortcut.get(i)));
            }
            
            // 남은 칸이 있으면 계속 이동
            int remaining = steps - shortcut.size();
            if (remaining > 0) {
                int lastShortcutPos = shortcut.get(shortcut.size() - 1);
                for (int i = 1; i <= remaining; i++) {
                    int next = lastShortcutPos + i;
                    if (next >= Position.FINISH) {
                        path.add(new Position(Position.FINISH));
                        break;
                    }
                    path.add(new Position(next));
                }
            }
        } else {
            // 일반 경로로 이동
            for (int i = 1; i <= steps; i++) {
                int next = current + i;
                if (next >= Position.FINISH) {
                    path.add(new Position(Position.FINISH));
                    break;
                }
                path.add(new Position(next));
            }
        }
        
        return path;
    }
    
    /**
     * 특정 위치가 지름길 시작점인지 확인
     */
    public boolean isShortcutStart(Position position) {
        return SHORTCUTS.containsKey(position.getIndex());
    }
}
