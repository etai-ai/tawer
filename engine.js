// --- ENGINE: Game state, logic, sound, UI handlers ---
// Depends on: config.js

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');

// Portrait map: base 10 cols x 16 rows, cols expand to fill width
const BASE_COLS = 10, MAP_ROWS = 16;
let MAP_COLS = BASE_COLS;
let TILE, W, H, GRID_OX = 0, GRID_OY = 0;
let padLeft = 0; // how many grass columns added on left

let currentWorldIdx = Math.floor(Math.random() * WORLDS.length);
let mapData = [];

function padMap() {
  const baseData = WORLDS[currentWorldIdx].data;
  // Figure out how many columns we need
  const rect = canvas.getBoundingClientRect();
  const cw = Math.round(rect.width);
  const ch = Math.round(rect.height);
  // Tile size based on height (rows are fixed)
  const tileByH = Math.floor(ch / MAP_ROWS);
  const tile = Math.max(tileByH, 18);
  // How many columns fit in the width?
  const totalCols = Math.max(BASE_COLS, Math.floor(cw / tile));
  MAP_COLS = totalCols;
  padLeft = Math.floor((totalCols - BASE_COLS) / 2);
  const padRight = totalCols - BASE_COLS - padLeft;

  // Build padded mapData
  mapData = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row = [];
    for (let i = 0; i < padLeft; i++) row.push(0);
    for (let c = 0; c < BASE_COLS; c++) row.push(baseData[r][c]);
    for (let i = 0; i < padRight; i++) row.push(0);
    mapData.push(row);
  }
}

// Mark ~12% of grass tiles as unbuildable rocky terrain (value 4)
function scatterRocks() {
  const grass = [];
  for (let r = 0; r < MAP_ROWS; r++)
    for (let c = 0; c < MAP_COLS; c++)
      if (mapData[r][c] === 0) grass.push({ r, c });
  const count = Math.floor(grass.length * BALANCE.rockDensity);
  for (let i = grass.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grass[i], grass[j]] = [grass[j], grass[i]];
  }
  for (let i = 0; i < count; i++) mapData[grass[i].r][grass[i].c] = 4;
}

padMap();
scatterRocks();

function resize() {
  const rect = canvas.getBoundingClientRect();
  const cw = Math.round(rect.width);
  const ch = Math.round(rect.height);

  // Check if we need to re-pad (column count changed)
  const tileByH = Math.floor(ch / MAP_ROWS);
  const tile = Math.max(tileByH, 18);
  const neededCols = Math.max(BASE_COLS, Math.floor(cw / tile));

  if (neededCols !== MAP_COLS) {
    const oldPadLeft = padLeft;
    padMap();
    scatterRocks();
    // Shift existing tower positions if padding changed
    const padDelta = padLeft - oldPadLeft;
    for (const t of towers) {
      t.col += padDelta;
    }
  }

  TILE = tile;
  W = TILE * MAP_COLS;
  H = TILE * MAP_ROWS;
  canvas.width = W;
  canvas.height = ch;
  GRID_OX = 0;
  GRID_OY = Math.floor((ch - H) / 2);

  buildPath();
  rebuildExtraSpawnPaths();
  for (const t of towers) {
    t.x = t.col * TILE + TILE / 2;
    t.y = t.row * TILE + TILE / 2;
    t.range = TOWER_DEFS[t.type].range * (TILE / 40);
  }
}

const path = [];
function buildPath() {
  path.length = 0;
  let start = null;
  for (let r = 0; r < MAP_ROWS; r++)
    for (let c = 0; c < MAP_COLS; c++)
      if (mapData[r][c] === 2) start = { r, c };

  const visited = new Set();
  const queue = [start];
  visited.add(`${start.r},${start.c}`);
  const parent = {};
  let end = null;

  while (queue.length) {
    const cur = queue.shift();
    if (mapData[cur.r][cur.c] === 3) { end = cur; break; }
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + dr, nc = cur.c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS && !visited.has(key) && (mapData[nr][nc] >= 1 && mapData[nr][nc] <= 3)) {
        visited.add(key);
        parent[key] = cur;
        queue.push({ r: nr, c: nc });
      }
    }
  }

  const pts = [];
  let cur = end;
  while (cur) {
    pts.unshift({ x: cur.c * TILE + TILE / 2, y: cur.r * TILE + TILE / 2 });
    cur = parent[`${cur.r},${cur.c}`];
  }
  path.push(...pts);
}

// --- STATE ---
let gold = BALANCE.startGold, lives = BALANCE.startLives, waveNum = 0, score = 0, level = 1;
let towers = [], enemies = [], bullets = [], particles = [], placeEffects = [];
let floatingTexts = []; // {x, y, text, color, life, maxLife, vy}
let screenShake = { x: 0, y: 0, intensity: 0, decay: 0 };
let lightSources = []; // {x, y, radius, color, life, maxLife}
let trailParticles = []; // lighter-weight particles for bullet trails
let spawnPortal = { active: false, life: 0, maxLife: 0 };
let mapShiftNotification = null;
let mapShiftDelay = 0;
let extraSpawnPoints = []; // [{entryR, entryC, path:[], portalActive, portalLife, portalMaxLife}]
let spawnPointNotification = null; // notification for new spawn point
let evolutionNotification = null; // {life, maxLife, tierName, tierIdx, phase}
let evolutionWaiting = false; // true = evolution screen paused, waiting for tap
let evolutionVFX = []; // per-tower transformation effects {x, y, life, maxLife, oldColor, newColor}
let selectedTower = 'gun';
let selectedPlacedTower = null;
let waveActive = false, waveSpawning = false, spawnQueue = [], spawnTimer = 0;
let gameOver = false;
let lastTime = 0, gameTime = 0;

// --- ATMOSPHERE STATE ---
let currentAtmosphere = copyPalette(ATMOSPHERE_PALETTES[0]);
let fromAtmosphere = null, targetAtmosphere = null;
let atmosphereT = 0, atmosphereLerping = false;
let ambientParticles = [];

function spawnAmbientParticle() {
  if (path.length < 2) return null;
  const idx = Math.floor(Math.random() * (path.length - 1));
  const px = path[idx].x + (Math.random() - 0.5) * TILE * 3;
  const py = path[idx].y + (Math.random() - 0.5) * TILE * 3;
  return {
    x: px, y: py, baseX: px, baseY: py,
    life: 3000 + Math.random() * 5000,
    maxLife: 3000 + Math.random() * 5000,
    phase: Math.random() * Math.PI * 2,
    size: 1 + Math.random() * 2,
  };
}

// --- SOUND ENGINE (Web Audio, procedural) ---
let audioCtx = null;
let soundEnabled = true;
const soundVolume = 0.3;

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { soundEnabled = false; }
}

// Unlock audio on first user interaction (mobile requirement)
function unlockAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

function playTone(freq, duration, type, vol, detune, decay) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);
    gain.gain.setValueAtTime((vol || soundVolume) * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (duration || 0.1));
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + (duration || 0.1));
  } catch(e) {}
}

function playNoise(duration, vol) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const bufSize = Math.floor(audioCtx.sampleRate * (duration || 0.05));
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime((vol || 0.15) * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (duration || 0.05));
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(now);
  } catch(e) {}
}

// Sound effects
const SFX = {
  shoot() {
    playTone(800 + Math.random() * 200, 0.06, 'square', 0.12);
    playNoise(0.03, 0.08);
  },
  shootCannon() {
    playTone(200, 0.15, 'sawtooth', 0.2);
    playNoise(0.1, 0.15);
  },
  shootSniper() {
    playTone(1200, 0.08, 'sine', 0.15);
    playTone(600, 0.12, 'sine', 0.1);
  },
  shootFrost() {
    playTone(1800, 0.1, 'sine', 0.08);
    playTone(2200, 0.08, 'sine', 0.06, 50);
  },
  hit() {
    playTone(300 + Math.random() * 100, 0.05, 'square', 0.06);
  },
  kill() {
    playTone(600, 0.08, 'sine', 0.15);
    playTone(900, 0.12, 'sine', 0.12);
  },
  bossDeath() {
    playTone(200, 0.3, 'sawtooth', 0.2);
    playTone(400, 0.2, 'sine', 0.15);
    playTone(800, 0.15, 'sine', 0.1);
    playNoise(0.2, 0.15);
  },
  place() {
    playTone(500, 0.08, 'sine', 0.15);
    playTone(700, 0.1, 'sine', 0.12);
  },
  upgrade() {
    playTone(600, 0.08, 'sine', 0.15);
    playTone(800, 0.08, 'sine', 0.12);
    playTone(1000, 0.12, 'sine', 0.1);
  },
  waveStart() {
    playTone(400, 0.15, 'sine', 0.15);
    playTone(500, 0.15, 'sine', 0.12);
    playTone(600, 0.2, 'sine', 0.1);
  },
  waveComplete() {
    playTone(600, 0.1, 'sine', 0.15);
    playTone(800, 0.1, 'sine', 0.12);
    playTone(1000, 0.15, 'sine', 0.12);
    playTone(1200, 0.2, 'sine', 0.1);
  },
  levelUp() {
    setTimeout(() => playTone(500, 0.15, 'sine', 0.2), 0);
    setTimeout(() => playTone(700, 0.15, 'sine', 0.18), 100);
    setTimeout(() => playTone(900, 0.15, 'sine', 0.15), 200);
    setTimeout(() => playTone(1200, 0.25, 'sine', 0.2), 300);
  },
  leak() {
    playTone(200, 0.2, 'sawtooth', 0.15);
    playTone(150, 0.25, 'square', 0.1);
  },
  gameOver() {
    setTimeout(() => playTone(400, 0.3, 'sawtooth', 0.2), 0);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.18), 200);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.2), 400);
  },
  cantPlace() {
    playTone(200, 0.1, 'square', 0.1);
  },
  crackTile() {
    playTone(120, 0.25, 'sawtooth', 0.2);
    playNoise(0.15, 0.2);
    setTimeout(() => { playTone(80, 0.3, 'sawtooth', 0.15); playNoise(0.1, 0.12); }, 100);
  },
  pathShift() {
    playTone(300, 0.15, 'sine', 0.15);
    playTone(450, 0.12, 'sine', 0.12);
    setTimeout(() => { playTone(350, 0.2, 'sine', 0.1); playNoise(0.08, 0.08); }, 150);
  },
  newRecord() {
    setTimeout(() => playTone(800, 0.15, 'sine', 0.25), 0);
    setTimeout(() => playTone(1000, 0.15, 'sine', 0.22), 100);
    setTimeout(() => playTone(1200, 0.15, 'sine', 0.2), 200);
    setTimeout(() => playTone(1600, 0.2, 'sine', 0.25), 350);
    setTimeout(() => { playTone(1600, 0.3, 'sine', 0.18); playTone(2000, 0.3, 'sine', 0.15); }, 500);
  },
  evolution() {
    // Dramatic ascending fanfare
    setTimeout(() => { playTone(300, 0.2, 'sawtooth', 0.15); playNoise(0.15, 0.12); }, 0);
    setTimeout(() => playTone(400, 0.2, 'sine', 0.2), 150);
    setTimeout(() => playTone(500, 0.2, 'sine', 0.2), 300);
    setTimeout(() => playTone(600, 0.2, 'sine', 0.22), 450);
    setTimeout(() => { playTone(800, 0.3, 'sine', 0.25); playTone(1200, 0.3, 'sine', 0.15); }, 600);
    setTimeout(() => { playTone(1000, 0.4, 'sine', 0.2); playTone(1500, 0.35, 'sine', 0.15); playNoise(0.2, 0.1); }, 800);
  },
};

// --- HUD ---
function updateHUD() {
  document.getElementById('gold').textContent = gold;
  document.getElementById('lives').textContent = lives;
  document.getElementById('world-name').textContent = WORLDS[currentWorldIdx].name;
  document.getElementById('level').textContent = level;
  document.getElementById('wave').textContent = waveNum;
  document.getElementById('score').textContent = score;
  document.querySelectorAll('.tower-btn').forEach(btn => {
    const cost = TOWER_DEFS[btn.dataset.type].cost;
    btn.classList.toggle('unaffordable', gold < cost);
  });
}

// --- UI ---
document.querySelectorAll('.tower-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTower = btn.dataset.type;
    selectedPlacedTower = null;
  });
});

// --- SPEED & AUTO ---
let gameSpeed = 1;
let autoMode = true;

document.getElementById('speed-btn').addEventListener('click', e => {
  e.preventDefault();
  if (gameSpeed === 1) gameSpeed = 2;
  else if (gameSpeed === 2) gameSpeed = 3;
  else if (gameSpeed === 3) gameSpeed = 4;
  else gameSpeed = 1;
  document.getElementById('speed-btn').textContent = gameSpeed + 'X';
});

document.getElementById('auto-btn').addEventListener('click', e => {
  e.preventDefault();
  autoMode = !autoMode;
  const btn = document.getElementById('auto-btn');
  btn.textContent = autoMode ? 'AUTO' : 'MANUAL';
  btn.classList.toggle('active', autoMode);
  if (autoMode && !waveActive && !gameOver) startWave();
});

document.getElementById('sound-btn').addEventListener('click', e => {
  e.preventDefault();
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-btn');
  btn.textContent = soundEnabled ? '\u{1F50A}' : '\u{1F507}';
  btn.classList.toggle('active', soundEnabled);
});

// --- RECORDS MODAL ---
function openRecords() {
  const overlay = document.getElementById('records-overlay');
  const list = document.getElementById('records-list');
  const scores = loadBestScores();
  list.innerHTML = '';
  for (const w of WORLDS) {
    const row = document.createElement('div');
    row.className = 'record-row';
    const name = document.createElement('span');
    name.className = 'record-world';
    name.textContent = w.name;
    const sc = document.createElement('span');
    if (scores[w.name]) {
      sc.className = 'record-score';
      sc.textContent = scores[w.name];
    } else {
      sc.className = 'record-score empty';
      sc.textContent = '---';
    }
    row.appendChild(name);
    row.appendChild(sc);
    list.appendChild(row);
  }
  overlay.classList.add('show');
}

document.querySelector('#top-bar h1').addEventListener('click', e => {
  e.preventDefault();
  openRecords();
});
document.querySelector('#top-bar h1').style.cursor = 'pointer';

document.getElementById('close-records-btn').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('records-overlay').classList.remove('show');
});

document.getElementById('records-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    document.getElementById('records-overlay').classList.remove('show');
  }
});

document.getElementById('clear-records-btn').addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('tawer_best');
  openRecords(); // refresh the list
});

// --- HOVER / TOUCH PREVIEW STATE ---
let hoverCol = -1, hoverRow = -1;

function updateHover(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  const mx = (cx - rect.left) * (canvas.width / rect.width) - GRID_OX;
  const my = (cy - rect.top) * (canvas.height / rect.height) - GRID_OY;
  hoverCol = Math.floor(mx / TILE);
  hoverRow = Math.floor(my / TILE);
}

function clearHover() { hoverCol = -1; hoverRow = -1; }

canvas.addEventListener('mousemove', updateHover);
canvas.addEventListener('mouseleave', clearHover);
canvas.addEventListener('touchmove', e => { e.preventDefault(); updateHover(e); }, { passive: false });
canvas.addEventListener('touchend', () => { setTimeout(clearHover, 300); });

// --- CANVAS TAP ---
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (cx - rect.left) * (canvas.width / rect.width) - GRID_OX,
    y: (cy - rect.top) * (canvas.height / rect.height) - GRID_OY,
  };
}

function handleTap(e) {
  e.preventDefault();
  if (gameOver) return;
  // Dismiss evolution screen on tap
  if (evolutionWaiting) {
    evolutionWaiting = false;
    return;
  }
  const pos = getCanvasPos(e);
  const col = Math.floor(pos.x / TILE);
  const row = Math.floor(pos.y / TILE);
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return;

  const existing = towers.find(t => t.col === col && t.row === row);
  if (existing) {
    const baseDef = TOWER_DEFS[existing.type];
    const upgradeCost = Math.floor(baseDef.cost * BALANCE.upgradeCostRatio);
    if (existing.level < BALANCE.maxTowerLevel && gold >= upgradeCost) {
      gold -= upgradeCost;
      existing.level++;
      SFX.upgrade();
      existing.damage = baseDef.damage * (1 + BALANCE.upgradeDamageBonus * (existing.level - 1));
      existing.range = baseDef.range * (TILE / 40) * (1 + BALANCE.upgradeRangeBonus * (existing.level - 1));
      existing.rate = baseDef.rate * Math.pow(BALANCE.upgradeRateMultiplier, existing.level - 1);
      // Upgrade VFX
      placeEffects.push({ x: existing.x, y: existing.y, life: 400, maxLife: 400, color: baseDef.color, range: existing.range });
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8;
        particles.push({ x: existing.x, y: existing.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 400, color: '#ffd700', size: TILE * 0.06 });
      }
      selectedPlacedTower = existing;
      updateHUD();
    } else {
      selectedPlacedTower = (selectedPlacedTower === existing) ? null : existing;
    }
    return;
  }

  selectedPlacedTower = null;
  if (mapData[row][col] !== 0) { SFX.cantPlace(); return; }
  const def = TOWER_DEFS[selectedTower];
  if (gold < def.cost) { SFX.cantPlace(); return; }

  gold -= def.cost;
  const tx = col * TILE + TILE / 2;
  const ty = row * TILE + TILE / 2;
  SFX.place();
  towers.push({
    type: selectedTower, col, row,
    x: tx, y: ty,
    lastFire: 0, angle: 0,
    level: 1,
    recoil: 0,
    muzzleFlash: 0,
    scannerAngle: 0,
    smokeTimer: 0,
    crystalPhase: Math.random() * Math.PI * 2,
    ...def,
    range: def.range * (TILE / 40),
  });
  // Placement VFX
  placeEffects.push({ x: tx, y: ty, life: 400, maxLife: 400, color: def.color, range: def.range * (TILE / 40) });
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 2 * i / 10;
    particles.push({ x: tx, y: ty, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, life: 500, color: def.color, size: TILE * 0.08 });
  }
  updateHUD();
}

canvas.addEventListener('touchstart', handleTap, { passive: false });
canvas.addEventListener('click', handleTap);
document.addEventListener('gesturestart', e => e.preventDefault());

// --- CHEAT KEYS ---
document.addEventListener('keydown', e => {
  if (e.key === 'k' || e.key === 'K') {
    for (const en of enemies) {
      if (en.alive) damageEnemy(en, en.hp, 0);
    }
  }
  if (e.key === 'g' || e.key === 'G') {
    gold += 1000;
    updateHUD();
  }
  if (e.key === 'l' || e.key === 'L') {
    levelUp();
  }
});

// --- EXTRA SPAWN POINTS: from level 2+, enemies enter from additional map edges ---

function buildPathFromEdge(startR, startC) {
  // Find adjacent path tile (the junction where this spawn merges onto the trail)
  let adjR = -1, adjC = -1;
  for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
    const nr = startR + dr, nc = startC + dc;
    if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
      const v = mapData[nr][nc];
      if (v >= 1 && v <= 3) { adjR = nr; adjC = nc; break; }
    }
  }
  if (adjR < 0) return null;

  // Find exit tile
  let exitR = -1, exitC = -1;
  for (let r = 0; r < MAP_ROWS; r++)
    for (let c = 0; c < MAP_COLS; c++)
      if (mapData[r][c] === 3) { exitR = r; exitC = c; }
  if (exitR < 0) return null;

  // BFS from adjacent path tile to exit, traversing ONLY path tiles (1,2,3)
  const visited = new Set();
  const prev = new Map();
  const jKey = `${adjR},${adjC}`;
  visited.add(jKey);
  const queue = [{ r: adjR, c: adjC }];

  while (queue.length) {
    const cur = queue.shift();
    if (cur.r === exitR && cur.c === exitC) break;
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + dr, nc = cur.c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS && !visited.has(key)) {
        const v = mapData[nr][nc];
        if (v >= 1 && v <= 3) {
          visited.add(key);
          prev.set(key, cur);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  const endKey = `${exitR},${exitC}`;
  if (!prev.has(endKey) && !(adjR === exitR && adjC === exitC)) return null;

  // Trace path from exit back to junction
  const pts = [];
  let cur = { r: exitR, c: exitC };
  while (cur) {
    pts.unshift({ x: cur.c * TILE + TILE / 2, y: cur.r * TILE + TILE / 2 });
    const p = prev.get(`${cur.r},${cur.c}`);
    cur = p || null;
  }

  // Prepend the edge entry point (spawn location)
  pts.unshift({ x: startC * TILE + TILE / 2, y: startR * TILE + TILE / 2 });

  return pts.length >= 3 ? pts : null;
}

function findExtraSpawnCandidates() {
  const candidates = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      // Must be on the edge of the map
      if (r !== 0 && r !== MAP_ROWS - 1 && c !== 0 && c !== MAP_COLS - 1) continue;
      // Must not be an existing path/start/end tile
      const v = mapData[r][c];
      if (v >= 1 && v <= 3) continue;
      // Must not overlap an existing extra spawn
      if (extraSpawnPoints.some(esp => esp.entryR === r && esp.entryC === c)) continue;
      // Must be directly adjacent to a path tile (so mobs step onto trail immediately)
      let adjPath = false;
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
          const nv = mapData[nr][nc];
          if (nv >= 1 && nv <= 3) { adjPath = true; break; }
        }
      }
      if (adjPath) candidates.push({ r, c });
    }
  }
  return candidates;
}

function addExtraSpawnPoint() {
  const candidates = findExtraSpawnCandidates();
  if (candidates.length === 0) return;

  // Shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const cand of candidates) {
    const ePath = buildPathFromEdge(cand.r, cand.c);
    if (ePath) {
      extraSpawnPoints.push({
        entryR: cand.r, entryC: cand.c,
        path: ePath,
        portalActive: false, portalLife: 0, portalMaxLife: 0,
      });

      // VFX: dramatic announcement
      const ex = cand.c * TILE + TILE / 2;
      const ey = cand.r * TILE + TILE / 2;
      placeEffects.push({ x: ex, y: ey, life: 1500, maxLife: 1500, color: '#ff4444', range: TILE * 2.5 });
      lightSources.push({ x: ex, y: ey, radius: TILE * 5, color: '#ff2244', life: 1200, maxLife: 1200 });
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 2.5;
        particles.push({ x: ex, y: ey, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life: 700, color: i%2===0?'#ff4444':'#ff8844', size: TILE * 0.06 });
      }
      screenShake.intensity = Math.max(screenShake.intensity, 5);
      screenShake.decay = Math.max(screenShake.decay, 400);
      SFX.crackTile();
      return;
    }
  }
}

function rebuildExtraSpawnPaths() {
  // Rebuild extra spawn paths after resize (TILE changed)
  for (const esp of extraSpawnPoints) {
    const newPath = buildPathFromEdge(esp.entryR, esp.entryC);
    if (newPath) esp.path = newPath;
  }
}

// --- TOWER EVOLUTION ---
function refreshTowerBar() {
  document.querySelectorAll('.tower-btn').forEach(btn => {
    const type = btn.dataset.type;
    const def = TOWER_DEFS[type];
    if (!def) return;
    const nameEl = btn.querySelector('.tname');
    const costEl = btn.querySelector('.cost');
    if (nameEl) nameEl.textContent = def.name || type.toUpperCase();
    if (costEl) costEl.textContent = def.cost + 'g';
    // Redraw icon
    const cvs = btn.querySelector('.icon-canvas');
    if (cvs && typeof drawTowerIcon === 'function') drawTowerIcon(cvs, type);
  });
  updateHUD();
}

function evolveTowers() {
  const newTierIdx = currentTier + 1;
  if (newTierIdx >= TOWER_TIERS.length) return;

  const oldDefs = Object.assign({}, TOWER_DEFS);
  const newTier = TOWER_TIERS[newTierIdx];
  currentTier = newTierIdx;

  // Swap global TOWER_DEFS
  for (const type of ['gun', 'cannon', 'sniper', 'frost']) {
    TOWER_DEFS[type] = newTier.defs[type];
  }

  // Transform all existing towers
  for (const t of towers) {
    const oldColor = t.color;
    const newDef = TOWER_DEFS[t.type];

    // Spawn evolution VFX on each tower
    evolutionVFX.push({
      x: t.x, y: t.y, life: 1500, maxLife: 1500,
      oldColor: oldColor, newColor: newDef.color,
    });

    // Reset tower to level 1 with new tier stats
    t.level = 1;
    t.damage = newDef.damage;
    t.range = newDef.range * (TILE / 40);
    t.rate = newDef.rate;
    t.color = newDef.color;
    t.bullet = newDef.bullet;
    t.bulletSpeed = newDef.bulletSpeed;
    t.splash = newDef.splash;
    t.slow = newDef.slow || 0;
    t.cost = newDef.cost;

    // VFX per tower — big particle burst
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3;
      particles.push({
        x: t.x, y: t.y,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 600 + Math.random() * 400,
        color: i % 2 === 0 ? oldColor : newDef.color,
        size: TILE * (0.05 + Math.random() * 0.06)
      });
    }
    // Light flash
    lightSources.push({ x: t.x, y: t.y, radius: TILE * 3, color: newDef.color, life: 600, maxLife: 600 });
  }

  // Global VFX
  screenShake.intensity = Math.max(screenShake.intensity, 8);
  screenShake.decay = Math.max(screenShake.decay, 600);
  SFX.evolution();

  // Show evolution notification — wait for player tap
  evolutionNotification = {
    life: 5000, maxLife: 5000,
    tierName: newTier.tierName,
    tierIdx: newTierIdx,
  };
  evolutionWaiting = true;

  // Refresh tower bar UI
  refreshTowerBar();
}

// --- WAVES ---
function startWave() {
  if (waveActive || gameOver) return;
  waveNum++;
  waveActive = true;
  waveSpawning = true;
  spawnTimer = 0;
  SFX.waveStart();

  // Spawn portal effect
  spawnPortal.active = true;
  spawnPortal.maxLife = 3000 + waveNum * 200;
  spawnPortal.life = spawnPortal.maxLife;

  const baseCount = waveNum === 1 ? BALANCE.wave1Count : Math.floor((BALANCE.countBase + Math.floor(waveNum * BALANCE.countLinear + Math.pow(waveNum, BALANCE.countExponent))) * BALANCE.countMultiplier);
  const hp = (waveNum === 1 ? BALANCE.wave1Hp : BALANCE.hpBase + waveNum * BALANCE.hpLinear + Math.pow(waveNum, BALANCE.hpExponentBase + Math.min(waveNum * BALANCE.hpExponentRamp, BALANCE.hpExponentCap))) * BALANCE.hpMultiplier;
  const baseSpeed = (waveNum === 1 ? BALANCE.wave1Speed : (BALANCE.speedBase + Math.min(waveNum * BALANCE.speedScaling, BALANCE.speedCap)) * BALANCE.speedMultiplier) * (TILE / 40);
  const reward = BALANCE.rewardBase * BALANCE.rewardMultiplier;

  spawnQueue = [];

  // Wave composition varies by wave number
  const comp = getWaveComposition(waveNum, baseCount);
  for (const entry of comp) {
    const et = ENEMY_TYPES[entry.type];
    spawnQueue.push({
      hp: Math.round(hp * et.hpMul),
      maxHp: Math.round(hp * et.hpMul),
      speed: baseSpeed * et.speedMul,
      reward: Math.round(reward * et.rewardMul),
      radius: entry.type === 'boss' ? TILE * 0.32 : (entry.type === 'swarm' ? TILE * 0.12 : TILE * 0.17),
      isBoss: entry.type === 'boss',
      slowTimer: 0,
      enemyType: entry.type,
    });
  }
  updateHUD();
  document.getElementById('start-btn').disabled = true;
}

function getWaveComposition(wave, count) {
  const comp = [];
  // Available types unlock progressively
  const types = ['grunt'];
  if (wave >= 3) types.push('runner');
  if (wave >= 5) types.push('tank');
  if (wave >= 7) types.push('swarm');
  if (wave >= 9) types.push('healer');

  for (let i = 0; i < count; i++) {
    comp.push({ type: types[i % types.length] });
  }
  // Boss every N waves
  if (wave % BALANCE.bossEvery === 0) comp.push({ type: 'boss' });
  // Double boss every N waves
  if (wave % BALANCE.doubleBossEvery === 0) comp.push({ type: 'boss' });
  return comp;
}

document.getElementById('start-btn').addEventListener('click', e => { e.preventDefault(); startWave(); });

function spawnEnemy(t) {
  // Decide which spawn point to use
  // Main path always gets enemies; extra paths get a portion
  let usePath = path;
  if (extraSpawnPoints.length > 0 && Math.random() < 0.35 * Math.min(extraSpawnPoints.length, 3)) {
    const esp = extraSpawnPoints[Math.floor(Math.random() * extraSpawnPoints.length)];
    if (esp.path && esp.path.length >= 2) {
      usePath = esp.path;
      // Activate this spawn's portal
      esp.portalActive = true;
      esp.portalMaxLife = 2000;
      esp.portalLife = esp.portalMaxLife;
    }
  }
  enemies.push({ ...t, x: usePath[0].x, y: usePath[0].y, pathIdx: 0, alive: true, hitFlash: 0, usePath });
}

// --- UPDATE ---
function update(dt, ts) {
  if (waveSpawning && spawnQueue.length > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy(spawnQueue.shift());
      spawnTimer = Math.max(BALANCE.spawnIntervalMin, BALANCE.spawnInterval - waveNum * BALANCE.spawnIntervalScaling);
      if (spawnQueue.length === 0) waveSpawning = false;
    }
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    const ePath = e.usePath || path;
    const target = ePath[e.pathIdx + 1];
    if (!target) { e.alive = false; lives--; SFX.leak(); updateHUD(); if (lives <= 0) endGame(); continue; }
    const dx = target.x - e.x, dy = target.y - e.y;
    const dist = Math.hypot(dx, dy);
    const spd = (e.slowTimer > 0 ? e.speed * BALANCE.slowFactor : e.speed) * gameSpeed;
    if (dist < spd * 2) e.pathIdx++;
    else { e.x += (dx / dist) * spd; e.y += (dy / dist) * spd; }
    if (e.slowTimer > 0) e.slowTimer -= dt;
  }

  for (const t of towers) {
    // Decay recoil and muzzle flash
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 0.008);
    if (t.muzzleFlash > 0) t.muzzleFlash = Math.max(0, t.muzzleFlash - dt * 0.01);

    // Animated tower state
    t.scannerAngle = (t.scannerAngle || 0) + dt * 0.003;
    t.smokeTimer = (t.smokeTimer || 0) + dt;
    t.crystalPhase = (t.crystalPhase || 0) + dt * 0.002;

    // Cannon L3 idle smoke wisps
    if (t.type === 'cannon' && (t.level || 1) >= 3 && t.smokeTimer > 3000) {
      t.smokeTimer = 0;
      const smokeX = t.x + Math.cos(t.angle) * TILE * 0.35;
      const smokeY = t.y + Math.sin(t.angle) * TILE * 0.35;
      for (let si = 0; si < 2; si++) {
        trailParticles.push({
          x: smokeX + (Math.random() - 0.5) * TILE * 0.1,
          y: smokeY + (Math.random() - 0.5) * TILE * 0.1,
          life: 800, maxLife: 800,
          color: '#88888866', size: TILE * 0.05
        });
      }
    }

    let closest = null, closestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d < t.range && d < closestDist) { closest = e; closestDist = d; }
    }
    if (closest) {
      t.angle = Math.atan2(closest.y - t.y, closest.x - t.x);
      if (ts - t.lastFire >= t.rate) {
        t.lastFire = ts;
        const sfxType = t.type === 'cannon' ? 'shootCannon' : t.type === 'sniper' ? 'shootSniper' : t.type === 'frost' ? 'shootFrost' : 'shoot';
        if (SFX[sfxType]) SFX[sfxType]();

        // Recoil and muzzle flash
        t.recoil = 1;
        t.muzzleFlash = 1;

        // Muzzle flash light source
        const muzzleX = t.x + Math.cos(t.angle) * TILE * 0.45;
        const muzzleY = t.y + Math.sin(t.angle) * TILE * 0.45;
        lightSources.push({ x: muzzleX, y: muzzleY, radius: TILE * (t.type === 'cannon' ? 2.5 : t.type === 'sniper' ? 2.0 : 1.2), color: t.color, life: 120, maxLife: 120 });

        // Muzzle sparks
        const sparkCount = t.type === 'cannon' ? 6 : t.type === 'sniper' ? 4 : 2;
        for (let i = 0; i < sparkCount; i++) {
          const spread = (Math.random() - 0.5) * 0.8;
          const spd = 1.5 + Math.random() * 2;
          particles.push({
            x: muzzleX, y: muzzleY,
            vx: Math.cos(t.angle + spread) * spd,
            vy: Math.sin(t.angle + spread) * spd,
            life: 150 + Math.random() * 100, color: t.type === 'frost' ? '#aaeeff' : '#ffdd88', size: TILE * 0.04
          });
        }

        bullets.push({
          x: t.x, y: t.y, tx: closest.x, ty: closest.y, target: closest,
          speed: t.bulletSpeed * (TILE / 40), damage: t.damage, color: t.bullet,
          splash: t.splash * (TILE / 40), slow: t.slow || 0, alive: true,
          towerType: t.type, trailTimer: 0,
        });
      }
    }
  }

  for (const b of bullets) {
    if (!b.alive) continue;
    const tx = b.target.alive ? b.target.x : b.tx;
    const ty = b.target.alive ? b.target.y : b.ty;
    const dx = tx - b.x, dy = ty - b.y;
    const dist = Math.hypot(dx, dy);
    const bSpd = b.speed * gameSpeed;

    // Bullet trail particles
    b.trailTimer = (b.trailTimer || 0) + dt;
    if (b.trailTimer > 16) {
      b.trailTimer = 0;
      if (b.towerType === 'frost') {
        trailParticles.push({ x: b.x + (Math.random()-0.5)*3, y: b.y + (Math.random()-0.5)*3, life: 200, maxLife: 200, color: '#aaddff', size: TILE * 0.035 });
      } else if (b.towerType === 'cannon') {
        trailParticles.push({ x: b.x + (Math.random()-0.5)*4, y: b.y + (Math.random()-0.5)*4, life: 180, maxLife: 180, color: '#ff9944', size: TILE * 0.05 });
      } else if (b.towerType === 'sniper') {
        trailParticles.push({ x: b.x, y: b.y, life: 100, maxLife: 100, color: '#cc88ff', size: TILE * 0.025 });
      } else {
        trailParticles.push({ x: b.x + (Math.random()-0.5)*2, y: b.y + (Math.random()-0.5)*2, life: 120, maxLife: 120, color: '#88ffbb', size: TILE * 0.03 });
      }
    }

    if (dist < bSpd * 2) {
      b.alive = false;
      if (b.target.alive) {
        damageEnemy(b.target, b.damage, b.slow);

        // Impact light source
        lightSources.push({ x: tx, y: ty, radius: TILE * (b.splash > 0 ? 3.0 : 1.5), color: b.color, life: 200, maxLife: 200 });

        if (b.splash > 0) {
          // Cannon splash — shockwave ring + more particles
          for (const e of enemies)
            if (e !== b.target && e.alive && Math.hypot(e.x - b.target.x, e.y - b.target.y) < b.splash)
              damageEnemy(e, b.damage * BALANCE.splashDamageRatio, 0);
          // Shockwave ring effect
          placeEffects.push({ x: tx, y: ty, life: 350, maxLife: 350, color: '#ff8833', range: b.splash * 1.2 });
          // Lots of particles
          for (let i = 0; i < 14; i++) {
            const a = Math.random()*Math.PI*2;
            const spd = 1 + Math.random() * 3;
            particles.push({x:tx,y:ty,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:350+Math.random()*200,color: i%3===0?'#ffcc44':'#ff6622',size:TILE*(0.05+Math.random()*0.05)});
          }
          // Smoke particles
          for (let i = 0; i < 5; i++) {
            const a = Math.random()*Math.PI*2;
            particles.push({x:tx,y:ty,vx:Math.cos(a)*0.5,vy:Math.sin(a)*0.5-0.3,life:500,color:'#44444488',size:TILE*0.08});
          }
          // Screen shake for cannon
          screenShake.intensity = Math.max(screenShake.intensity, 3);
          screenShake.decay = 200;
        }

        // Frost impact ring
        if (b.slow > 0 && b.target.alive) {
          placeEffects.push({ x: tx, y: ty, life: 300, maxLife: 300, color: '#66ddff', range: TILE * 0.8 });
          for (let i = 0; i < 6; i++) {
            const a = Math.random()*Math.PI*2;
            trailParticles.push({x:tx+Math.cos(a)*TILE*0.2,y:ty+Math.sin(a)*TILE*0.2, life:400,maxLife:400,color:'#cceeFF',size:TILE*0.04});
          }
        }
      }
      // Standard impact sparks
      for (let i = 0; i < 5; i++) {
        const a = Math.random()*Math.PI*2;
        particles.push({x:b.x,y:b.y,vx:Math.cos(a)*1.5+((Math.random()-0.5)),vy:Math.sin(a)*1.5+((Math.random()-0.5)),life:200+Math.random()*100,color:b.color,size:TILE*0.04});
      }
    } else { b.x += (dx/dist)*bSpd; b.y += (dy/dist)*bSpd; }
  }

  for (const p of particles) { p.x += p.vx * gameSpeed; p.y += p.vy * gameSpeed; p.life -= dt; }
  for (const pe of placeEffects) pe.life -= dt;

  // Trail particles fade
  for (const tp of trailParticles) tp.life -= dt;
  trailParticles = trailParticles.filter(tp => tp.life > 0);

  // Light sources fade
  for (const ls of lightSources) ls.life -= dt;
  lightSources = lightSources.filter(ls => ls.life > 0);

  // Floating texts rise and fade
  for (const ft of floatingTexts) { ft.y += ft.vy * gameSpeed; ft.life -= dt; }
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);

  // Screen shake decay
  if (screenShake.intensity > 0) {
    screenShake.decay -= dt;
    if (screenShake.decay <= 0) { screenShake.intensity = 0; screenShake.x = 0; screenShake.y = 0; }
    else {
      screenShake.x = (Math.random() - 0.5) * 2 * screenShake.intensity;
      screenShake.y = (Math.random() - 0.5) * 2 * screenShake.intensity;
      screenShake.intensity *= 0.92;
    }
  }

  // Enemy hit flash decay
  for (const e of enemies) { if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt * 0.008); }

  // Frost trail on slowed enemies
  for (const e of enemies) {
    if (!e.alive || e.slowTimer <= 0) continue;
    if (Math.random() < 0.15) {
      trailParticles.push({
        x: e.x + (Math.random()-0.5) * e.radius,
        y: e.y + (Math.random()-0.5) * e.radius,
        life: 300, maxLife: 300,
        color: '#88ddff', size: TILE * 0.03
      });
    }
  }

  // Spawn portal effect
  if (spawnPortal.active) {
    spawnPortal.life -= dt;
    if (spawnPortal.life <= 0) spawnPortal.active = false;
  }

  enemies = enemies.filter(e => e.alive);
  bullets = bullets.filter(b => b.alive);
  particles = particles.filter(p => p.life > 0);
  placeEffects = placeEffects.filter(pe => pe.life > 0);

  // Cap arrays for mobile performance
  if (particles.length > 150) particles.length = 150;
  if (trailParticles.length > 100) trailParticles.length = 100;
  if (lightSources.length > 20) lightSources.length = 20;

  // Extra spawn portals
  for (const esp of extraSpawnPoints) {
    if (esp.portalActive) {
      esp.portalLife -= dt;
      if (esp.portalLife <= 0) esp.portalActive = false;
    }
  }

  // Spawn point notification
  if (spawnPointNotification) {
    spawnPointNotification.life -= dt;
    if (spawnPointNotification.life <= 0) spawnPointNotification = null;
  }

  // Evolution VFX
  for (const ev of evolutionVFX) ev.life -= dt;
  evolutionVFX = evolutionVFX.filter(ev => ev.life > 0);

  // Evolution notification — pause countdown while waiting for tap
  if (evolutionNotification) {
    if (!evolutionWaiting) {
      evolutionNotification.life -= dt;
      if (evolutionNotification.life <= 0) evolutionNotification = null;
    } else {
      // Pin life at ~80% so it stays fully visible (past fade-in)
      evolutionNotification.life = Math.min(evolutionNotification.life, evolutionNotification.maxLife * 0.8);
    }
  }

  if (waveActive && !waveSpawning && spawnQueue.length === 0 && enemies.length === 0) {
    waveActive = false;
    gold += BALANCE.waveGoldBase + Math.floor(waveNum * BALANCE.waveGoldScaling);
    SFX.waveComplete();
    updateHUD();
    document.getElementById('start-btn').disabled = false;
    // Level up every 10 waves
    if (waveNum > 0 && waveNum % BALANCE.levelUpWaves === 0) {
      levelUp();
    } else if (autoMode) {
      startWave();
    }
  }

  // Update level-up notification
  if (mapShiftNotification) {
    mapShiftNotification.life -= dt;
    if (mapShiftNotification.life <= 0) mapShiftNotification = null;
  }

  // Level-up delay — start next wave when it expires (paused during evolution wait)
  if (mapShiftDelay > 0 && !evolutionWaiting) {
    mapShiftDelay -= dt;
    if (mapShiftDelay <= 0) {
      mapShiftDelay = 0;
      if (autoMode && !waveActive && !gameOver) startWave();
    }
  }

  // Atmosphere lerp
  if (atmosphereLerping) {
    atmosphereT += dt / 2000;
    if (atmosphereT >= 1) {
      atmosphereT = 1;
      atmosphereLerping = false;
      currentAtmosphere = copyPalette(targetAtmosphere);
    } else {
      currentAtmosphere = lerpPalette(fromAtmosphere, targetAtmosphere, atmosphereT);
    }
  }

  // Ambient particles — more at higher levels
  const maxAmbient = 15 + Math.min(level - 1, 9) * 5;
  while (ambientParticles.length < maxAmbient) {
    const p = spawnAmbientParticle();
    if (p) ambientParticles.push(p); else break;
  }
  for (const ap of ambientParticles) {
    ap.life -= dt;
    ap.x = ap.baseX + Math.sin(ap.phase + gameTime * 0.0008) * TILE * 0.5;
    ap.y = ap.baseY + Math.cos(ap.phase * 1.3 + gameTime * 0.0006) * TILE * 0.3;
  }
  ambientParticles = ambientParticles.filter(ap => ap.life > 0);
}

function levelUp() {
  level++;
  SFX.levelUp();
  const palIdx = Math.min(level - 1, ATMOSPHERE_PALETTES.length - 1);
  const bonus = BALANCE.levelUpGoldBase + level * BALANCE.levelUpGoldScaling;
  gold += bonus;
  lives = Math.min(lives + BALANCE.livesPerLevelUp, BALANCE.maxLives);
  // Trigger atmosphere transition
  fromAtmosphere = copyPalette(currentAtmosphere);
  targetAtmosphere = copyPalette(ATMOSPHERE_PALETTES[palIdx]);
  atmosphereT = 0;
  atmosphereLerping = true;
  // Add extra spawn point on level-up (from level 2+)
  if (level >= 2) {
    setTimeout(() => {
      if (!gameOver) {
        addExtraSpawnPoint();
        spawnPointNotification = { life: 2500, maxLife: 2500 };
      }
    }, 1500);
  }
  updateHUD();
  const palName = ATMOSPHERE_PALETTES[palIdx].name;
  const hasNewSpawn = level >= 2;
  mapShiftNotification = { life: 4500, maxLife: 4500, level, bonus, palName, hasNewSpawn };
  mapShiftDelay = 4500;

  // Tower evolution at specific levels
  if (EVOLUTION_LEVELS.includes(level)) {
    setTimeout(() => {
      if (!gameOver) evolveTowers();
    }, 2000); // after spawn point appears, dramatic reveal
    mapShiftDelay = Math.max(mapShiftDelay, 7000); // extend pause for evolution
  }
}

function damageEnemy(e, dmg, slow) {
  e.hp -= dmg;
  if (slow > 0) e.slowTimer = BALANCE.slowDuration;

  // Hit flash
  e.hitFlash = 1;

  if (e.hp <= 0) {
    e.alive = false; gold += e.reward; score += e.reward; updateHUD();

    // Floating gold text
    floatingTexts.push({
      x: e.x, y: e.y - e.radius * 1.5,
      text: `+${e.reward}g`, color: '#ffd700',
      life: 800, maxLife: 800, vy: -0.8
    });

    // Death light source
    const deathRadius = e.isBoss ? TILE * 5 : TILE * 2;
    const et = ENEMY_TYPES[e.enemyType] || ENEMY_TYPES.grunt;
    lightSources.push({ x: e.x, y: e.y, radius: deathRadius, color: et.color, life: 400, maxLife: 400 });

    if (e.isBoss) {
      SFX.bossDeath();
      // Boss death: massive explosion
      screenShake.intensity = 8;
      screenShake.decay = 500;
      // Big ring
      placeEffects.push({ x: e.x, y: e.y, life: 600, maxLife: 600, color: '#ff4444', range: TILE * 3 });
      placeEffects.push({ x: e.x, y: e.y, life: 800, maxLife: 800, color: '#ffd700', range: TILE * 2 });
      // Lots of particles
      for (let i = 0; i < 30; i++) {
        const a = Math.random()*Math.PI*2;
        const spd = 1 + Math.random() * 4;
        const colors = ['#ff4444', '#ff8833', '#ffd700', '#ffee88', '#ffffff'];
        particles.push({x:e.x,y:e.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:500+Math.random()*400,color:colors[Math.floor(Math.random()*colors.length)],size:TILE*(0.06+Math.random()*0.08)});
      }
      // Embers that float up
      for (let i = 0; i < 12; i++) {
        particles.push({x:e.x+(Math.random()-0.5)*TILE,y:e.y+(Math.random()-0.5)*TILE,vx:(Math.random()-0.5)*0.5,vy:-1-Math.random()*1.5,life:800+Math.random()*600,color:'#ffaa44',size:TILE*0.04});
      }
    } else {
      SFX.kill();
      // Type-specific death effects
      const pCount = e.enemyType === 'swarm' ? 4 : (e.enemyType === 'tank' ? 10 : 6);
      const deathColors = e.enemyType === 'runner' ? ['#ffaa22','#ffcc44','#ff8800'] :
                          e.enemyType === 'tank' ? ['#7788cc','#99aadd','#5566aa','#aabbee'] :
                          e.enemyType === 'swarm' ? ['#dd55dd','#ff88ff'] :
                          e.enemyType === 'healer' ? ['#44eebb','#88ffdd','#22cc99'] :
                          ['#ffd700','#ffee88','#ffcc44'];
      for (let i = 0; i < pCount; i++) {
        const a = Math.random()*Math.PI*2;
        const spd = 0.8 + Math.random() * 2;
        particles.push({x:e.x,y:e.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:300+Math.random()*200,color:deathColors[Math.floor(Math.random()*deathColors.length)],size:TILE*(0.04+Math.random()*0.04)});
      }
      // Tank: armor shard particles
      if (e.enemyType === 'tank') {
        for (let i = 0; i < 4; i++) {
          const a = Math.random()*Math.PI*2;
          particles.push({x:e.x,y:e.y,vx:Math.cos(a)*2.5,vy:Math.sin(a)*2.5-0.5,life:500,color:'#8899bb',size:TILE*0.07});
        }
        screenShake.intensity = Math.max(screenShake.intensity, 2);
        screenShake.decay = Math.max(screenShake.decay, 150);
      }
    }
  }
}

function endGame() {
  gameOver = true;
  SFX.gameOver();
  const overlay = document.getElementById('game-over-overlay');
  const title = document.getElementById('end-title');
  const msg = document.getElementById('end-msg');
  const recordScore = document.getElementById('record-score');
  const recordStars = document.getElementById('record-stars');
  recordScore.className = ''; recordScore.textContent = '';
  recordStars.className = ''; recordStars.textContent = '';
  overlay.classList.add('show');
  title.textContent = 'DEFEATED'; title.className = ''; title.style.color = '';
  msg.textContent = `Score: ${score} \u00b7 ${WORLDS[currentWorldIdx].name} \u00b7 Level ${level} \u00b7 Wave ${waveNum}`;
  const worldName = WORLDS[currentWorldIdx].name;
  const isRecord = saveBestScore(worldName, score);
  if (isRecord && score > 0) {
    setTimeout(() => {
      SFX.newRecord();
      title.textContent = 'NEW RECORD!';
      title.className = 'record';
      recordStars.textContent = '\u2605 \u2605 \u2605';
      recordStars.className = 'show';
      recordScore.textContent = score;
      recordScore.className = 'show';
      msg.textContent = `${worldName} \u00b7 Level ${level} \u00b7 Wave ${waveNum}`;
      msg.style.color = '#8899aa';
    }, 1000);
  }
}

document.getElementById('restart-btn').addEventListener('click', e => {
  e.preventDefault();
  gold = BALANCE.startGold; lives = BALANCE.startLives; waveNum = 0; score = 0; level = 1;
  towers = []; enemies = []; bullets = []; particles = []; placeEffects = [];
  floatingTexts = []; lightSources = []; trailParticles = [];
  screenShake = { x: 0, y: 0, intensity: 0, decay: 0 };
  spawnPortal = { active: false, life: 0, maxLife: 0 };
  waveActive = false; waveSpawning = false; spawnQueue = []; gameOver = false;
  selectedPlacedTower = null; mapShiftNotification = null; mapShiftDelay = 0;
  extraSpawnPoints = []; spawnPointNotification = null;
  evolutionNotification = null; evolutionWaiting = false; evolutionVFX = [];
  currentTier = 0;
  for (const type of ['gun', 'cannon', 'sniper', 'frost']) {
    TOWER_DEFS[type] = TOWER_TIERS[0].defs[type];
  }
  gameSpeed = 1; autoMode = true; gameTime = 0;
  currentAtmosphere = copyPalette(ATMOSPHERE_PALETTES[0]);
  fromAtmosphere = null; targetAtmosphere = null;
  atmosphereT = 0; atmosphereLerping = false;
  ambientParticles = [];
  currentWorldIdx = (currentWorldIdx + 1) % WORLDS.length;
  padMap();
  scatterRocks();
  resize();
  document.getElementById('speed-btn').textContent = '1X';
  document.getElementById('auto-btn').textContent = 'AUTO';
  document.getElementById('auto-btn').classList.add('active');
  document.getElementById('game-over-overlay').classList.remove('show');
  document.getElementById('end-title').style.color = '';
  document.getElementById('end-title').className = '';
  document.getElementById('end-msg').style.color = '';
  document.getElementById('record-score').className = '';
  document.getElementById('record-score').textContent = '';
  document.getElementById('record-stars').className = '';
  document.getElementById('record-stars').textContent = '';
  document.getElementById('start-btn').disabled = false;
  updateHUD();
  refreshTowerBar();
});