// 윷판 3D 렌더링 (Three.js) — 툰 셰이딩 + 치비 캐릭터
const BoardRenderer = {
    mount: null,
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    animFrameId: null,

    // 3D 오브젝트 참조
    pieceMeshes: {},
    particles: null,
    clouds: [],

    // 좌표
    positions: [],
    BOARD_HALF: 5,

    // 상태
    animating: false,
    lastGameState: null,
    effects: [],

    // 플레이어 색상
    PLAYER_COLORS: [0xe94560, 0x4ecdc4],
    PLAYER_DARK: [0xcc3344, 0x339990],
    CORNERS: new Set([0, 5, 10, 15, 22]),

    // 경로 맵 (백엔드와 동일)
    OUTER_NEXT: {},
    SHORTCUT_NEXT: {},
    BACKWARD: {},
    SHORTCUT_POS: new Set([20, 21, 22, 23, 24, 25, 26, 27, 28]),
    FINISH: 29,

    EDGES: [
        ...Array.from({ length: 19 }, (_, i) => [i, i + 1]), [19, 0],
        [5, 20], [20, 21], [21, 22], [22, 23], [23, 24], [24, 15],
        [0, 25], [25, 26], [26, 22], [22, 27], [27, 28], [28, 10],
    ],

    // ===== 툰 그라디언트 텍스쳐 =====
    _toonGrad4: null,
    _toonGrad3: null,
    makeToonGradient(steps) {
        const colors = new Uint8Array(steps);
        for (let i = 0; i < steps; i++) colors[i] = (i / (steps - 1)) * 255;
        const tex = new THREE.DataTexture(colors, steps, 1, THREE.RedFormat);
        tex.needsUpdate = true;
        return tex;
    },

    // ===== 초기화 =====
    init(mountId) {
        // mountId 는 이전에는 canvas ID, 이제는 div ID
        this.mount = document.getElementById(mountId);
        if (!this.mount) {
            // fallback: 'board-mount' div 사용
            this.mount = document.getElementById('board-mount');
        }
        this._toonGrad4 = this.makeToonGradient(4);
        this._toonGrad3 = this.makeToonGradient(3);
        this.initPathMaps();
        this.calculatePositions();
        this.initThreeScene();
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

    // ===== 3D 좌표 계산 =====
    calculatePositions() {
        const h = this.BOARD_HALF;
        const step = (h * 2) / 5;
        const pos = [];

        // 외곽 (0~19)
        for (let i = 0; i <= 5; i++) pos[i] = { id: i, x: -h + step * i, z: h };
        for (let i = 1; i <= 5; i++) pos[5 + i] = { id: 5 + i, x: h, z: h - step * i };
        for (let i = 1; i <= 5; i++) pos[10 + i] = { id: 10 + i, x: h - step * i, z: -h };
        for (let i = 1; i <= 4; i++) pos[15 + i] = { id: 15 + i, x: -h, z: -h + step * i };

        // 대각선
        const d = step;
        pos[20] = { id: 20, x: h - d, z: h - d };
        pos[21] = { id: 21, x: h - d * 2, z: h - d * 2 };
        pos[22] = { id: 22, x: 0, z: 0 };
        pos[23] = { id: 23, x: -h + d * 2, z: -h + d * 2 };
        pos[24] = { id: 24, x: -h + d, z: -h + d };
        pos[25] = { id: 25, x: -h + d, z: h - d };
        pos[26] = { id: 26, x: -h + d * 2, z: h - d * 2 };
        pos[27] = { id: 27, x: h - d * 2, z: -h + d * 2 };
        pos[28] = { id: 28, x: h - d, z: -h + d };

        this.positions = pos;
    },

    gp(id) {
        return this.positions[id];
    },

    // ===== Three.js 씬 초기화 =====
    initThreeScene() {
        const mount = this.mount;
        const w = Math.min(mount.clientWidth || 520, 520);
        const h = w;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);
        this.scene = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
        camera.position.set(0, 15, 11);
        camera.lookAt(0, 0, 0.5);
        this.camera = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        mount.appendChild(renderer.domElement);
        this.renderer = renderer;

        // Lights
        scene.add(new THREE.AmbientLight(0xc8d8ff, 0.6));
        const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
        sun.position.set(6, 15, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 35;
        sun.shadow.camera.left = -10;
        sun.shadow.camera.right = 10;
        sun.shadow.camera.top = 10;
        sun.shadow.camera.bottom = -10;
        sun.shadow.bias = -0.001;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0x88bbff, 0.35);
        fill.position.set(-6, 8, -6);
        scene.add(fill);

        const rimLight = new THREE.DirectionalLight(0xffd4a0, 0.25);
        rimLight.position.set(0, 3, -10);
        scene.add(rimLight);

        // Build board
        this.buildBoard();

        // Particles
        this.particles = this.createParticleSystem();

        // Clouds
        this.clouds = [];
        const cloudData = [
            { x: -6, y: 8, z: -8, s: 1.2 },
            { x: 5, y: 9, z: -6, s: 0.8 },
            { x: 8, y: 7.5, z: 3, s: 1.0 },
        ];
        cloudData.forEach(c => {
            const cloud = this.createCloud(c.x, c.y, c.z, c.s);
            scene.add(cloud);
            this.clouds.push(cloud);
        });

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshToonMaterial({ color: 0x5a9a5a, gradientMap: this._toonGrad3 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        scene.add(ground);

        // Clock & animate
        this.clock = new THREE.Clock();
        this.startAnimation();
    },

    // ===== 보드 빌드 =====
    buildBoard() {
        const scene = this.scene;

        // Board base (원형 잔디 판)
        const boardMat = new THREE.MeshToonMaterial({ color: 0x8bc47a, gradientMap: this._toonGrad4 });
        const board = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.5, 0.3, 32), boardMat);
        board.position.y = -0.15;
        board.receiveShadow = true;
        this.addOutline(board, 1.01, 0x5a8a4a);
        scene.add(board);

        // Board rim
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(6.3, 0.15, 8, 48),
            new THREE.MeshToonMaterial({ color: 0x6b5b3a, gradientMap: this._toonGrad4 })
        );
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -0.05;
        scene.add(rim);

        // Edges (경로)
        const pathMat = new THREE.MeshToonMaterial({ color: 0xe8d5b0, gradientMap: this._toonGrad3 });
        this.EDGES.forEach(([a, b]) => {
            const pa = this.gp(a), pb = this.gp(b);
            if (!pa || !pb) return;
            const dx = pb.x - pa.x, dz = pb.z - pa.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) return;
            const path = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, len - 0.3), pathMat);
            path.position.set((pa.x + pb.x) / 2, 0.03, (pa.z + pb.z) / 2);
            path.rotation.y = -Math.atan2(dz, dx) + Math.PI / 2;
            path.receiveShadow = true;
            scene.add(path);
        });

        // Spots (위치 마커)
        this.positions.forEach(pos => {
            if (!pos) return;
            const isCorner = this.CORNERS.has(pos.id);
            const r = isCorner ? 0.4 : 0.22;
            const h = isCorner ? 0.14 : 0.08;
            const spotMat = new THREE.MeshToonMaterial({
                color: isCorner ? 0xd4a56a : 0xc8b090,
                gradientMap: this._toonGrad4,
            });
            const spot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, isCorner ? 24 : 14), spotMat);
            spot.position.set(pos.x, h / 2, pos.z);
            spot.receiveShadow = true;
            spot.castShadow = true;
            this.addOutline(spot, 1.05, isCorner ? 0x8b6b3a : 0x9a8a6a);
            scene.add(spot);

            if (isCorner) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(r - 0.1, 0.03, 8, 20),
                    new THREE.MeshToonMaterial({ color: 0xf0d8a0, gradientMap: this._toonGrad3 })
                );
                ring.rotation.x = -Math.PI / 2;
                ring.position.set(pos.x, h + 0.01, pos.z);
                scene.add(ring);
            }
        });

        // "출발" label
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#5d4e37';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('출발', 64, 34);
        const tex = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.35),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        label.rotation.x = -Math.PI / 2;
        const startPos = this.gp(0);
        label.position.set(startPos.x, 0.16, startPos.z + 0.65);
        scene.add(label);

        // Trees
        const treePositions = [
            { x: -7.5, z: -6, s: 1.2 }, { x: 7, z: -7, s: 1.0 },
            { x: -8, z: 5, s: 0.8 }, { x: 7.5, z: 6, s: 1.1 },
            { x: 8.5, z: -2, s: 0.7 }, { x: -8.5, z: -1, s: 0.9 },
        ];
        treePositions.forEach(t => scene.add(this.createTree(t.x, t.z, t.s)));

        // Flowers
        const flowerColors = [0xff69b4, 0xff6b6b, 0xffeb3b, 0x4ecdc4, 0xa78bfa];
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 6.5 + Math.random() * 2;
            scene.add(this.createFlower(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                flowerColors[Math.floor(Math.random() * flowerColors.length)]
            ));
        }
    },

    // ===== 아웃라인 메쉬 =====
    addOutline(mesh, scale, color) {
        color = color || 0x222222;
        const outGeo = mesh.geometry.clone();
        const outMat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
        const outline = new THREE.Mesh(outGeo, outMat);
        outline.scale.multiplyScalar(scale);
        mesh.add(outline);
        return outline;
    },

    // ===== 치비 캐릭터 =====
    createChibiCharacter(color, darkColor, scale) {
        scale = scale || 1;
        const group = new THREE.Group();
        const s = scale;
        const toon4 = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: this._toonGrad4 });
        const toon3 = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: this._toonGrad3 });
        const skinColor = 0xffddbb;

        // HEAD
        const headGeo = new THREE.SphereGeometry(0.32 * s, 16, 12);
        const head = new THREE.Mesh(headGeo, toon4(skinColor));
        head.position.y = 0.72 * s;
        head.castShadow = true;
        this.addOutline(head, 1.06);
        group.add(head);

        // Hair (cap)
        const hairGeo = new THREE.SphereGeometry(0.33 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const hair = new THREE.Mesh(hairGeo, toon4(0x332211));
        hair.position.y = 0.74 * s;
        this.addOutline(hair, 1.05);
        group.add(hair);

        // Eyes (big anime)
        const eyeGeo = new THREE.SphereGeometry(0.065 * s, 10, 8);
        const eyeWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: this._toonGrad3 });
        const eyeBlack = toon4(0x111111);
        const eyeShine = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-1, 1].forEach(side => {
            const white = new THREE.Mesh(eyeGeo, eyeWhite);
            white.position.set(side * 0.11 * s, 0.73 * s, 0.27 * s);
            white.scale.set(1, 1.2, 0.8);
            group.add(white);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 8, 6), eyeBlack);
            pupil.position.set(side * 0.11 * s, 0.73 * s, 0.31 * s);
            group.add(pupil);
            const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016 * s, 6, 6), eyeShine);
            shine.position.set(side * 0.09 * s, 0.76 * s, 0.33 * s);
            group.add(shine);
        });

        // Blush
        const blushMat = new THREE.MeshToonMaterial({ color: 0xff8888, transparent: true, opacity: 0.5, gradientMap: this._toonGrad3 });
        [-1, 1].forEach(side => {
            const blush = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 8, 8), blushMat);
            blush.position.set(side * 0.2 * s, 0.66 * s, 0.25 * s);
            blush.scale.set(1.5, 1, 1);
            group.add(blush);
        });

        // Mouth
        const smileCurve = new THREE.EllipseCurve(0, 0, 0.05 * s, 0.025 * s, Math.PI * 0.1, Math.PI * 0.9);
        const smileGeo = new THREE.BufferGeometry().setFromPoints(smileCurve.getPoints(12));
        const smile = new THREE.Line(smileGeo, new THREE.LineBasicMaterial({ color: 0xcc6655, linewidth: 2 }));
        smile.position.set(0, 0.62 * s, 0.3 * s);
        group.add(smile);

        // BODY
        const bodyGeo = new THREE.CylinderGeometry(0.18 * s, 0.22 * s, 0.32 * s, 12);
        const body = new THREE.Mesh(bodyGeo, toon4(color));
        body.position.y = 0.3 * s;
        body.castShadow = true;
        this.addOutline(body, 1.07);
        group.add(body);

        // Collar
        const collarGeo = new THREE.TorusGeometry(0.18 * s, 0.025 * s, 8, 16);
        const collar = new THREE.Mesh(collarGeo, toon3(darkColor));
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 0.44 * s;
        group.add(collar);

        // Button
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 8, 8), toon3(darkColor));
        btn.position.set(0, 0.3 * s, 0.2 * s);
        group.add(btn);

        // ARMS
        const armGeo = new THREE.CylinderGeometry(0.05 * s, 0.04 * s, 0.22 * s, 8);
        [-1, 1].forEach(side => {
            const arm = new THREE.Mesh(armGeo, toon4(color));
            arm.position.set(side * 0.24 * s, 0.3 * s, 0);
            arm.rotation.z = side * 0.4;
            arm.castShadow = true;
            this.addOutline(arm, 1.1);
            group.add(arm);
            const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 6), toon4(skinColor));
            hand.position.set(side * 0.32 * s, 0.2 * s, 0);
            hand.castShadow = true;
            this.addOutline(hand, 1.08);
            group.add(hand);
        });

        // LEGS
        const legGeo = new THREE.CylinderGeometry(0.065 * s, 0.06 * s, 0.16 * s, 8);
        const legMat = toon4(0x445566);
        [-1, 1].forEach(side => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(side * 0.09 * s, 0.08 * s, 0);
            leg.castShadow = true;
            this.addOutline(leg, 1.08);
            group.add(leg);
            const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 8, 6), toon4(darkColor));
            shoe.position.set(side * 0.09 * s, 0.01 * s, 0.03 * s);
            shoe.scale.set(1, 0.6, 1.4);
            shoe.castShadow = true;
            this.addOutline(shoe, 1.1);
            group.add(shoe);
        });

        return group;
    },

    // 업힌 말 (피기백)
    createPiggyback(color, darkColor, count) {
        const group = new THREE.Group();
        for (let i = 0; i < count; i++) {
            const sc = 1 - i * 0.1;
            const ch = this.createChibiCharacter(color, darkColor, sc);
            ch.position.y = i * 0.65;
            if (i > 0) ch.rotation.x = -0.2;
            group.add(ch);
        }
        // 스택 수 뱃지 (빌보드 스프라이트)
        if (count > 1) {
            const badgeCanvas = document.createElement('canvas');
            badgeCanvas.width = 64; badgeCanvas.height = 64;
            const ctx = badgeCanvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(32, 32, 28, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#332800';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#332800';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count.toString(), 32, 34);
            const badgeTex = new THREE.CanvasTexture(badgeCanvas);
            const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
            badgeSprite.scale.set(0.35, 0.35, 1);
            badgeSprite.position.set(0.35, count * 0.65 + 0.3, 0);
            group.add(badgeSprite);
        }
        return group;
    },

    // ===== 나무 =====
    createTree(x, z, scale) {
        scale = scale || 1;
        const group = new THREE.Group();
        const s = scale;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.6 * s, 8),
            new THREE.MeshToonMaterial({ color: 0x8b6914, gradientMap: this._toonGrad4 })
        );
        trunk.position.y = 0.3 * s;
        trunk.castShadow = true;
        this.addOutline(trunk, 1.08);
        group.add(trunk);

        const leafColors = [0x4CAF50, 0x66BB6A, 0x43A047];
        [0.7, 1.0, 1.3].forEach((h, i) => {
            const r = (0.45 - i * 0.1) * s;
            const leaf = new THREE.Mesh(
                new THREE.SphereGeometry(r, 10, 8),
                new THREE.MeshToonMaterial({ color: leafColors[i], gradientMap: this._toonGrad3 })
            );
            leaf.position.y = h * s;
            leaf.scale.set(1, 0.8, 1);
            leaf.castShadow = true;
            this.addOutline(leaf, 1.05);
            group.add(leaf);
        });
        group.position.set(x, -0.3, z);
        return group;
    },

    // ===== 꽃 =====
    createFlower(x, z, color) {
        color = color || 0xff69b4;
        const group = new THREE.Group();
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6),
            new THREE.MeshToonMaterial({ color: 0x2e7d32, gradientMap: this._toonGrad3 })
        );
        stem.position.y = 0.1;
        group.add(stem);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const petal = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 6),
                new THREE.MeshToonMaterial({ color, gradientMap: this._toonGrad3 })
            );
            petal.position.set(Math.cos(angle) * 0.04, 0.22, Math.sin(angle) * 0.04);
            petal.scale.set(1.2, 0.8, 1.2);
            group.add(petal);
        }
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 8, 6),
            new THREE.MeshToonMaterial({ color: 0xffeb3b, gradientMap: this._toonGrad3 })
        );
        center.position.y = 0.22;
        group.add(center);
        group.position.set(x, -0.3, z);
        return group;
    },

    // ===== 구름 =====
    createCloud(x, y, z, scale) {
        scale = scale || 1;
        const group = new THREE.Group();
        const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: this._toonGrad3, transparent: true, opacity: 0.85 });
        [{ x: 0, r: 0.5 }, { x: -0.4, r: 0.35 }, { x: 0.4, r: 0.35 }, { x: -0.2, r: 0.4 }, { x: 0.2, r: 0.4 }].forEach(c => {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(c.r * scale, 10, 8), mat);
            sphere.position.set(c.x * scale, 0, 0);
            sphere.scale.y = 0.6;
            group.add(sphere);
        });
        group.position.set(x, y, z);
        return group;
    },

    // ===== 파티클 =====
    createParticleSystem() {
        const count = 30;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -10;
            positions[i * 3 + 2] = 0;
            const c = new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 0.8, 0.6);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.8 });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        return points;
    },

    emitParticles(x, y, z) {
        if (!this.particles) return;
        const pos = this.particles.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setXYZ(i, x + (Math.random() - 0.5) * 0.5, y + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.5);
        }
        pos.needsUpdate = true;
        this.particles.userData.active = true;
        this.particles.userData.startTime = Date.now();
    },

    updateParticles() {
        if (!this.particles || !this.particles.userData.active) return;
        const elapsed = (Date.now() - this.particles.userData.startTime) / 1000;
        if (elapsed > 1.5) {
            this.particles.userData.active = false;
            const pos = this.particles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) pos.setXYZ(i, 0, -10, 0);
            pos.needsUpdate = true;
            return;
        }
        const pos = this.particles.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setY(i, pos.getY(i) + 0.03 + Math.random() * 0.02);
            pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.02);
            pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.02);
        }
        pos.needsUpdate = true;
        this.particles.material.opacity = Math.max(0, 0.8 - elapsed * 0.5);
    },

    // ===== 애니메이션 루프 =====
    startAnimation() {
        const self = this;
        function animate() {
            self.animFrameId = requestAnimationFrame(animate);
            const t = self.clock.getElapsedTime();

            // 구름 이동
            self.clouds.forEach((cloud, i) => {
                cloud.position.x += 0.003 * (i % 2 === 0 ? 1 : -1);
                if (cloud.position.x > 14) cloud.position.x = -14;
                if (cloud.position.x < -14) cloud.position.x = 14;
            });

            // 파티클
            self.updateParticles();

            // 말 흔들림 (idle bob)
            Object.values(self.pieceMeshes).forEach((mesh, idx) => {
                if (mesh && mesh.userData.baseY !== undefined) {
                    mesh.position.y = mesh.userData.baseY + Math.sin(t * 2.5 + idx * 1.2) * 0.04;
                }
            });

            // 카메라 미세 움직임
            self.camera.position.x = Math.sin(t * 0.15) * 0.5;
            self.camera.position.z = 11 + Math.sin(t * 0.1) * 0.3;
            self.camera.lookAt(0, 0, 0.5);

            self.renderer.render(self.scene, self.camera);
        }
        animate();
    },

    // ===== 말 배치 (draw 호출 시) =====
    draw(gameState) {
        this.lastGameState = gameState;
        if (this.animating) return;
        this._updatePieces(gameState);
    },

    _updatePieces(gameState) {
        // 기존 말 제거
        Object.values(this.pieceMeshes).forEach(m => this.scene.remove(m));
        this.pieceMeshes = {};

        if (!gameState || !gameState.player1 || !gameState.player2) return;

        // 각 플레이어 말 배치
        [
            { player: gameState.player1, colorIdx: 0 },
            { player: gameState.player2, colorIdx: 1 }
        ].forEach(({ player, colorIdx }) => {
            const color = this.PLAYER_COLORS[colorIdx];
            const dark = this.PLAYER_DARK[colorIdx];

            // 같은 위치에 있는 말 그룹핑
            const groups = {};
            player.pieces.forEach((piece, idx) => {
                if (piece.finished) return;
                const key = piece.position === 0 ? `wait_${colorIdx}_${idx}` : `pos_${piece.position}`;
                if (!groups[key]) groups[key] = { piece, idx, posId: piece.position, stack: piece.stackCount, colorIdx };
            });

            // 말 그리기
            player.pieces.forEach((piece, idx) => {
                if (piece.finished) return;

                // 이미 그린 스택의 일부인지 확인 (stackCount > 1인 대표만 그림)
                if (piece.position !== 0 && piece.stackCount <= 1) {
                    // 같은 위치에 stackCount > 1인 말이 있으면 스킵
                    const hasStack = player.pieces.some((p, i) =>
                        i !== idx && p.position === piece.position && p.stackCount > 1 && !p.finished
                    );
                    if (hasStack) return;
                }

                let mesh;
                if (piece.stackCount > 1) {
                    mesh = this.createPiggyback(color, dark, piece.stackCount);
                } else {
                    mesh = this.createChibiCharacter(color, dark);
                }

                let px, pz;
                if (piece.position === 0) {
                    // 대기 위치
                    const startP = this.gp(0);
                    const offset = colorIdx === 0 ? -1 : 1;
                    px = startP.x + (idx * 0.7 + 0.5) * offset;
                    pz = startP.z + 1.2;
                } else {
                    const p = this.gp(piece.position);
                    if (!p) return;
                    const offset = colorIdx === 0 ? -0.3 : 0.3;
                    px = p.x + offset;
                    pz = p.z + offset;
                }

                mesh.position.set(px, 0.14, pz);
                mesh.userData = { baseY: 0.14 };
                // 중앙을 바라보게
                mesh.lookAt(px * 0.3, 0.14, pz * 0.3);
                this.scene.add(mesh);

                const meshKey = `${colorIdx}_${idx}`;
                this.pieceMeshes[meshKey] = mesh;
            });
        });
    },

    // ===== 이동 애니메이션 =====
    animateMove(oldState, newState, captured, stacked, callback) {
        if (!oldState || !oldState.player1) {
            this.lastGameState = newState;
            this._updatePieces(newState);
            if (callback) callback();
            return;
        }

        const anims = [];
        [
            { old: oldState.player1, now: newState.player1, colorIdx: 0 },
            { old: oldState.player2, now: newState.player2, colorIdx: 1 }
        ].forEach(({ old: oldP, now: nowP, colorIdx }) => {
            if (!oldP || !nowP) return;
            for (let i = 0; i < oldP.pieces.length; i++) {
                const op = oldP.pieces[i];
                const np = nowP.pieces[i];
                if (op.position !== np.position && !op.finished) {
                    const fromPos = this._get3DPos(op.position, colorIdx, i);
                    const toPos = np.finished ? null : this._get3DPos(np.position, colorIdx, i);
                    if (fromPos && toPos) {
                        anims.push({
                            fromX: fromPos.x, fromZ: fromPos.z,
                            toX: toPos.x, toZ: toPos.z,
                            colorIdx, pieceIdx: i,
                            stackCount: np.stackCount,
                        });
                    }
                }
            }
        });

        if (anims.length === 0) {
            this.lastGameState = newState;
            this._updatePieces(newState);
            if (callback) callback();
            return;
        }

        this.animating = true;

        // 이동 대상 말의 임시 메쉬 생성
        const tempMeshes = anims.map(a => {
            const color = this.PLAYER_COLORS[a.colorIdx];
            const dark = this.PLAYER_DARK[a.colorIdx];
            const mesh = a.stackCount > 1
                ? this.createPiggyback(color, dark, a.stackCount)
                : this.createChibiCharacter(color, dark);
            mesh.position.set(a.fromX, 0.14, a.fromZ);
            mesh.userData = { baseY: 0.14 };
            this.scene.add(mesh);
            return mesh;
        });

        // 기존 말 숨기기
        this._updatePieces(oldState);

        const duration = 600;
        const startTime = Date.now();
        const self = this;

        (function animLoop() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = self.easeOutCubic(progress);

            // 점프 효과 (포물선)
            const jumpHeight = 0.6;
            const jumpY = Math.sin(progress * Math.PI) * jumpHeight;

            anims.forEach((a, idx) => {
                const mesh = tempMeshes[idx];
                mesh.position.x = a.fromX + (a.toX - a.fromX) * eased;
                mesh.position.z = a.fromZ + (a.toZ - a.fromZ) * eased;
                mesh.position.y = 0.14 + jumpY;
                mesh.lookAt(a.toX * 0.3, 0.14, a.toZ * 0.3);
            });

            if (progress < 1) {
                requestAnimationFrame(animLoop);
            } else {
                // 임시 메쉬 제거
                tempMeshes.forEach(m => self.scene.remove(m));

                // 파티클 + 효과
                if (captured && anims.length > 0) {
                    self.emitParticles(anims[0].toX, 0.5, anims[0].toZ);
                }
                if (stacked && anims.length > 0) {
                    self.emitParticles(anims[0].toX, 0.3, anims[0].toZ);
                }

                self.animating = false;
                self.lastGameState = newState;
                self._updatePieces(newState);
                if (callback) callback();
            }
        })();
    },

    _get3DPos(posId, colorIdx, pieceIdx) {
        if (posId === 0) {
            const startP = this.gp(0);
            const offset = colorIdx === 0 ? -1 : 1;
            return { x: startP.x + (pieceIdx * 0.7 + 0.5) * offset, z: startP.z + 1.2 };
        }
        const p = this.gp(posId);
        if (!p) return null;
        const offset = colorIdx === 0 ? -0.3 : 0.3;
        return { x: p.x + offset, z: p.z + offset };
    },

    // ===== 유틸 =====
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
};
