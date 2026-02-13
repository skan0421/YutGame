package com.yutgame.dto;

public class RoomResponse {
    private String roomId;
    private String player1Name;
    private String player2Name;
    private String status; // WAITING, PLAYING, FINISHED

    public RoomResponse() {}

    public RoomResponse(String roomId, String player1Name, String player2Name, String status) {
        this.roomId = roomId;
        this.player1Name = player1Name;
        this.player2Name = player2Name;
        this.status = status;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getPlayer1Name() { return player1Name; }
    public void setPlayer1Name(String player1Name) { this.player1Name = player1Name; }

    public String getPlayer2Name() { return player2Name; }
    public void setPlayer2Name(String player2Name) { this.player2Name = player2Name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
