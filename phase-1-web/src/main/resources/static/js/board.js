// 윷판 렌더링 (Canvas) + 애니메이션
const BoardRenderer = {
    canvas: null,
    ctx: null,
    positions: [],  // index → {x, y}

    // --- 경로 맵 (백엔드와 동일) ---
    OUTER_NEXT: {},
    SHORTCUT_NEXT: {},
    BACKWARD: {},
    CORNERS: new Set([5, 10, 15]),
    SHORTCUT_POS: new Set([20, 21, 22, 23, 24, 25, 26, 27, 28]),
    FINISH: 29,

    // --- 애니메이션 상태 ---
    animQueue: [],      // 이동 애니메이션 큐
    effects: [],        // 시각 효과 (잡기, 업기)
    animating: false,
    onAnimDone: null,
    lastGameState: null,

    // ===== 초기화 =====
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.initPathMaps();
        this.calculatePositions();
    },

    initPathMaps() {
        const o = {};
        for (let i = 0; i <= 18; i++) o[i] = i + 1;
        o[19] = 29;
        this.OUTER_NEXT = o;

        this.SHORTCUT_NEXT = {
            5: 20, 20: 21, 21: 22,
            10: 23, 23: 24, 24: 22,
            15: 25, 25: 26, 26: 22,
            22: 27, 27: 28, 28: 29
        };

        const bw = {};
        for (let i = 1; i <= 19; i++) bw[i] = i - 1;
        bw[20] = 5;  bw[21] = 20; bw[22] = 21;
        bw[23] = 10; bw[24] = 23;
        bw[25] = 15; bw[26] = 25;
        bw[27] = 22; bw[28] = 27;
        this.BACKWARD = bw;
    },

    calculatePositions() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const m = 50;
        const pos = [];

        // 모서리 4개 + 중앙
        pos[0]  = { x: w - m, y: h - m };  // 우하 (시작)
        pos[5]  = { x: m,     y: h - m };  // 좌하
        pos[10] = { x: m,     y: m };      // 좌상
        pos[15] = { x: w - m, y: m };      // 우상
        pos[22] = { x: w / 2, y: h / 2 };  // 중앙

        // 하단 변 (0→5, 우→좌)
        for (let i = 1; i <= 4; i++) {
            pos[i] = { x: pos[0].x - i * (pos[0].x - pos[5].x) / 5, y: h - m };
        }
        // 좌측 변 (5→10, 하→상)
        for (let i = 1; i <= 4; i++) {
            pos[5 + i] = { x: m, y: pos[5].y - i * (pos[5].y - pos[10].y) / 5 };
        }
        // 상단 변 (10→15, 좌→우)
        for (let i = 1; i <= 4; i++) {
            pos[10 + i] = { x: pos[10].x + i * (pos[15].x - pos[10].x) / 5, y: m };
        }
        // 우측 변 (15→0, 상→하)
        for (let i = 1; i <= 4; i++) {
            pos[15 + i] = { x: w - m, y: pos[15].y + i * (pos[0].y - pos[15].y) / 5 };
        }

        // 대각선: 5(좌하) → 중앙 (위치 20, 21)
        for (let i = 1; i <= 2; i++) {
            pos[19 + i] = {
                x: pos[5].x + i * (pos[22].x - pos[5].x) / 3,
                y: pos[5].y + i * (pos[22].y - pos[5].y) / 3
            };
        }
        // 대각선: 10(좌상) → 중앙 (위치 23, 24)
        for (let i = 1; i <= 2; i++) {
            pos[22 + i] = {
                x: pos[10].x + i * (pos[22].x - pos[10].x) / 3,
                y: pos[10].y + i * (pos[22].y - pos[10].y) / 3
            };
        }
        // 대각선: 15(우상) → 중앙 (위치 25, 26)
        for (let i = 1; i <= 2; i++) {
            pos[24 + i] = {
                x: pos[15].x + i * (pos[22].x - pos[15].x) / 3,
                y: pos[15].y + i * (pos[22].y - pos[15].y) / 3
            };
        }
        // 대각선: 중앙 → 0(우하) (위치 27, 28)
        for (let i = 1; i <= 2; i++) {
            pos[26 + i] = {
                x: pos[22].x + i * (pos[0].x - pos[22].x) / 3,
                y: pos[22].y + i * (pos[0].y - pos[22].y) / 3
            };
        }

        this.positions = pos;
    },

    // ===== 메인 그리기 =====
    draw(gameState) {
        this.lastGameState = gameState;
        if (this.animating) return; // 애니메이션 중에는 직접 draw 무시
        this._render(gameState);
    },

    _render(gameState) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 배경
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        this.drawBoard();
        this.drawEffects();

        if (gameState && gameState.player1 && gameState.player2) {
            this.drawAllPieces(gameState);
        }
    },

    // ===== 윷판 그리기 =====
    drawBoard() {
        const ctx = this.ctx;
        const pos = this.positions;

        // --- 외곽 선 ---
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;

        // 하단
        for (let i = 0; i < 5; i++) this.drawLine(pos[i], pos[i + 1]);
        // 좌측
        for (let i = 5; i < 10; i++) this.drawLine(pos[i], pos[i + 1]);
        // 상단
        for (let i = 10; i < 15; i++) this.drawLine(pos[i], pos[i + 1]);
        // 우측
        for (let i = 15; i < 19; i++) this.drawLine(pos[i], pos[i + 1]);
        this.drawLine(pos[19], pos[0]); // 19 → 시작점

        // --- 대각선 ---
        ctx.strokeStyle = '#7A6345';
        ctx.lineWidth = 2;

        // 좌하(5) → 중앙 → 우상(15)
        const diag1 = [5, 20, 21, 22, 26, 25, 15];
        for (let i = 0; i < diag1.length - 1; i++) {
            this.drawLine(pos[diag1[i]], pos[diag1[i + 1]]);
        }
        // 좌상(10) → 중앙 → 우하(0)
        const diag2 = [10, 23, 24, 22, 27, 28, 0];
        for (let i = 0; i < diag2.length - 1; i++) {
            this.drawLine(pos[diag2[i]], pos[diag2[i + 1]]);
        }

        // --- 위치 마커 ---
        for (let i = 0; i <= 28; i++) {
            if (!pos[i]) continue;
            const p = pos[i];
            const isCorner = [0, 5, 10, 15].includes(i);
            const isCenter = i === 22;
            const radius = isCorner ? 16 : isCenter ? 14 : 8;

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

            if (isCorner || isCenter) {
                ctx.fillStyle = '#2a2a4a';
                ctx.strokeStyle = '#8B7355';
                ctx.lineWidth = 2.5;
            } else {
                ctx.fillStyle = '#222244';
                ctx.strokeStyle = '#5a5a6a';
                ctx.lineWidth = 1.5;
            }
            ctx.fill();
            ctx.stroke();
        }

        // --- 라벨 ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 시작/도착 표시
        ctx.fillStyle = '#e9a560';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('출발', pos[0].x, pos[0].y);

        // 모서리 이름 (작게)
        ctx.fillStyle = '#667';
        ctx.font = '10px sans-serif';
        ctx.fillText('꼭', pos[5].x, pos[5].y);
        ctx.fillText('꼭', pos[10].x, pos[10].y);
        ctx.fillText('꼭', pos[15].x, pos[15].y);

        // 중앙
        ctx.fillStyle = '#a88';
        ctx.font = '10px sans-serif';
        ctx.fillText('중앙', pos[22].x, pos[22].y);
    },

    // ===== 말 그리기 =====
    drawAllPieces(gameState) {
        // 시작 위치(0)에서 대기 중인 말은 별도 영역에 배치
        this.drawPlayerPieces(gameState.player1, '#e94560', 1);
        this.drawPlayerPieces(gameState.player2, '#4ecdc4', 2);
    },

    drawPlayerPieces(playerDto, color, playerNum) {
        const pos = this.positions;
        const waitingPieces = [];
        const boardPieces = [];

        playerDto.pieces.forEach((piece, idx) => {
            if (piece.finished) return;
            if (piece.position === 0) {
                waitingPieces.push({ piece, idx });
            } else {
                boardPieces.push({ piece, idx });
            }
        });

        // 대기 중인 말 (시작 근처에 배치)
        waitingPieces.forEach((item) => {
            const wp = this._waitingPos(playerNum, item.idx);
            const ox = wp.x;
            const oy = wp.y;
            this.drawPieceAt(ox, oy, color, item.idx + 1, item.piece.stackCount);
        });

        // 판 위의 말
        boardPieces.forEach((item) => {
            const p = pos[item.piece.position];
            if (!p) return;
            // 같은 위치에 여러 말이 있을 수 있으므로 약간 오프셋
            const offsetX = (playerNum === 1 ? -6 : 6);
            const offsetY = (playerNum === 1 ? -6 : 6);
            this.drawPieceAt(p.x + offsetX, p.y + offsetY, color, item.idx + 1, item.piece.stackCount);
        });
    },

    drawPieceAt(x, y, color, number, stackCount) {
        const ctx = this.ctx;
        const r = 13;

        // 그림자
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // 말 본체
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 숫자
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, x, y);

        // 업힌 말 표시
        if (stackCount > 1) {
            ctx.beginPath();
            ctx.arc(x + 12, y - 12, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('x' + stackCount, x + 12, y - 12);
        }
    },

    // ===== 이동 애니메이션 =====
    animateMove(oldState, newState, captured, stacked, callback) {
        if (!oldState || !oldState.player1) {
            if (callback) callback();
            return;
        }

        const anims = [];

        // 변경된 말 찾기 (position이 달라진 말)
        [
            { old: oldState.player1, now: newState.player1, color: '#e94560', pn: 1 },
            { old: oldState.player2, now: newState.player2, color: '#4ecdc4', pn: 2 }
        ].forEach(({ old: oldP, now: nowP, color, pn }) => {
            if (!oldP || !nowP) return;
            for (let i = 0; i < oldP.pieces.length; i++) {
                const op = oldP.pieces[i];
                const np = nowP.pieces[i];
                if (op.position !== np.position && !op.finished) {
                    const from = op.position === 0 ? this._waitingPos(pn, i) : this.positions[op.position];
                    const to = np.finished ? null : (np.position === 0 ? this._waitingPos(pn, i) : this.positions[np.position]);

                    if (from && to) {
                        const offX = pn === 1 ? -6 : 6;
                        const offY = pn === 1 ? -6 : 6;
                        const isFromWaiting = op.position === 0;
                        const isToWaiting = np.position === 0;
                        anims.push({
                            fromX: isFromWaiting ? from.x : from.x + offX,
                            fromY: isFromWaiting ? from.y : from.y + offY,
                            toX: isToWaiting ? to.x : to.x + offX,
                            toY: isToWaiting ? to.y : to.y + offY,
                            color: color,
                            number: i + 1,
                            stackCount: np.stackCount,
                            isCaptured: false
                        });
                    }
                }
            }
        });

        if (anims.length === 0) {
            this.lastGameState = newState;
            this._render(newState);
            if (callback) callback();
            return;
        }

        // 잡기 효과
        if (captured) {
            // 잡힌 말의 이전 위치에서 효과
            anims.forEach(a => {
                if (a.color === '#e94560' || a.color === '#4ecdc4') {
                    // 잡힌 쪽의 말이 시작점으로 돌아가는 애니메이션에 효과 추가
                }
            });
            this.effects.push({
                type: 'capture',
                x: anims[0].toX,
                y: anims[0].toY,
                startTime: Date.now(),
                duration: 600
            });
        }

        // 업기 효과
        if (stacked) {
            this.effects.push({
                type: 'stack',
                x: anims[0].toX,
                y: anims[0].toY,
                startTime: Date.now(),
                duration: 400
            });
        }

        // 애니메이션 실행
        this.animating = true;
        const duration = 400; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = this.easeOutQuad(progress);

            // 이전 상태로 보드 그리기 (이동 중인 말 제외)
            this._render(oldState);

            // 이동 중인 말 그리기
            for (const a of anims) {
                const cx = a.fromX + (a.toX - a.fromX) * eased;
                const cy = a.fromY + (a.toY - a.fromY) * eased;
                this.drawPieceAt(cx, cy, a.color, a.number, a.stackCount);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.animating = false;
                this.lastGameState = newState;
                this._render(newState);
                if (callback) callback();
            }
        };

        requestAnimationFrame(animate);
    },

    _waitingPos(playerNum, pieceIdx) {
        const base = this.positions[0];
        if (playerNum === 1) {
            return { x: base.x - 30 - pieceIdx * 22, y: base.y - 30 };
        } else {
            return { x: base.x - 30 - pieceIdx * 22, y: base.y + 30 };
        }
    },

    // ===== 시각 효과 =====
    drawEffects() {
        const ctx = this.ctx;
        const now = Date.now();

        this.effects = this.effects.filter(e => {
            const elapsed = now - e.startTime;
            if (elapsed > e.duration) return false;
            const progress = elapsed / e.duration;

            if (e.type === 'capture') {
                // 빨간 파동
                const radius = 20 + progress * 40;
                const alpha = 1 - progress;
                ctx.beginPath();
                ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(233, 69, 96, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();

                // 두 번째 파동
                const radius2 = 10 + progress * 30;
                ctx.beginPath();
                ctx.arc(e.x, e.y, radius2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.7})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (e.type === 'stack') {
                // 황금 빛
                const radius = 15 + progress * 20;
                const alpha = 1 - progress;
                ctx.beginPath();
                ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            return true;
        });
    },

    // ===== 유틸리티 =====
    drawLine(from, to) {
        if (!from || !to) return;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    },

    easeOutQuad(t) {
        return t * (2 - t);
    }
};
