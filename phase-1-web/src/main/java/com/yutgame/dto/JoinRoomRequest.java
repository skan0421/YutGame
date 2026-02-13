package com.yutgame.dto;

public class JoinRoomRequest {
    private String playerName;

    public JoinRoomRequest() {}

    public JoinRoomRequest(String playerName) {
        this.playerName = playerName;
    }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
}
