package com.yutgame.dto;

public class MoveRequest {
    private String playerName;
    private int pieceIndex; // 0-3

    public MoveRequest() {}

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public int getPieceIndex() { return pieceIndex; }
    public void setPieceIndex(int pieceIndex) { this.pieceIndex = pieceIndex; }
}
