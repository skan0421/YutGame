package com.yutgame.dto;

public class PieceDto {
    private String id;
    private int position;
    private boolean finished;
    private int stackCount;

    public PieceDto() {}

    public PieceDto(String id, int position, boolean finished, int stackCount) {
        this.id = id;
        this.position = position;
        this.finished = finished;
        this.stackCount = stackCount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getStackCount() { return stackCount; }
    public void setStackCount(int stackCount) { this.stackCount = stackCount; }
}
