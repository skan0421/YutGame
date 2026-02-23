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

// ===== 3D 윷 던지기 애니메이션 (대폭 개선) =====
let yutThrowScene = null;
let yutThrowRenderer = null;
let yutThrowCamera = null;
let yutThrowSticks = [];
let yutThrowGround = null;
let yutThrowParticles = [];
let yutThrowLights = {};

function initYutThrow3D() {
    if (yutThrowScene) return;

    const canvas = document.getElementById('yut-throw-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    yutThrowScene = scene;

    // 카메라
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / (window.innerHeight * 0.7), 0.1, 100);
    camera.position.set(0, 8, 6);
    camera.lookAt(0, 0, 0);
    yutThrowCamera = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    yutThrowRenderer = renderer;

    // 조명 - 드라마틱한 설정
    scene.add(new THREE.AmbientLight(0x334466, 0.3));

    const mainSpot = new THREE.SpotLight(0xffeedd, 2.0);
    mainSpot.position.set(0, 12, 2);
    mainSpot.angle = 0.4;
    mainSpot.penumbra = 0.7;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.set(1024, 1024);
    scene.add(mainSpot);
    yutThrowLights.mainSpot = mainSpot;

    // 임팩트 라이트 (착지 시 폭발 효과)
    const impactLight = new THREE.PointLight(0xff6600, 0, 10);
    impactLight.position.set(0, 1, 0);
    scene.add(impactLight);
    yutThrowLights.impact = impactLight;

    // 측면 컬러 라이트
    const blueLight = new THREE.PointLight(0x4488ff, 0.5, 15);
    blueLight.position.set(-5, 3, -3);
    scene.add(blueLight);

    const warmLight = new THREE.PointLight(0xff6644, 0.4, 15);
    warmLight.position.set(5, 3, 2);
    scene.add(warmLight);

    // 바닥 - 나무 매트 (사각형)
    const groundGeo = new THREE.BoxGeometry(8, 0.2, 6);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x5a3d2b,
        roughness: 0.75,
        metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    yutThrowGround = ground;

    // 바닥 프레임
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.4, metalness: 0.2 });
    [
        { sx: 8.3, sy: 0.25, sz: 0.15, px: 0, pz: 3.07 },
        { sx: 8.3, sy: 0.25, sz: 0.15, px: 0, pz: -3.07 },
        { sx: 0.15, sy: 0.25, sz: 6.3, px: 4.15, pz: 0 },
        { sx: 0.15, sy: 0.25, sz: 6.3, px: -4.15, pz: 0 },
    ].forEach(f => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(f.sx, f.sy, f.sz), frameMat);
        frame.position.set(f.px, -0.02, f.pz);
        scene.add(frame);
    });

    // 윷 4개 생성
    yutThrowSticks = [];
    for (let i = 0; i < 4; i++) {
        const stick = createYutStick3D();
        stick.position.set((i - 1.5) * 1.2, 8, 0);
        scene.add(stick);
        yutThrowSticks.push(stick);
    }

    // 임팩트 파티클 풀
    yutThrowParticles = [];
}

function createYutStick3D() {
    const group = new THREE.Group();

    const stickLength = 2.4;
    const stickRadius = 0.2;

    // 앞면 (평평한 면) - 밝은 나무색
    const flatGeo = new THREE.BoxGeometry(stickRadius * 2, stickLength, stickRadius);
    const flatMat = new THREE.MeshStandardMaterial({
        color: 0xf5deb3,
        roughness: 0.5,
        metalness: 0.05,
    });
    const flatMesh = new THREE.Mesh(flatGeo, flatMat);
    flatMesh.position.z = stickRadius * 0.25;
    flatMesh.castShadow = true;
    group.add(flatMesh);

    // 뒷면 (둥근 면) - 어두운 나무색
    const roundGeo = new THREE.CylinderGeometry(stickRadius, stickRadius, stickLength, 12, 1, false, 0, Math.PI);
    const roundMat = new THREE.MeshStandardMaterial({
        color: 0x6b4226,
        roughness: 0.45,
        metalness: 0.1,
    });
    const roundMesh = new THREE.Mesh(roundGeo, roundMat);
    roundMesh.rotation.x = Math.PI / 2;
    roundMesh.rotation.z = Math.PI;
    roundMesh.position.z = -stickRadius * 0.25;
    roundMesh.castShadow = true;
    group.add(roundMesh);

    // X 표시 (앞면 장식)
    const xMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.012), xMat);
    bar1.rotation.z = Math.PI / 4;
    bar1.position.set(0, 0, stickRadius * 0.5 + 0.01);
    group.add(bar1);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.012), xMat);
    bar2.rotation.z = -Math.PI / 4;
    bar2.position.set(0, 0, stickRadius * 0.5 + 0.01);
    group.add(bar2);

    // 양 끝 라운딩
    const capGeo = new THREE.SphereGeometry(stickRadius, 10, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xc8a96a, roughness: 0.5 });
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = stickLength / 2;
    topCap.scale.set(1, 0.4, 1);
    group.add(topCap);
    const bottomCap = new THREE.Mesh(capGeo, capMat);
    bottomCap.position.y = -stickLength / 2;
    bottomCap.scale.set(1, 0.4, 1);
    group.add(bottomCap);

    group.rotation.x = Math.PI / 2;

    group.userData = {
        velY: 0,
        velX: 0,
        velZ: 0,
        velRotX: 0,
        velRotZ: 0,
        rotX: 0,
        rotZ: 0,
        settled: false,
        targetFlat: false,
        bounceCount: 0,
        lastBounceTime: 0,
    };

    return group;
}

// 임팩트 링 이펙트 생성
function createImpactRing(scene, x, z) {
    const ringGeo = new THREE.RingGeometry(0.1, 0.15, 24);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    scene.add(ring);
    return { mesh: ring, mat: ringMat, startTime: Date.now(), duration: 500 };
}

// 나무 파편 파티클 생성
function createWoodSplash(scene, x, z) {
    const particles = [];
    for (let i = 0; i < 12; i++) {
        const size = 0.03 + Math.random() * 0.05;
        const geo = new THREE.BoxGeometry(size, size * 0.5, size);
        const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.5, 0.4 + Math.random() * 0.3),
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(x, 0.2, z);
        p.userData = {
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            vz: (Math.random() - 0.5) * 4,
            rotSpeed: (Math.random() - 0.5) * 15,
        };
        scene.add(p);
        particles.push(p);
    }
    return { particles, startTime: Date.now(), duration: 800 };
}

function playYutAnimation(result, resultName, steps, callback) {
    const overlay = document.getElementById('yut-throw-overlay');
    const resultText = document.getElementById('throw-result-text');

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

    // 카메라 초기 위치 (높은 곳에서 시작)
    yutThrowCamera.position.set(0, 12, 8);
    yutThrowCamera.lookAt(0, 2, 0);

    // 임팩트 라이트 리셋
    yutThrowLights.impact.intensity = 0;

    // 윷 초기 상태 - 높이 던지기 + 회전 강하게
    const shuffled = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const flatIndices = new Set(shuffled.slice(0, flatCount));

    yutThrowSticks.forEach((stick, i) => {
        stick.position.set(
            (i - 1.5) * 1.2 + (Math.random() - 0.5) * 0.4,
            8 + Math.random() * 3,
            (Math.random() - 0.5) * 0.8
        );
        stick.visible = true;
        const ud = stick.userData;
        ud.velY = -(5 + Math.random() * 3);
        ud.velX = (Math.random() - 0.5) * 2;
        ud.velZ = (Math.random() - 0.5) * 1.5;
        ud.velRotX = (Math.random() - 0.5) * 20;
        ud.velRotZ = (Math.random() - 0.5) * 15;
        ud.rotX = Math.random() * Math.PI * 2;
        ud.rotZ = Math.random() * Math.PI * 2;
        ud.settled = false;
        ud.targetFlat = flatIndices.has(i);
        ud.bounceCount = 0;
        ud.lastBounceTime = 0;
    });

    overlay.style.display = 'flex';
    resultText.textContent = '';
    resultText.style.opacity = '0';

    const gravity = 18;
    const groundY = 0.3;
    const startTime = Date.now();
    let allSettled = false;
    let settledTime = null;
    const impactRings = [];
    const woodSplashes = [];
    let cameraShake = 0;
    let firstLandTime = null;

    function animateThrow() {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const dt = 0.016;

        let settledCount = 0;

        // 카메라 줌인 (높은 곳 → 가까이)
        const camProgress = Math.min(1, elapsed / 1.2);
        const camEase = 1 - Math.pow(1 - camProgress, 3);
        const camY = 12 - camEase * 4;
        const camZ = 8 - camEase * 2;
        yutThrowCamera.position.set(
            Math.sin(elapsed * 0.5) * 0.3 + (Math.random() - 0.5) * cameraShake,
            camY + (Math.random() - 0.5) * cameraShake,
            camZ + (Math.random() - 0.5) * cameraShake
        );
        yutThrowCamera.lookAt(0, camEase * 0.5, 0);

        // 카메라 셰이크 감쇠
        cameraShake *= 0.92;

        yutThrowSticks.forEach((stick, i) => {
            const ud = stick.userData;
            if (ud.settled) {
                settledCount++;
                return;
            }

            // 중력
            ud.velY += gravity * dt;
            stick.position.y -= ud.velY * dt;
            stick.position.x += ud.velX * dt;
            stick.position.z += ud.velZ * dt;

            // 회전
            ud.rotX += ud.velRotX * dt;
            ud.rotZ += ud.velRotZ * dt;
            stick.rotation.x = Math.PI / 2 + ud.rotX;
            stick.rotation.z = ud.rotZ;

            // 바닥 충돌
            if (stick.position.y <= groundY) {
                stick.position.y = groundY;
                ud.bounceCount++;

                if (!firstLandTime) firstLandTime = now;

                // 카메라 셰이크 (바운스할 때마다)
                cameraShake = Math.max(cameraShake, 0.15 / ud.bounceCount);

                // 임팩트 라이트
                yutThrowLights.impact.intensity = 3 / ud.bounceCount;
                yutThrowLights.impact.position.set(stick.position.x, 0.5, stick.position.z);

                // 임팩트 링 이펙트
                if (ud.bounceCount <= 2) {
                    impactRings.push(createImpactRing(yutThrowScene, stick.position.x, stick.position.z));
                }
                // 나무 파편 (첫 바운스)
                if (ud.bounceCount === 1) {
                    woodSplashes.push(createWoodSplash(yutThrowScene, stick.position.x, stick.position.z));
                }

                if (ud.bounceCount >= 3) {
                    ud.settled = true;
                    stick.position.y = groundY;
                    // 결과에 맞게 정렬
                    if (ud.targetFlat) {
                        stick.rotation.x = Math.PI / 2;
                        stick.rotation.z = (Math.random() - 0.5) * 0.4;
                    } else {
                        stick.rotation.x = -Math.PI / 2;
                        stick.rotation.z = (Math.random() - 0.5) * 0.4;
                    }
                    // 산포 위치 (겹치지 않게)
                    stick.position.x += (Math.random() - 0.5) * 0.3;
                    stick.position.z += (Math.random() - 0.5) * 0.2;
                } else {
                    ud.velY = -(ud.velY * (0.25 + Math.random() * 0.15));
                    ud.velX *= 0.6;
                    ud.velZ *= 0.6;
                    ud.velRotX *= 0.4;
                    ud.velRotZ *= 0.4;
                }
            }

            // 경계 제한 (매트 밖으로 안 나가게)
            stick.position.x = Math.max(-3.5, Math.min(3.5, stick.position.x));
            stick.position.z = Math.max(-2.5, Math.min(2.5, stick.position.z));
        });

        // 임팩트 라이트 감쇠
        yutThrowLights.impact.intensity *= 0.9;

        // 임팩트 링 업데이트
        impactRings.forEach(ring => {
            const age = (now - ring.startTime) / ring.duration;
            if (age >= 1) {
                yutThrowScene.remove(ring.mesh);
                return;
            }
            const scale = 1 + age * 8;
            ring.mesh.scale.set(scale, scale, 1);
            ring.mat.opacity = 0.8 * (1 - age);
        });

        // 나무 파편 업데이트
        woodSplashes.forEach(splash => {
            const age = (now - splash.startTime) / splash.duration;
            if (age >= 1) {
                splash.particles.forEach(p => yutThrowScene.remove(p));
                return;
            }
            splash.particles.forEach(p => {
                const ud = p.userData;
                p.position.x += ud.vx * dt;
                p.position.y += ud.vy * dt;
                p.position.z += ud.vz * dt;
                ud.vy -= 12 * dt;
                p.rotation.x += ud.rotSpeed * dt;
                p.rotation.z += ud.rotSpeed * 0.7 * dt;
                if (p.position.y < 0) p.position.y = 0;
            });
        });

        yutThrowRenderer.render(yutThrowScene, yutThrowCamera);

        if (settledCount >= 4) {
            if (!allSettled) {
                allSettled = true;
                settledTime = now;

                // 결과 텍스트 드라마틱 표시
                resultText.textContent = resultName;
                resultText.style.opacity = '1';
                resultText.style.animation = 'none';
                resultText.offsetHeight;
                resultText.style.animation = 'resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

                // 특수 결과(윷/모) 시 추가 임팩트
                if (result === 'YUT' || result === 'MO') {
                    cameraShake = 0.3;
                    yutThrowLights.impact.intensity = 5;
                    yutThrowLights.impact.color.set(result === 'YUT' ? 0xFFD700 : 0x4488ff);
                }
            }

            // 결과 표시 후 카메라 서서히 줌인
            const resultAge = (now - settledTime) / 1000;
            yutThrowCamera.position.y = 8 - resultAge * 1.5;
            yutThrowCamera.position.z = 6 - resultAge * 0.8;
            yutThrowCamera.lookAt(0, 0.3, 0);

            if (resultAge > 1.5) {
                // 정리 후 종료
                impactRings.forEach(r => yutThrowScene.remove(r.mesh));
                woodSplashes.forEach(s => s.particles.forEach(p => yutThrowScene.remove(p)));
                overlay.style.display = 'none';
                if (callback) callback();
                return;
            }
            requestAnimationFrame(animateThrow);
            return;
        }

        // 안전장치: 4초 경과 시 강제 종료
        if (elapsed > 4 && !allSettled) {
            yutThrowSticks.forEach((stick) => {
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
            resultText.textContent = resultName;
            resultText.style.opacity = '1';
            resultText.style.animation = 'none';
            resultText.offsetHeight;
            resultText.style.animation = 'resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

            setTimeout(function () {
                impactRings.forEach(r => yutThrowScene.remove(r.mesh));
                woodSplashes.forEach(s => s.particles.forEach(p => yutThrowScene.remove(p)));
                overlay.style.display = 'none';
                if (callback) callback();
            }, 1000);
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
