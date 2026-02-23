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
    BoardRenderer.init('board-mount');
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

// ===== 3D 윷 던지기 애니메이션 =====
let yutThrowScene = null;
let yutThrowRenderer = null;
let yutThrowCamera = null;
let yutThrowSticks = [];
let yutThrowGround = null;

function initYutThrow3D() {
    if (yutThrowScene) return; // 이미 초기화됨

    const canvas = document.getElementById('yut-throw-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.04);
    yutThrowScene = scene;

    // 카메라 - 약간 위에서 내려다보는 시점
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / (window.innerHeight * 0.7), 0.1, 100);
    camera.position.set(0, 6, 5);
    camera.lookAt(0, 0, 0);
    yutThrowCamera = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    yutThrowRenderer = renderer;

    // 조명
    scene.add(new THREE.AmbientLight(0x6688aa, 0.5));

    const spotLight = new THREE.SpotLight(0xfff5e0, 1.5);
    spotLight.position.set(0, 10, 3);
    spotLight.angle = 0.5;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(1024, 1024);
    scene.add(spotLight);

    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    const warmLight = new THREE.PointLight(0xff8844, 0.4, 15);
    warmLight.position.set(3, 4, 2);
    scene.add(warmLight);

    // 바닥 - 나무 질감 느낌의 매트
    const groundGeo = new THREE.CylinderGeometry(4, 4, 0.15, 32);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x3d2b1f,
        roughness: 0.8,
        metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);
    yutThrowGround = ground;

    // 바닥 테두리 링
    const ringGeo = new THREE.TorusGeometry(4, 0.08, 8, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.4, metalness: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.0;
    scene.add(ring);

    // 윷 4개 생성
    yutThrowSticks = [];
    for (let i = 0; i < 4; i++) {
        const stick = createYutStick3D();
        stick.position.set((i - 1.5) * 1.0, 5, 0);
        scene.add(stick);
        yutThrowSticks.push(stick);
    }
}

function createYutStick3D() {
    const group = new THREE.Group();

    // 윷 본체 - 반원 단면의 길쭉한 나무 막대
    const stickLength = 2.2;
    const stickRadius = 0.18;

    // 앞면 (평평한 면) - 밝은 나무색
    const flatGeo = new THREE.BoxGeometry(stickRadius * 2, stickLength, stickRadius);
    const flatMat = new THREE.MeshStandardMaterial({
        color: 0xf5e2b0,
        roughness: 0.6,
        metalness: 0.05,
    });
    const flatMesh = new THREE.Mesh(flatGeo, flatMat);
    flatMesh.position.z = stickRadius * 0.25;
    flatMesh.castShadow = true;
    group.add(flatMesh);

    // 뒷면 (둥근 면) - 어두운 나무색
    const roundGeo = new THREE.CylinderGeometry(stickRadius, stickRadius, stickLength, 12, 1, false, 0, Math.PI);
    const roundMat = new THREE.MeshStandardMaterial({
        color: 0x8B6914,
        roughness: 0.5,
        metalness: 0.1,
    });
    const roundMesh = new THREE.Mesh(roundGeo, roundMat);
    roundMesh.rotation.x = Math.PI / 2;
    roundMesh.rotation.z = Math.PI;
    roundMesh.position.z = -stickRadius * 0.25;
    roundMesh.castShadow = true;
    group.add(roundMesh);

    // X 표시 (앞면 장식)
    const xMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.01), xMat);
    bar1.rotation.z = Math.PI / 4;
    bar1.position.set(0, 0, stickRadius * 0.5 + 0.01);
    group.add(bar1);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.01), xMat);
    bar2.rotation.z = -Math.PI / 4;
    bar2.position.set(0, 0, stickRadius * 0.5 + 0.01);
    group.add(bar2);

    // 양 끝 라운딩
    const capGeo = new THREE.SphereGeometry(stickRadius, 10, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xd4b876, roughness: 0.6 });
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = stickLength / 2;
    topCap.scale.set(1, 0.4, 1);
    group.add(topCap);
    const bottomCap = new THREE.Mesh(capGeo, capMat);
    bottomCap.position.y = -stickLength / 2;
    bottomCap.scale.set(1, 0.4, 1);
    group.add(bottomCap);

    // 막대를 눕히기 (x축으로 90도)
    group.rotation.x = Math.PI / 2;

    // 물리 상태 저장
    group.userData = {
        velY: 0,
        velRotX: 0,
        velRotZ: 0,
        rotX: 0,
        rotZ: 0,
        settled: false,
        targetFlat: false, // true면 앞면(flat), false면 뒷면(round)
    };

    return group;
}

function playYutAnimation(result, resultName, steps, callback) {
    const overlay = document.getElementById('yut-throw-overlay');
    const resultText = document.getElementById('throw-result-text');

    // 3D 씬 초기화
    initYutThrow3D();

    // 결과에 따라 flat/round 결정
    let flatCount = 0;
    switch (result) {
        case 'BACK_DO': flatCount = 1; break;
        case 'DO': flatCount = 1; break;
        case 'GAE': flatCount = 2; break;
        case 'GEOL': flatCount = 3; break;
        case 'YUT': flatCount = 4; break;
        case 'MO': flatCount = 0; break;
    }

    // 렌더러 리사이즈
    yutThrowRenderer.setSize(window.innerWidth, window.innerHeight * 0.7);
    yutThrowCamera.aspect = window.innerWidth / (window.innerHeight * 0.7);
    yutThrowCamera.updateProjectionMatrix();

    // 윷 초기 상태 - 하늘에서 던지기
    yutThrowSticks.forEach((stick, i) => {
        stick.position.set((i - 1.5) * 1.0 + (Math.random() - 0.5) * 0.3, 5 + Math.random() * 2, (Math.random() - 0.5) * 0.5);
        const ud = stick.userData;
        ud.velY = -(3 + Math.random() * 2);
        ud.velRotX = (Math.random() - 0.5) * 15;
        ud.velRotZ = (Math.random() - 0.5) * 10;
        ud.rotX = Math.random() * Math.PI * 2;
        ud.rotZ = Math.random() * Math.PI * 2;
        ud.settled = false;
        ud.targetFlat = (i < flatCount);
        ud.bounceCount = 0;
    });

    overlay.style.display = 'flex';
    resultText.textContent = '';

    const gravity = 15;
    const groundY = 0.25;
    const startTime = Date.now();
    let allSettled = false;
    let settledTime = null;

    function animateThrow() {
        const now = Date.now();
        const dt = Math.min(0.033, 0.016);

        let settledCount = 0;

        yutThrowSticks.forEach((stick, i) => {
            const ud = stick.userData;
            if (ud.settled) {
                settledCount++;
                return;
            }

            // 중력 적용
            ud.velY += gravity * dt;
            stick.position.y -= ud.velY * dt;

            // 회전
            ud.rotX += ud.velRotX * dt;
            ud.rotZ += ud.velRotZ * dt;

            // 내부 그룹 회전 (stick의 원래 rotation.x는 PI/2로 눕혀놓은 상태)
            stick.rotation.x = Math.PI / 2 + ud.rotX;
            stick.rotation.z = ud.rotZ;

            // 바닥 충돌
            if (stick.position.y <= groundY) {
                stick.position.y = groundY;
                ud.bounceCount++;

                if (ud.bounceCount >= 3) {
                    // 최종 정착
                    ud.settled = true;
                    stick.position.y = groundY;

                    // 결과에 맞게 정렬 - flat면 앞면이 위로, round면 뒷면이 위로
                    if (ud.targetFlat) {
                        stick.rotation.x = Math.PI / 2;
                        stick.rotation.z = (Math.random() - 0.5) * 0.3;
                    } else {
                        stick.rotation.x = -Math.PI / 2;
                        stick.rotation.z = (Math.random() - 0.5) * 0.3;
                    }
                } else {
                    // 바운스
                    ud.velY = -(ud.velY * (0.3 + Math.random() * 0.15));
                    ud.velRotX *= 0.5;
                    ud.velRotZ *= 0.5;
                }
            }
        });

        yutThrowRenderer.render(yutThrowScene, yutThrowCamera);

        if (settledCount >= 4) {
            if (!allSettled) {
                allSettled = true;
                settledTime = now;
                // 결과 텍스트 표시
                resultText.textContent = resultName + ' (' + steps + '칸)';
                resultText.style.animation = 'none';
                resultText.offsetHeight;
                resultText.style.animation = '';
            }
            if (now - settledTime > 1000) {
                // 종료
                overlay.style.display = 'none';
                if (callback) callback();
                return;
            }
            yutThrowRenderer.render(yutThrowScene, yutThrowCamera);
        }

        // 안전장치: 3초 경과 시 강제 종료
        if (now - startTime > 3000 && !allSettled) {
            yutThrowSticks.forEach((stick, i) => {
                const ud = stick.userData;
                ud.settled = true;
                stick.position.y = groundY;
                if (ud.targetFlat) {
                    stick.rotation.x = Math.PI / 2;
                } else {
                    stick.rotation.x = -Math.PI / 2;
                }
                stick.rotation.z = (Math.random() - 0.5) * 0.3;
            });
            resultText.textContent = resultName + ' (' + steps + '칸)';
            resultText.style.animation = 'none';
            resultText.offsetHeight;
            resultText.style.animation = '';

            setTimeout(function () {
                overlay.style.display = 'none';
                if (callback) callback();
            }, 800);
            return;
        }

        requestAnimationFrame(animateThrow);
    }

    requestAnimationFrame(animateThrow);
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

    document.getElementById('turn-display').textContent = 'TURN ' + gameState.turnCount;
    document.getElementById('current-turn-name').textContent = gameState.currentPlayerName + '님 차례';

    const p1Info = document.getElementById('player1-info');
    const p2Info = document.getElementById('player2-info');
    p1Info.classList.toggle('active', gameState.currentPlayerName === p1.name);
    p2Info.classList.toggle('active', gameState.currentPlayerName === p2.name);

    // 버튼 활성화 + 펄스 애니메이션
    const throwBtn = document.getElementById('throw-btn');
    const isMyTurn = gameState.currentPlayerName === myName;
    throwBtn.disabled = !isMyTurn || lastYutSteps !== 0 || throwInProgress;
    throwBtn.classList.toggle('my-turn-pulse', isMyTurn && lastYutSteps === 0 && !throwInProgress);

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
