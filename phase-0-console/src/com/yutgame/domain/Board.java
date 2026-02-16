package com.yutgame.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * 윷판
 *
 * 기본 경로: 외곽 0(시작) → 1 → ... → 20 → 21(도착)
 * 지름길: 5, 10에서 중앙으로 향하는 대각선으로 분기 가능하며 중앙(24)에서 한 번 더 분기
 * - 5 → 22(대각) → 24(중앙) → 25 → 15 → 16 ... 21(도착)
 * - 10 → 26(대각) → 24(중앙) → 25 → 20 → 21(도착)
 */
public class Board {

    /**
     * 현재 위치에서 steps만큼 이동한 새 위치 계산
     */
    public Position calculateNewPosition(Position currentPosition, int steps) {
        if (steps == 0) {
            return currentPosition;
        }

        Position position = currentPosition;
        if (steps > 0) {
            for (int i = 0; i < steps; i++) {
                position = moveForward(position);
                if (position.isFinish()) {
                    break;
                }
            }
        } else {
            for (int i = 0; i < Math.abs(steps); i++) {
                Position next = moveBackward(position);
                // 시작을 더 밑으로 내려가지 않음
                if (next.equals(position)) {
                    break;
                }
                position = next;
            }
        }

        return position;
    }

    /**
     * 이동 경로 계산 (지름길 포함)
     * 나중에 애니메이션이나 상세 표시에 사용 가능
     */
    public List<Position> calculatePath(Position from, int steps) {
        List<Position> path = new ArrayList<>();
        path.add(from);

        Position position = from;
        if (steps > 0) {
            for (int i = 0; i < steps; i++) {
                position = moveForward(position);
                path.add(position);
                if (position.isFinish()) break;
            }
        } else if (steps < 0) {
            for (int i = 0; i < Math.abs(steps); i++) {
                Position next = moveBackward(position);
                if (next.equals(position)) {
                    break;
                }
                position = next;
                path.add(position);
                if (position.isStart()) break;
            }
        }

        return path;
    }

    /**
     * 전진 1칸 계산
     */
    private Position moveForward(Position current) {
        if (current.isFinish()) {
            return current;
        }

        int index = current.getIndex();
        PathType pathType = current.getPathType();

        // 공통 도착 처리
        if (index == Position.FINISH) {
            return current;
        }

        switch (pathType) {
            case OUTER:
                if (index == 5) {
                    return new Position(22, PathType.DIAGONAL_FROM_5);
                }
                if (index == 10) {
                    return new Position(26, PathType.DIAGONAL_FROM_10);
                }
                if (index == 20) {
                    return new Position(Position.FINISH, PathType.OUTER);
                }
                return new Position(index + 1, PathType.OUTER);

            case DIAGONAL_FROM_5:
                if (index == 5) {
                    return new Position(22, PathType.DIAGONAL_FROM_5);
                }
                if (index == 22) {
                    return new Position(24, PathType.DIAGONAL_FROM_5);
                }
                if (index == 24) {
                    return new Position(25, PathType.DIAGONAL_FROM_5);
                }
                if (index == 25) {
                    return new Position(15, PathType.DIAGONAL_FROM_5);
                }
                if (index == 20) {
                    return new Position(Position.FINISH, PathType.DIAGONAL_FROM_5);
                }
                return new Position(index + 1, PathType.DIAGONAL_FROM_5);

            case DIAGONAL_FROM_10:
                if (index == 10) {
                    return new Position(26, PathType.DIAGONAL_FROM_10);
                }
                if (index == 26) {
                    return new Position(24, PathType.DIAGONAL_FROM_10);
                }
                if (index == 24) {
                    return new Position(25, PathType.DIAGONAL_FROM_10);
                }
                if (index == 25) {
                    return new Position(20, PathType.DIAGONAL_FROM_10);
                }
                if (index == 20) {
                    return new Position(Position.FINISH, PathType.DIAGONAL_FROM_10);
                }
                return new Position(index + 1, PathType.DIAGONAL_FROM_10);
            default:
                throw new IllegalStateException("Unknown path type: " + pathType);
        }
    }

    /**
     * 후진 1칸 계산 (빽도)
     */
    private Position moveBackward(Position current) {
        if (current.isStart()) {
            return current;
        }

        int index = current.getIndex();
        PathType pathType = current.getPathType();

        switch (pathType) {
            case OUTER:
                if (current.isFinish()) {
                    return new Position(20, PathType.OUTER);
                }
                int nextIndex = Math.max(Position.START, index - 1);
                return new Position(nextIndex, PathType.OUTER);

            case DIAGONAL_FROM_5:
                if (current.isFinish()) {
                    return new Position(20, PathType.DIAGONAL_FROM_5);
                }
                if (index == 20) {
                    return new Position(19, PathType.DIAGONAL_FROM_5);
                }
                if (index > 15) {
                    return new Position(index - 1, PathType.DIAGONAL_FROM_5);
                }
                if (index == 15) {
                    return new Position(25, PathType.DIAGONAL_FROM_5);
                }
                if (index == 25) {
                    return new Position(24, PathType.DIAGONAL_FROM_5);
                }
                if (index == 24) {
                    return new Position(22, PathType.DIAGONAL_FROM_5);
                }
                if (index == 22) {
                    return new Position(5, PathType.OUTER);
                }
                return new Position(Math.max(Position.START, index - 1), PathType.DIAGONAL_FROM_5);

            case DIAGONAL_FROM_10:
                if (current.isFinish()) {
                    return new Position(20, PathType.DIAGONAL_FROM_10);
                }
                if (index == 20) {
                    return new Position(25, PathType.DIAGONAL_FROM_10);
                }
                if (index == 25) {
                    return new Position(24, PathType.DIAGONAL_FROM_10);
                }
                if (index == 24) {
                    return new Position(26, PathType.DIAGONAL_FROM_10);
                }
                if (index == 26) {
                    return new Position(10, PathType.OUTER);
                }
                return new Position(Math.max(Position.START, index - 1), PathType.DIAGONAL_FROM_10);
            default:
                throw new IllegalStateException("Unknown path type: " + pathType);
        }
    }
}
