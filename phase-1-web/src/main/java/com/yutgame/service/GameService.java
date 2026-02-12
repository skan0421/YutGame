package com.yutgame.service;

import com.yutgame.domain.*;
import com.yutgame.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    // roomId -> GameRoom
    private final Map<String, GameRoom> rooms = new ConcurrentHashMap<>();

    /**
     * 방 생성
     */
    public String createRoom(String player1Name) {
        String roomId = UUID.randomUUID().toString().substring(0, 8);
        GameRoom room = new GameRoom(roomId, player1Name);
        rooms.put(roomId, room);
        return roomId;
    }

    /**
     * 방 참가 → 게임 시작
     */
    public GameRoom joinRoom(String roomId, String player2Name) {
        GameRoom room = getRoom(roomId);
        if (room.getStatus() != GameRoom.Status.WAITING) {
            throw new IllegalStateException("이미 시작된 방입니다.");
        }
        room.startGame(player2Name);
        return room;
    }

    /**
     * 대기 중인 방 목록
     */
    public List<RoomResponse> getWaitingRooms() {
        return rooms.values().stream()
                .filter(r -> r.getStatus() == GameRoom.Status.WAITING)
                .map(this::toRoomResponse)
                .toList();
    }

    /**
     * 방 정보 조회
     */
    public RoomResponse getRoomInfo(String roomId) {
        return toRoomResponse(getRoom(roomId));
    }

    /**
     * 윷 던지기
     */
    public GameStateResponse throwYut(String roomId, String playerName) {
        GameRoom room = getRoom(roomId);
        Game game = room.getGame();

        if (game == null) {
            throw new IllegalStateException("게임이 아직 시작되지 않았습니다.");
        }
        if (!game.getCurrentPlayer().getName().equals(playerName)) {
            throw new IllegalStateException("당신의 차례가 아닙니다.");
        }
        if (room.getLastYutResult() != null) {
            throw new IllegalStateException("이미 윷을 던졌습니다. 말을 이동하세요.");
        }

        YutResult result = game.throwYut();
        room.setLastYutResult(result);

        // 윷/모 → 한 번 더
        if (result.hasExtraTurn()) {
            game.setExtraTurn(true);
        }

        GameStateResponse response = buildGameState(room);
        response.setType("THROW_RESULT");
        response.setYutResult(result.name());
        response.setYutResultName(result.getKoreanName());
        response.setYutSteps(result.getSteps());
        response.setMessage(playerName + "님이 윷을 던져 " + result.getKoreanName() + "(" + result.getSteps() + "칸)이 나왔습니다!");
        return response;
    }

    /**
     * 말 이동
     */
    public GameStateResponse movePiece(String roomId, String playerName, int pieceIndex) {
        GameRoom room = getRoom(roomId);
        Game game = room.getGame();

        if (game == null) {
            throw new IllegalStateException("게임이 아직 시작되지 않았습니다.");
        }
        if (!game.getCurrentPlayer().getName().equals(playerName)) {
            throw new IllegalStateException("당신의 차례가 아닙니다.");
        }
        if (room.getLastYutResult() == null) {
            throw new IllegalStateException("먼저 윷을 던져야 합니다.");
        }

        Player currentPlayer = game.getCurrentPlayer();
        Piece piece = currentPlayer.getPieces().get(pieceIndex);
        int steps = room.getLastYutResult().getSteps();

        MoveResult moveResult = game.movePiece(piece, steps);

        // 잡기 성공 → 한 번 더
        if (moveResult.hasExtraTurn()) {
            game.setExtraTurn(true);
        }

        // 윷 결과 소비
        room.setLastYutResult(null);

        // 게임 종료 확인
        if (game.isFinished()) {
            room.setStatus(GameRoom.Status.FINISHED);
            GameStateResponse response = buildGameState(room);
            response.setType("GAME_OVER");
            response.setWinnerName(game.getWinner().getName());
            response.setMessage(game.getWinner().getName() + "님이 승리했습니다!");
            return response;
        }

        // 턴 넘김
        game.nextTurn();

        GameStateResponse response = buildGameState(room);
        response.setType("MOVE_RESULT");
        response.setCaptured(moveResult.isCaptured());
        response.setStacked(moveResult.isStacked());

        StringBuilder msg = new StringBuilder();
        msg.append(playerName).append("님의 말이 이동했습니다.");
        if (moveResult.isCaptured()) {
            msg.append(" 상대 말을 잡았습니다! 한 번 더!");
        }
        if (moveResult.isStacked()) {
            msg.append(" 말을 업었습니다!");
        }
        if (game.getCurrentPlayer().getName().equals(playerName) && !moveResult.isCaptured()) {
            // 윷/모로 인한 한 번 더 (잡기가 아닌 경우)
            msg.append(" 한 번 더!");
        }
        response.setMessage(msg.toString());

        return response;
    }

    /**
     * 현재 게임 상태 조회
     */
    public GameStateResponse getGameState(String roomId) {
        GameRoom room = getRoom(roomId);
        if (room.getGame() == null) {
            GameStateResponse response = new GameStateResponse();
            response.setRoomId(roomId);
            response.setType("WAITING");
            response.setMessage("상대방을 기다리는 중...");
            return response;
        }
        GameStateResponse response = buildGameState(room);
        response.setType("STATE");
        return response;
    }

    // --- 내부 메서드 ---

    private GameRoom getRoom(String roomId) {
        GameRoom room = rooms.get(roomId);
        if (room == null) {
            throw new IllegalArgumentException("존재하지 않는 방입니다: " + roomId);
        }
        return room;
    }

    private GameStateResponse buildGameState(GameRoom room) {
        Game game = room.getGame();
        GameStateResponse resp = new GameStateResponse();
        resp.setRoomId(room.getRoomId());
        resp.setPlayer1(toPlayerDto(game.getPlayer1()));
        resp.setPlayer2(toPlayerDto(game.getPlayer2()));
        resp.setCurrentPlayerName(game.getCurrentPlayer().getName());
        resp.setHasExtraTurn(game.hasExtraTurn());
        resp.setFinished(game.isFinished());
        resp.setTurnCount(game.getTurnCount());
        if (game.getWinner() != null) {
            resp.setWinnerName(game.getWinner().getName());
        }
        return resp;
    }

    private PlayerDto toPlayerDto(Player player) {
        List<PieceDto> pieces = player.getPieces().stream()
                .map(p -> new PieceDto(
                        p.getId(),
                        p.getPosition().getIndex(),
                        p.isFinished(),
                        p.getStackCount()
                ))
                .toList();
        return new PlayerDto(player.getName(), pieces, player.getFinishedPieces().size());
    }

    private RoomResponse toRoomResponse(GameRoom room) {
        return new RoomResponse(
                room.getRoomId(),
                room.getPlayer1Name(),
                room.getPlayer2Name(),
                room.getStatus().name()
        );
    }

    // --- 내부 클래스: GameRoom ---

    public static class GameRoom {
        public enum Status { WAITING, PLAYING, FINISHED }

        private final String roomId;
        private final String player1Name;
        private String player2Name;
        private Game game;
        private Status status;
        private YutResult lastYutResult;

        public GameRoom(String roomId, String player1Name) {
            this.roomId = roomId;
            this.player1Name = player1Name;
            this.status = Status.WAITING;
        }

        public void startGame(String player2Name) {
            this.player2Name = player2Name;
            Player p1 = new Player(player1Name);
            Player p2 = new Player(player2Name);
            this.game = new Game(p1, p2);
            this.status = Status.PLAYING;
        }

        public String getRoomId() { return roomId; }
        public String getPlayer1Name() { return player1Name; }
        public String getPlayer2Name() { return player2Name; }
        public Game getGame() { return game; }
        public Status getStatus() { return status; }
        public void setStatus(Status status) { this.status = status; }
        public YutResult getLastYutResult() { return lastYutResult; }
        public void setLastYutResult(YutResult lastYutResult) { this.lastYutResult = lastYutResult; }
    }
}
