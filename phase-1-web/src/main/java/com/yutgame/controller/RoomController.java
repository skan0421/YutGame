package com.yutgame.controller;

import com.yutgame.dto.*;
import com.yutgame.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final GameService gameService;

    public RoomController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createRoom(@RequestBody CreateRoomRequest request) {
        String roomId = gameService.createRoom(request.getPlayerName());
        return ResponseEntity.ok(Map.of("roomId", roomId));
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getWaitingRooms() {
        return ResponseEntity.ok(gameService.getWaitingRooms());
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String roomId,
            @RequestBody JoinRoomRequest request) {
        gameService.joinRoom(roomId, request.getPlayerName());
        return ResponseEntity.ok(gameService.getRoomInfo(roomId));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomInfo(@PathVariable String roomId) {
        return ResponseEntity.ok(gameService.getRoomInfo(roomId));
    }
}
