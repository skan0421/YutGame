// 게임 JavaScript — WebSocket 기반 실시간 대전 + 애니메이션

let stompClient = null;
let roomId = null;
let myName = null;
let gameState = null;
let lastYutSteps = 0;
let throwInProgress = false;

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
    stompClient.debug = null;

    stompClient.connect({}, function () {
        stompClient.subscribe('/topic/game/' + roomId, function (message) {
            const data = JSON.parse(message.body);
            handleServerMessage(data);
        });
        stompClient.send('/app/game/' + roomId + '/state', {}, '{}');
    }, function () {
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
            throwInProgress = false;
            const prevStateForThrow = gameState;
            gameState = data;

            // 윷 던지기 애니메이션 실행
            playYutAnimation(data.yutResult, data.yutResultName, data.yutSteps, function () {
                showMessage(data.message);
                if (data.currentPlayerName === myName) {
                    lastYutSteps = data.yutSteps;
                    updateUI();
                    showPieceSelection();
                } else {
                    updateUI();
                }
            });
            break;

        case 'MOVE_RESULT': {
            const oldState = gameState;
            gameState = data;
            lastYutSteps = 0;

            // 이동 애니메이션
            BoardRenderer.animateMove(oldState, data, data.captured, data.stacked, function () {
                showMessage(data.message);
                updateUI();
                hidePieceSelection();
            });
            break;
        }

        case 'GAME_OVER': {
            const oldStateForEnd = gameState;
            gameState = data;
            BoardRenderer.animateMove(oldStateForEnd, data, false, false, function () {
                updateUI();
                showGameOver(data.winnerName, data.message);
            });
            break;
        }

        case 'WAITING':
            showMessage(data.message);
            break;

        case 'ERROR':
            throwInProgress = false;
            showMessage(data.message);
            break;
    }
}

// ===== 윷 던지기 =====
function doThrowYut() {
    if (!stompClient || !gameState) return;
    if (throwInProgress) return;
    if (gameState.currentPlayerName !== myName) {
        showMessage('상대방의 차례입니다!');
        return;
    }

    throwInProgress = true;
    stompClient.send('/app/game/' + roomId + '/throw', {},
        JSON.stringify({ playerName: myName })
    );
}

// ===== 말 이동 =====
function doMovePiece(pieceIndex) {
    if (!stompClient || !gameState) return;

    const myPlayer = gameState.player1.name === myName ? gameState.player1 : gameState.player2;
    if (myPlayer.pieces[pieceIndex].finished) {
        showMessage('이미 도착한 말입니다!');
        return;
    }

    stompClient.send('/app/game/' + roomId + '/move', {},
        JSON.stringify({ playerName: myName, pieceIndex: pieceIndex })
    );
}

// ===== 윷 던지기 애니메이션 =====
function playYutAnimation(result, resultName, steps, callback) {
    const overlay = document.getElementById('yut-throw-overlay');
    const sticks = document.querySelectorAll('.yut-stick');
    const resultText = document.getElementById('throw-result-text');

    // 결과에 따라 스틱 상태 결정 (flat = 앞면, round = 뒷면)
    // 도:1flat, 개:2flat, 걸:3flat, 윷:4flat, 모:0flat(all round), 빽도:1flat
    let flatCount = 0;
    switch (result) {
        case 'BACK_DO': flatCount = 1; break;
        case 'DO': flatCount = 1; break;
        case 'GAE': flatCount = 2; break;
        case 'GEOL': flatCount = 3; break;
        case 'YUT': flatCount = 4; break;
        case 'MO': flatCount = 0; break;
    }

    // 스틱 초기화 - 모두 회전 애니메이션 시작
    sticks.forEach((stick, i) => {
        stick.className = 'yut-stick spinning';
        stick.style.animationDelay = (i * 0.05) + 's';
    });

    overlay.style.display = 'flex';
    resultText.textContent = '';

    // 0.8초 후: 결과 표시
    setTimeout(function () {
        sticks.forEach((stick, i) => {
            stick.classList.remove('spinning');
            if (i < flatCount) {
                stick.classList.add('flat');
            } else {
                stick.classList.add('round');
            }
        });

        resultText.textContent = resultName + ' (' + steps + '칸)';
        resultText.style.animation = 'none';
        resultText.offsetHeight;
        resultText.style.animation = '';
    }, 800);

    // 1.8초 후: 오버레이 닫기 + 콜백
    setTimeout(function () {
        overlay.style.display = 'none';
        sticks.forEach(s => s.className = 'yut-stick');
        if (callback) callback();
    }, 1800);
}

// ===== UI 업데이트 =====
function updateUI() {
    if (!gameState || !gameState.player1) return;

    const p1 = gameState.player1;
    const p2 = gameState.player2;

    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p1-score').textContent = '도착: ' + p1.finishedCount + '/4';
    document.getElementById('p2-name').textContent = p2.name;
    document.getElementById('p2-score').textContent = '도착: ' + p2.finishedCount + '/4';

    document.getElementById('turn-display').textContent = '턴 ' + gameState.turnCount;
    document.getElementById('current-turn-name').textContent = gameState.currentPlayerName + '님 차례';

    const p1Info = document.getElementById('player1-info');
    const p2Info = document.getElementById('player2-info');
    p1Info.classList.toggle('active', gameState.currentPlayerName === p1.name);
    p2Info.classList.toggle('active', gameState.currentPlayerName === p2.name);

    // 버튼 활성화
    const throwBtn = document.getElementById('throw-btn');
    const isMyTurn = gameState.currentPlayerName === myName;
    throwBtn.disabled = !isMyTurn || lastYutSteps !== 0 || throwInProgress;

    // 윷판 그리기
    BoardRenderer.draw(gameState);
}

function showMessage(msg) {
    document.getElementById('game-message').textContent = msg;
}

function showPieceSelection() {
    const area = document.getElementById('piece-area');
    const btns = document.getElementById('piece-buttons');
    area.style.display = 'block';
    document.getElementById('throw-area').style.display = 'none';

    const myPlayer = gameState.player1.name === myName ? gameState.player1 : gameState.player2;

    btns.innerHTML = myPlayer.pieces.map(function (piece, idx) {
        const disabled = piece.finished ? 'disabled' : '';
        let label = '말' + (idx + 1);
        if (piece.finished) {
            label += ' (완주)';
        } else if (piece.position === 0) {
            label += ' (대기)';
        } else {
            label += ' (위치' + piece.position + ')';
        }
        if (piece.stackCount > 1) {
            label += ' x' + piece.stackCount;
        }
        return '<button class="piece-btn" onclick="doMovePiece(' + idx + ')" ' + disabled + '>' + label + '</button>';
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
