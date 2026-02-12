// 로비 JavaScript
let playerName = '';
let currentRoomId = null;
let pollInterval = null;

function confirmName() {
    const input = document.getElementById('player-name');
    const name = input.value.trim();
    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }
    playerName = name;
    document.getElementById('display-name').textContent = name;
    document.getElementById('name-section').style.display = 'none';
    document.getElementById('lobby-section').style.display = 'block';
    loadRooms();
}

// Enter 키로 이름 확인
document.getElementById('player-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') confirmName();
});

async function loadRooms() {
    try {
        const res = await fetch('/api/rooms');
        const rooms = await res.json();
        const list = document.getElementById('room-list');

        if (rooms.length === 0) {
            list.innerHTML = '<p class="empty-msg">대기 중인 방이 없습니다.</p>';
            return;
        }

        list.innerHTML = rooms.map(room => `
            <div class="room-item">
                <span>${room.player1Name}님의 방</span>
                <button onclick="joinRoom('${room.roomId}')">참가</button>
            </div>
        `).join('');
    } catch (e) {
        console.error('방 목록 로딩 실패:', e);
    }
}

async function createRoom() {
    if (!playerName) return;

    try {
        const res = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: playerName })
        });
        const data = await res.json();
        currentRoomId = data.roomId;

        // 대기 화면으로 전환
        document.getElementById('lobby-section').style.display = 'none';
        document.getElementById('waiting-section').style.display = 'block';
        document.getElementById('waiting-room-id').textContent = currentRoomId;

        // 상대방 참가 대기 (폴링)
        pollInterval = setInterval(checkRoomStatus, 2000);
    } catch (e) {
        console.error('방 생성 실패:', e);
        alert('방 생성에 실패했습니다.');
    }
}

async function joinRoom(roomId) {
    if (!playerName) return;

    try {
        const res = await fetch(`/api/rooms/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: playerName })
        });

        if (res.ok) {
            // 게임 화면으로 이동
            window.location.href = `/game.html?roomId=${roomId}&player=${encodeURIComponent(playerName)}`;
        } else {
            alert('방 참가에 실패했습니다.');
        }
    } catch (e) {
        console.error('방 참가 실패:', e);
        alert('방 참가에 실패했습니다.');
    }
}

async function checkRoomStatus() {
    if (!currentRoomId) return;

    try {
        const res = await fetch(`/api/rooms/${currentRoomId}`);
        const room = await res.json();

        if (room.status === 'PLAYING') {
            clearInterval(pollInterval);
            window.location.href = `/game.html?roomId=${currentRoomId}&player=${encodeURIComponent(playerName)}`;
        }
    } catch (e) {
        console.error('방 상태 확인 실패:', e);
    }
}
