package com.yutgame.dto;

import java.util.List;

public class PlayerDto {
    private String name;
    private List<PieceDto> pieces;
    private int finishedCount;

    public PlayerDto() {}

    public PlayerDto(String name, List<PieceDto> pieces, int finishedCount) {
        this.name = name;
        this.pieces = pieces;
        this.finishedCount = finishedCount;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<PieceDto> getPieces() { return pieces; }
    public void setPieces(List<PieceDto> pieces) { this.pieces = pieces; }

    public int getFinishedCount() { return finishedCount; }
    public void setFinishedCount(int finishedCount) { this.finishedCount = finishedCount; }
}
