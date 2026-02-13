// 윷판 렌더링 (Canvas) + 애니메이션
const BoardRenderer = {
    canvas: null,
    ctx: null,
    positions: [],

    // --- 경로 맵 (백엔드와 동일) ---
    OUTER_NEXT: {},
    SHORTCUT_NEXT: {},
    BACKWARD: {},
    CORNERS: new Set([5, 10, 15]),
    SHORTCUT_POS: new Set([20, 21, 22, 23, 24, 25, 26, 27, 28]),
    FINISH: 29,

    // --- 애니메이션 ---
    effects: [],
    animating: false,
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
        bw[20] = 5; bw[21] = 20; bw[22] = 21;
        bw[23] = 10; bw[24] = 23;
        bw[25] = 15; bw[26] = 25;
        bw[27] = 22; bw[28] = 27;
        this.BACKWARD = bw;
    },

    // ===== 좌표 계산 =====
    // 출발: 우하단(0) → 우측 위로 → 우상(5) → 상단 좌로 → 좌상(10) → 좌측 아래로 → 좌하(15) → 하단 우로 → 도착
    calculatePositions() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const m = 50;
        const pos = [];

        // 모서리 4개 + 중앙
        pos[0]  = { x: w - m, y: h - m };   // 우하 (출발/도착)
        pos[5]  = { x: w - m, y: m };       // 우상
        pos[10] = { x: m,     y: m };       // 좌상
        pos[15] = { x: m,     y: h - m };   // 좌하
        pos[22] = { x: w / 2, y: h / 2 };   // 중앙

        // 우측 변 (0→5, 하→상) — 도/개/걸/윷 라인
        for (let i = 1; i <= 4; i++) {
            pos[i] = { x: w - m, y: pos[0].y + i * (pos[5].y - pos[0].y) / 5 };
        }
        // 상단 변 (5→10, 우→좌)
        for (let i = 1; i <= 4; i++) {
            pos[5 + i] = { x: pos[5].x - i * (pos[5].x - pos[10].x) / 5, y: m };
        }
        // 좌측 변 (10→15, 상→하)
        for (let i = 1; i <= 4; i++) {
            pos[10 + i] = { x: m, y: pos[10].y + i * (pos[15].y - pos[10].y) / 5 };
        }
        // 하단 변 (15→0, 좌→우)
        for (let i = 1; i <= 4; i++) {
            pos[15 + i] = { x: pos[15].x + i * (pos[0].x - pos[15].x) / 5, y: h - m };
        }

        // 대각선: 5(우상) → 중앙 (위치 20, 21)
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
        // 대각선: 15(좌하) → 중앙 (위치 25, 26)
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
        if (this.animating) return;
        this._render(gameState);
    },

    _render(gameState) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 배경 그라디언트
        const bg = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
        bg.addColorStop(0, '#1e2a45');
        bg.addColorStop(1, '#141a2e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        this.drawBoard();
        this.drawEffects();

        if (gameState && gameState.player1 && gameState.player2) {
            this.drawAllPieces(gameState);
        }
    },

    // ===== 윷판 그리기 (고급) =====
    drawBoard() {
        const ctx = this.ctx;
        const pos = this.positions;

        // --- 외곽 glow ---
        ctx.save();
        ctx.shadowColor = 'rgba(180, 140, 80, 0.15)';
        ctx.shadowBlur = 12;

        ctx.strokeStyle = '#9B8365';
        ctx.lineWidth = 3;

        // 우측
        for (let i = 0; i < 5; i++) this.drawLine(pos[i], pos[i + 1]);
        // 하단
        for (let i = 5; i < 10; i++) this.drawLine(pos[i], pos[i + 1]);
        // 좌측
        for (let i = 10; i < 15; i++) this.drawLine(pos[i], pos[i + 1]);
        // 상단
        for (let i = 15; i < 19; i++) this.drawLine(pos[i], pos[i + 1]);
        this.drawLine(pos[19], pos[0]);

        ctx.restore();

        // --- 대각선 (살짝 투명) ---
        ctx.save();
        ctx.shadowColor = 'rgba(140, 110, 60, 0.1)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#7A6345';
        ctx.lineWidth = 2;

        // 우상(5) → 중앙 → 좌하(15)
        const diag1 = [5, 20, 21, 22, 26, 25, 15];
        for (let i = 0; i < diag1.length - 1; i++) this.drawLine(pos[diag1[i]], pos[diag1[i + 1]]);

        // 좌상(10) → 중앙 → 우하(0)
        const diag2 = [10, 23, 24, 22, 27, 28, 0];
        for (let i = 0; i < diag2.length - 1; i++) this.drawLine(pos[diag2[i]], pos[diag2[i + 1]]);
        ctx.restore();

        // --- 위치 마커 ---
        for (let i = 0; i <= 28; i++) {
            if (!pos[i]) continue;
            const p = pos[i];
            const isCorner = [0, 5, 10, 15].includes(i);
            const isCenter = i === 22;

            if (isCorner || isCenter) {
                this._drawBigMarker(p.x, p.y, isCenter);
            } else {
                this._drawSmallMarker(p.x, p.y);
            }
        }

        // --- 라벨 ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 출발
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('출발', pos[0].x, pos[0].y);

        // 우측 라벨: 도/개/걸/윷
        const rightLabels = ['도', '개', '걸', '윷'];
        ctx.font = 'bold 11px sans-serif';
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#C8A96E';
            ctx.fillText(rightLabels[i], pos[i + 1].x + 22, pos[i + 1].y);
        }

        // 모서리 작은 라벨
        ctx.fillStyle = '#556';
        ctx.font = '9px sans-serif';
        ctx.fillText('모', pos[5].x, pos[5].y - 22);   // 우상
        ctx.fillText('모', pos[10].x, pos[10].y - 22);  // 좌상
        ctx.fillText('모', pos[15].x, pos[15].y + 24);  // 좌하
    },

    _drawBigMarker(x, y, isCenter) {
        const ctx = this.ctx;
        const r = isCenter ? 15 : 17;

        // 외곽 글로우
        ctx.save();
        ctx.shadowColor = 'rgba(180, 140, 80, 0.3)';
        ctx.shadowBlur = 10;

        // 바깥 링
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r);
        grad.addColorStop(0, '#3a3a5a');
        grad.addColorStop(1, '#252545');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#9B8365';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 안쪽 원
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 131, 101, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    },

    _drawSmallMarker(x, y) {
        const ctx = this.ctx;
        const r = 7;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 1, y - 1, 1, x, y, r);
        grad.addColorStop(0, '#2e2e50');
        grad.addColorStop(1, '#1e1e3a');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#555570';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    },

    // ===== 말 그리기 =====
    drawAllPieces(gameState) {
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

        waitingPieces.forEach((item) => {
            const wp = this._waitingPos(playerNum, item.idx);
            this.drawPieceAt(wp.x, wp.y, color, item.idx + 1, item.piece.stackCount);
        });

        boardPieces.forEach((item) => {
            const p = pos[item.piece.position];
            if (!p) return;
            const offX = playerNum === 1 ? -6 : 6;
            const offY = playerNum === 1 ? -6 : 6;
            this.drawPieceAt(p.x + offX, p.y + offY, color, item.idx + 1, item.piece.stackCount);
        });
    },

    drawPieceAt(x, y, color, number, stackCount) {
        const ctx = this.ctx;
        const r = 14;

        // 글로우
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        // 본체
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r);
        grad.addColorStop(0, this._lighten(color, 40));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // 숫자
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, x, y);

        // 업힌 말 배지
        if (stackCount > 1) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(x + 11, y - 11, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#332800';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#332800';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(stackCount, x + 11, y - 11);
        }
    },

    _lighten(hex, amt) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, r + amt);
        g = Math.min(255, g + amt);
        b = Math.min(255, b + amt);
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    },

    // ===== 이동 애니메이션 =====
    animateMove(oldState, newState, captured, stacked, callback) {
        if (!oldState || !oldState.player1) {
            if (callback) callback();
            return;
        }

        const anims = [];
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
                            color, number: i + 1,
                            stackCount: np.stackCount
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

        if (captured) {
            this.effects.push({ type: 'capture', x: anims[0].toX, y: anims[0].toY, startTime: Date.now(), duration: 700 });
        }
        if (stacked) {
            this.effects.push({ type: 'stack', x: anims[0].toX, y: anims[0].toY, startTime: Date.now(), duration: 500 });
        }

        this.animating = true;
        const duration = 450;
        const startTime = Date.now();
        const self = this;

        (function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = self.easeOutCubic(progress);

            self._render(oldState);
            for (const a of anims) {
                self.drawPieceAt(
                    a.fromX + (a.toX - a.fromX) * eased,
                    a.fromY + (a.toY - a.fromY) * eased,
                    a.color, a.number, a.stackCount
                );
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                self.animating = false;
                self.lastGameState = newState;
                self._render(newState);
                if (callback) callback();
            }
        })();
    },

    _waitingPos(playerNum, pieceIdx) {
        const base = this.positions[0]; // 우하단
        if (playerNum === 1) {
            return { x: base.x - 36 - pieceIdx * 26, y: base.y - 4 };
        } else {
            return { x: base.x - 36 - pieceIdx * 26, y: base.y + 26 };
        }
    },

    // ===== 시각 효과 =====
    drawEffects() {
        const ctx = this.ctx;
        const now = Date.now();
        this.effects = this.effects.filter(e => {
            const elapsed = now - e.startTime;
            if (elapsed > e.duration) return false;
            const t = elapsed / e.duration;

            if (e.type === 'capture') {
                // 이중 파동
                for (let k = 0; k < 2; k++) {
                    const r = 15 + (t + k * 0.15) * 50;
                    const a = Math.max(0, 1 - (t + k * 0.15));
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(233, 69, 96, ' + a + ')';
                    ctx.lineWidth = 3 - k;
                    ctx.stroke();
                }
            } else if (e.type === 'stack') {
                const r = 12 + t * 25;
                const a = 1 - t;
                ctx.beginPath();
                ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 215, 0, ' + a + ')';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            return true;
        });
    },

    // ===== 유틸 =====
    drawLine(from, to) {
        if (!from || !to) return;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    },
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
};
