// 게임 JavaScript — WebSocket 기반 실시간 대전

let stompClient = null;
let roomId = null;
let myName = null;
let gameState = null;
let lastYutSteps = 0;

// URL 파라미터에서 roomId, player 추출
const params = new URLSearchParams(window.location.search);
roomId = params.get('roomId');
myName = decodeURIComponent(params.get('player') || '');

if (!roomId || !myName) {
    alert('잘못된 접근입니다.');
    location.href = '/';
}

// 초기화
window.onload = function () {
    BoardRenderer.init('yut-board');
    BoardRenderer.draw(null);
    connect();
};

// WebSocket 연결
function connect() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // 디버그 로그 끄기

    stompClient.connect({}, function () {
        // 구독: 게임 상태 수신
        stompClient.subscribe('/topic/game/' + roomId, function (message) {
            const data = JSON.parse(message.body);
            handleServerMessage(data);
        });

        // 초기 상태 요청
        stompClient.send('/app/game/' + roomId + '/state', {}, '{}');
    }, function (error) {
        console.error('WebSocket 연결 실패:', error);
        document.getElementById('game-message').textContent = '서버 연결에 실패했습니다. 새로고침 해주세요.';
    });
}

// 서버 메시지 처리
function handleServerMessage(data) {
    switch (data.type) {
        case 'STATE':
            gameState = data;
            updateUI();
            break;

        case 'THROW_RESULT':
            gameState = data;
            showYutResult(data.yutResultName, data.yutSteps);
            showMessage(data.message);

            // 내 차례일 때만 lastYutSteps 업데이트 + 말 선택 UI 표시
            if (data.currentPlayerName === myName) {
                lastYutSteps = data.yutSteps;
                updateUI();
                showPieceSelection();
            } else {
                updateUI();
            }
            break;

        case 'MOVE_RESULT':
            gameState = data;
            lastYutSteps = 0;
            showMessage(data.message);
            updateUI();
            hidePieceSelection();
            break;

        case 'GAME_OVER':
            gameState = data;
            updateUI();
            showGameOver(data.winnerName, data.message);
            break;

        case 'WAITING':
            showMessage(data.message);
            break;

        case 'ERROR':
            showMessage(data.message);
            break;
    }
}

// 윷 던지기
function doThrowYut() {
    if (!stompClient || !gameState) return;
    if (gameState.currentPlayerName !== myName) {
        showMessage('상대방의 차례입니다!');
        return;
    }

    stompClient.send('/app/game/' + roomId + '/throw', {},
        JSON.stringify({ playerName: myName })
    );
}

// 말 이동
function doMovePiece(pieceIndex) {
    if (!stompClient || !gameState) return;

    // 이미 도착한 말은 이동 불가
    const myPlayer = gameState.player1.name === myName ? gameState.player1 : gameState.player2;
    if (myPlayer.pieces[pieceIndex].finished) {
        showMessage('이미 도착한 말입니다!');
        return;
    }

    stompClient.send('/app/game/' + roomId + '/move', {},
        JSON.stringify({ playerName: myName, pieceIndex: pieceIndex })
    );
}

// === UI 업데이트 ===

function updateUI() {
    if (!gameState || !gameState.player1) return;

    const p1 = gameState.player1;
    const p2 = gameState.player2;

    // 플레이어 정보
    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p1-score').textContent = '도착: ' + p1.finishedCount + '/4';
    document.getElementById('p2-name').textContent = p2.name;
    document.getElementById('p2-score').textContent = '도착: ' + p2.finishedCount + '/4';

    // 현재 턴 표시
    document.getElementById('turn-display').textContent = '턴 ' + gameState.turnCount;
    document.getElementById('current-turn-name').textContent = gameState.currentPlayerName + '님 차례';

    // 활성 플레이어 강조
    const p1Info = document.getElementById('player1-info');
    const p2Info = document.getElementById('player2-info');
    p1Info.classList.toggle('active', gameState.currentPlayerName === p1.name);
    p2Info.classList.toggle('active', gameState.currentPlayerName === p2.name);

    // 버튼 활성화
    const throwBtn = document.getElementById('throw-btn');
    const isMyTurn = gameState.currentPlayerName === myName;
    throwBtn.disabled = !isMyTurn || lastYutSteps !== 0;

    // 윷판 그리기
    BoardRenderer.draw(gameState);
}

function showMessage(msg) {
    document.getElementById('game-message').textContent = msg;
}

function showYutResult(name, steps) {
    const el = document.getElementById('yut-result-display');
    const text = document.getElementById('yut-result-text');
    text.textContent = name + ' (' + steps + '칸)';
    el.style.display = 'block';
    // 애니메이션 재시작
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';

    setTimeout(() => { el.style.display = 'none'; }, 2000);
}

function showPieceSelection() {
    const area = document.getElementById('piece-area');
    const btns = document.getElementById('piece-buttons');
    area.style.display = 'block';
    document.getElementById('throw-area').style.display = 'none';

    // 내 말 정보 가져오기
    const myPlayer = gameState.player1.name === myName ? gameState.player1 : gameState.player2;

    btns.innerHTML = myPlayer.pieces.map((piece, idx) => {
        const disabled = piece.finished ? 'disabled' : '';
        let label = '말' + (idx + 1);
        if (piece.finished) {
            label += ' (도착)';
        } else if (piece.position === 0) {
            label += ' (시작)';
        } else {
            label += ' (위치' + piece.position + ')';
        }
        if (piece.stackCount > 1) {
            label += ' x' + piece.stackCount;
        }
        return `<button class="piece-btn" onclick="doMovePiece(${idx})" ${disabled}>${label}</button>`;
    }).join('');
}

function hidePieceSelection() {
    document.getElementById('piece-area').style.display = 'none';
    document.getElementById('throw-area').style.display = 'block';
}

function showGameOver(winnerName, message) {
    const modal = document.getElementById('game-over-modal');
    document.getElementById('winner-text').textContent = winnerName + ' 승리!';
    document.getElementById('winner-message').textContent = message;
    modal.style.display = 'flex';
}
