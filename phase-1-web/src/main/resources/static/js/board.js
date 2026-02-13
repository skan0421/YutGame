// 윷판 렌더링 (Canvas)
const BoardRenderer = {
    canvas: null,
    ctx: null,

    // 윷판 위치 좌표 (30개: 0=시작, 1~28=경로, 29=도착)
    // 실제 윷판 십자형 배치
    positions: [],

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.calculatePositions();
    },

    calculatePositions() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const margin = 50;

        // 0: 시작 (우하단)
        // 외곽 경로: 1~5(하→우→), 6~10(우상→), 11~15(상→좌→), 16~20(좌하→)
        // 지름길: 21~28
        // 29: 도착 (중앙)

        const pos = [];

        // 위치 0 (시작 = 우하단 코너 바로 밖)
        pos[0] = { x: w - margin, y: h - margin };

        // 1~5: 하단 → 우하 → 우측 (하단 줄)
        for (let i = 1; i <= 5; i++) {
            pos[i] = {
                x: margin + (w - 2 * margin) * (1 - (i) / 5),
                y: h - margin
            };
        }

        // 6~10: 좌측 줄 (아래→위)
        for (let i = 6; i <= 10; i++) {
            pos[i] = {
                x: margin,
                y: margin + (h - 2 * margin) * (1 - (i - 5) / 5)
            };
        }

        // 11~15: 상단 줄 (좌→우)
        for (let i = 11; i <= 15; i++) {
            pos[i] = {
                x: margin + (w - 2 * margin) * ((i - 10) / 5),
                y: margin
            };
        }

        // 16~20: 우측 줄 (위→아래)
        for (let i = 16; i <= 20; i++) {
            pos[i] = {
                x: w - margin,
                y: margin + (h - 2 * margin) * ((i - 15) / 5)
            };
        }

        // 21~22: 좌하→중앙 대각선 (5번에서 출발)
        pos[20] = { x: w - margin, y: h - margin }; // 20번 = 시작점과 같은 위치
        pos[21] = { x: cx - 80, y: cy + 80 };
        pos[22] = { x: cx - 40, y: cy + 40 };

        // 23~25: 좌상→중앙 대각선 (10번에서 출발)
        pos[23] = { x: cx - 80, y: cy - 80 };
        pos[24] = { x: cx - 40, y: cy - 40 };
        pos[25] = { x: cx, y: cy }; // 중앙

        // 26~27: 중앙→우하 대각선
        pos[26] = { x: cx + 40, y: cy + 40 };
        pos[27] = { x: cx + 80, y: cy + 80 };

        // 28: 마지막 외곽
        pos[28] = { x: w - margin - 10, y: h - margin - 10 };

        // 29: 도착 (시작점 옆)
        pos[29] = { x: w - margin + 10, y: h - margin + 10 };

        this.positions = pos;
    },

    draw(gameState) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 배경
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, w, h);

        this.drawBoard();

        if (gameState && gameState.player1 && gameState.player2) {
            this.drawPieces(gameState.player1, '#e94560');
            this.drawPieces(gameState.player2, '#4ecdc4');
        }
    },

    drawBoard() {
        const ctx = this.ctx;
        const pos = this.positions;

        // 외곽선 연결
        ctx.strokeStyle = '#334';
        ctx.lineWidth = 2;

        // 하단
        this.drawLine(pos[0], pos[1]);
        for (let i = 1; i < 5; i++) this.drawLine(pos[i], pos[i + 1]);
        // 좌측
        this.drawLine(pos[5], pos[6]);
        for (let i = 6; i < 10; i++) this.drawLine(pos[i], pos[i + 1]);
        // 상단
        this.drawLine(pos[10], pos[11]);
        for (let i = 11; i < 15; i++) this.drawLine(pos[i], pos[i + 1]);
        // 우측
        this.drawLine(pos[15], pos[16]);
        for (let i = 16; i < 20; i++) this.drawLine(pos[i], pos[i + 1]);

        // 대각선 (지름길)
        ctx.strokeStyle = '#553';
        this.drawLine(pos[5], pos[21]);
        this.drawLine(pos[21], pos[22]);
        this.drawLine(pos[22], pos[25]);
        this.drawLine(pos[10], pos[23]);
        this.drawLine(pos[23], pos[24]);
        this.drawLine(pos[24], pos[25]);
        this.drawLine(pos[25], pos[26]);
        this.drawLine(pos[26], pos[27]);

        // 각 위치에 원 그리기
        for (let i = 0; i < 29; i++) {
            if (!pos[i]) continue;
            const p = pos[i];
            const isCorner = [0, 5, 10, 15].includes(i);
            const isCenter = i === 25;

            ctx.beginPath();
            ctx.arc(p.x, p.y, isCorner || isCenter ? 14 : 10, 0, Math.PI * 2);
            ctx.fillStyle = isCorner ? '#2a2a4a' : isCenter ? '#3a2a2a' : '#222244';
            ctx.fill();
            ctx.strokeStyle = '#556';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 위치 번호 (작게)
            ctx.fillStyle = '#667';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, p.x, p.y);
        }

        // 도착 표시
        if (pos[29]) {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('도착', pos[0].x, pos[0].y + 26);
        }

        // 시작 표시
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('시작', pos[0].x, pos[0].y - 22);
    },

    drawLine(from, to) {
        if (!from || !to) return;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    },

    drawPieces(playerDto, color) {
        const ctx = this.ctx;
        const pos = this.positions;

        playerDto.pieces.forEach((piece, idx) => {
            if (piece.finished) return; // 도착한 말은 안 그림
            if (piece.position === 0 && !piece.finished) {
                // 시작 위치 — 겹치지 않게 오프셋
                const offsetX = (idx % 2) * 24 - 12;
                const offsetY = Math.floor(idx / 2) * 24 - 50;
                this.drawPieceAt(pos[0].x + offsetX, pos[0].y + offsetY, color, idx + 1, piece.stackCount);
                return;
            }

            const p = pos[piece.position];
            if (!p) return;

            // 같은 위치의 말 오프셋
            const offsetX = (idx % 2) * 8 - 4;
            const offsetY = Math.floor(idx / 2) * 8 - 4;
            this.drawPieceAt(p.x + offsetX, p.y + offsetY, color, idx + 1, piece.stackCount);
        });
    },

    drawPieceAt(x, y, color, number, stackCount) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, x, y);

        // 업힌 말 표시
        if (stackCount > 1) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('x' + stackCount, x + 14, y - 10);
        }
    }
};
