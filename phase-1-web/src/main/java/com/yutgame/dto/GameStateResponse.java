package com.yutgame.dto;

public class GameStateResponse {
    private String roomId;
    private String type; // STATE, THROW_RESULT, MOVE_RESULT, GAME_OVER, ERROR, WAITING
    private PlayerDto player1;
    private PlayerDto player2;
    private String currentPlayerName;
    private boolean hasExtraTurn;
    private boolean finished;
    private String winnerName;
    private int turnCount;

    // 윷 던지기 결과용
    private String yutResult;
    private String yutResultName;
    private int yutSteps;

    // 말 이동 결과용
    private boolean captured;
    private boolean stacked;
    private String message;

    public GameStateResponse() {}

    // Getters & Setters
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public PlayerDto getPlayer1() { return player1; }
    public void setPlayer1(PlayerDto player1) { this.player1 = player1; }

    public PlayerDto getPlayer2() { return player2; }
    public void setPlayer2(PlayerDto player2) { this.player2 = player2; }

    public String getCurrentPlayerName() { return currentPlayerName; }
    public void setCurrentPlayerName(String currentPlayerName) { this.currentPlayerName = currentPlayerName; }

    public boolean isHasExtraTurn() { return hasExtraTurn; }
    public void setHasExtraTurn(boolean hasExtraTurn) { this.hasExtraTurn = hasExtraTurn; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public String getWinnerName() { return winnerName; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }

    public int getTurnCount() { return turnCount; }
    public void setTurnCount(int turnCount) { this.turnCount = turnCount; }

    public String getYutResult() { return yutResult; }
    public void setYutResult(String yutResult) { this.yutResult = yutResult; }

    public String getYutResultName() { return yutResultName; }
    public void setYutResultName(String yutResultName) { this.yutResultName = yutResultName; }

    public int getYutSteps() { return yutSteps; }
    public void setYutSteps(int yutSteps) { this.yutSteps = yutSteps; }

    public boolean isCaptured() { return captured; }
    public void setCaptured(boolean captured) { this.captured = captured; }

    public boolean isStacked() { return stacked; }
    public void setStacked(boolean stacked) { this.stacked = stacked; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
