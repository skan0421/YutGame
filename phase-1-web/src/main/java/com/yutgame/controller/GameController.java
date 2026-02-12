package com.yutgame.controller;

import com.yutgame.dto.*;
import com.yutgame.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @MessageMapping("/game/{roomId}/throw")
    @SendTo("/topic/game/{roomId}")
    public GameStateResponse throwYut(
            @DestinationVariable String roomId,
            ThrowRequest request) {
        try {
            return gameService.throwYut(roomId, request.getPlayerName());
        } catch (Exception e) {
            GameStateResponse error = new GameStateResponse();
            error.setRoomId(roomId);
            error.setType("ERROR");
            error.setMessage(e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{roomId}/move")
    @SendTo("/topic/game/{roomId}")
    public GameStateResponse movePiece(
            @DestinationVariable String roomId,
            MoveRequest request) {
        try {
            return gameService.movePiece(roomId, request.getPlayerName(), request.getPieceIndex());
        } catch (Exception e) {
            GameStateResponse error = new GameStateResponse();
            error.setRoomId(roomId);
            error.setType("ERROR");
            error.setMessage(e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{roomId}/state")
    @SendTo("/topic/game/{roomId}")
    public GameStateResponse getState(@DestinationVariable String roomId) {
        try {
            return gameService.getGameState(roomId);
        } catch (Exception e) {
            GameStateResponse error = new GameStateResponse();
            error.setRoomId(roomId);
            error.setType("ERROR");
            error.setMessage(e.getMessage());
            return error;
        }
    }
}
