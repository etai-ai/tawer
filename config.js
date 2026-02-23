// --- DATA DEFINITIONS & PURE UTILITIES ---
// No DOM access, no dependencies on other files.

const BALANCE = {
  startGold: 300,
  startLives: 10,
  maxLives: 10,
  livesPerLevelUp: 3,

  // Wave spawning
  wave1Count: 3,
  countBase: 3,
  countLinear: 1.5,
  countExponent: 0.8,
  countMultiplier: 0.57528,
  spawnInterval: 600,
  spawnIntervalMin: 300,
  spawnIntervalScaling: 12,

  // Enemy HP
  wave1Hp: 15,
  hpBase: 15,
  hpLinear: 10,
  hpExponentBase: 1.6,
  hpExponentRamp: 0.02,
  hpExponentCap: 0.4,
  hpMultiplier: 1.1,

  // Enemy speed
  wave1Speed: 0.632,
  speedBase: 0.76,
  speedScaling: 0.038,
  speedCap: 1.52,
  speedMultiplier: 0.81450625,

  // Kill reward
  rewardBase: 3.675,
  rewardMultiplier: 1.5460025,

  // Wave completion
  waveGoldBase: 10.5,
  waveGoldScaling: 1.575,

  // Level-up
  levelUpWaves: 10,
  levelUpGoldBase: 63,
  levelUpGoldScaling: 15.75,

  // Combat
  slowFactor: 0.4,
  slowDuration: 1500,
  splashDamageRatio: 0.5,

  // Upgrade
  upgradeCostRatio: 0.5,
  maxTowerLevel: 3,
  upgradeDamageBonus: 0.25,
  upgradeRangeBonus: 0.10,
  upgradeRateMultiplier: 0.9,

  // Map
  rockDensity: 0.12,

  // Boss schedule
  bossEvery: 5,
  doubleBossEvery: 15,
};

const WORLDS = [
  { name: 'SPIRAL', data: [
    [2,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,0,1],
    [0,1,0,0,0,0,0,1,0,1],
    [0,1,0,1,1,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,3,0,1,0,1],
    [0,1,0,1,0,0,0,1,0,1],
    [0,1,0,1,1,1,1,1,0,1],
    [0,1,0,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,1,1],
  ]},
  { name: 'FORTRESS', data: [
    [0,0,0,0,2,0,0,0,3,0],
    [0,0,0,0,1,0,0,0,1,0],
    [0,1,1,1,1,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [1,1,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,1,1],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ]},
];

// --- RANDOM MAP GENERATOR ---
// Seeded PRNG for reproducible maps (so records are meaningful)
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateRandomMap(seed, forceStrategy) {
  const R = 16, C = 10;
  const rng = mulberry32(seed);
  const grid = Array.from({ length: R }, () => Array(C).fill(0));

  const strategy = (forceStrategy !== undefined) ? forceStrategy : Math.floor(rng() * 4);

  if (strategy === 0) {
    // SERPENTINE: horizontal rows that snake back and forth with varied spacing
    const numRows = 5 + Math.floor(rng() * 3); // 5-7 rows for longer paths
    let direction = rng() < 0.5 ? 1 : -1;
    // Distribute rows roughly evenly across the grid height
    const rowPositions = [];
    for (let i = 0; i < numRows; i++) {
      const base = Math.round((i / (numRows - 1)) * (R - 3)) + 1;
      const jitter = Math.floor(rng() * 2);
      rowPositions.push(Math.min(R - 2, Math.max(1, base + jitter)));
    }
    // Deduplicate and ensure min spacing of 2
    const uniqueRows = [rowPositions[0]];
    for (let i = 1; i < rowPositions.length; i++) {
      const r = rowPositions[i];
      if (r > uniqueRows[uniqueRows.length - 1] + 1) uniqueRows.push(r);
    }

    let prevRow = -1, prevEndCol = -1;
    for (let i = 0; i < uniqueRows.length; i++) {
      const r = uniqueRows[i];
      // Vary the horizontal extent — don't always go full width
      const margin = Math.floor(rng() * 2);
      const startCol = direction === 1 ? margin : C - 1 - margin;
      const endCol = direction === 1 ? C - 1 - margin : margin;
      const minC = Math.min(startCol, endCol), maxC = Math.max(startCol, endCol);
      for (let c = minC; c <= maxC; c++) grid[r][c] = 1;
      if (prevRow >= 0) {
        const connCol = prevEndCol;
        // Ensure connection column is within this row's range
        const clamped = Math.min(maxC, Math.max(minC, connCol));
        const minR = Math.min(prevRow, r), maxR = Math.max(prevRow, r);
        for (let rr = minR; rr <= maxR; rr++) grid[rr][clamped] = 1;
        // Also connect clamped to start of this row if needed
        if (clamped !== startCol) {
          const mc = Math.min(clamped, startCol), xc = Math.max(clamped, startCol);
          for (let cc = mc; cc <= xc; cc++) grid[r][cc] = 1;
        }
      }
      prevRow = r;
      prevEndCol = endCol;
      direction *= -1;
    }

    const firstRow = uniqueRows[0];
    const lastRow = uniqueRows[uniqueRows.length - 1];
    let sC = -1, eC = -1;
    for (let c = 0; c < C; c++) if (grid[firstRow][c] === 1 && sC < 0) sC = c;
    for (let c = C - 1; c >= 0; c--) if (grid[lastRow][c] === 1 && eC < 0) eC = c;
    // Connect start/end to edge if not already
    if (firstRow > 0) for (let r = 0; r <= firstRow; r++) grid[r][sC] = 1;
    if (lastRow < R - 1) for (let r = lastRow; r < R; r++) grid[r][eC] = 1;
    grid[0][sC] = 2;
    grid[R - 1][eC] = 3;

  } else if (strategy === 1) {
    // SWITCHBACK: multiple vertical columns connected at alternating top/bottom
    // More columns = longer path since each column spans most of the height
    const numCols = 4 + Math.floor(rng() * 2); // 4-5 columns
    // Spread columns with minimum 2-cell gap between them
    const colPositions = [];
    const spacing = Math.floor((C - 2) / (numCols - 1));
    for (let i = 0; i < numCols; i++) {
      const base = 1 + i * spacing;
      const jitter = (i > 0 && i < numCols - 1) ? Math.floor(rng() * 2) - 1 : 0;
      colPositions.push(Math.min(C - 1, Math.max(0, base + jitter)));
    }
    const uniqueCols = [...new Set(colPositions)].sort((a, b) => a - b);
    // Need at least 3 columns for a decent path
    while (uniqueCols.length < 3) uniqueCols.push(C - 1 - uniqueCols.length);
    uniqueCols.sort((a, b) => a - b);

    let goingDown = true;
    let prevCol = -1, prevEndRow = -1;
    for (let i = 0; i < uniqueCols.length; i++) {
      const c = uniqueCols[i];
      // Each column spans nearly the full height, with slight variation
      const topRow = i === 0 ? 0 : (1 + Math.floor(rng() * 2));
      const botRow = i === uniqueCols.length - 1 ? R - 1 : (R - 2 - Math.floor(rng() * 2));
      const startR = goingDown ? topRow : botRow;
      const endR = goingDown ? botRow : topRow;
      const minR = Math.min(startR, endR), maxR = Math.max(startR, endR);
      for (let r = minR; r <= maxR; r++) grid[r][c] = 1;
      if (prevCol >= 0) {
        const connRow = prevEndRow;
        const minC = Math.min(prevCol, c), maxC = Math.max(prevCol, c);
        for (let cc = minC; cc <= maxC; cc++) grid[connRow][cc] = 1;
      }
      prevCol = c;
      prevEndRow = endR;
      goingDown = !goingDown;
    }

    const firstCol = uniqueCols[0];
    const lastCol = uniqueCols[uniqueCols.length - 1];
    let sR = -1, eR = -1;
    for (let r = 0; r < R; r++) if (grid[r][firstCol] === 1 && sR < 0) sR = r;
    for (let r = R - 1; r >= 0; r--) if (grid[r][lastCol] === 1 && eR < 0) eR = r;
    grid[sR][firstCol] = 2;
    grid[eR][lastCol] = 3;

  } else if (strategy === 2) {
    // WINDING: biased sweeps that step down, always single-tile wide
    const startC = 1 + Math.floor(rng() * (C - 2));
    let r = 0, c = startC;
    grid[r][c] = 1;

    let sweepDir = rng() < 0.5 ? -1 : 1;
    while (r < R - 1) {
      // Horizontal sweep: go in sweepDir until near edge
      const sweepLen = 3 + Math.floor(rng() * (C - 4));
      for (let s = 0; s < sweepLen; s++) {
        const nc = c + sweepDir;
        if (nc < 0 || nc >= C) break;
        c = nc;
        grid[r][c] = 1;
      }
      // Move down 2-3 rows to avoid double-thick corridors
      const downSteps = 2 + Math.floor(rng() * 2);
      for (let d = 0; d < downSteps && r < R - 1; d++) {
        r++;
        grid[r][c] = 1;
      }
      sweepDir *= -1;
    }

    // Ensure we're at bottom
    while (r < R - 1) { r++; grid[r][c] = 1; }

    grid[0][startC] = 2;
    grid[R - 1][c] = 3;

  } else {
    // COMB: teeth alternating from left and right walls
    // Build a guaranteed serpentine-like structure with teeth from alternating sides
    let currentRow = 0;
    const startC = rng() < 0.5 ? 0 : C - 1;
    let fromLeft = startC === 0;

    // First row: horizontal from edge
    grid[currentRow][startC] = 1;

    while (currentRow < R - 1) {
      // Draw horizontal tooth across most of the grid
      const teethLen = C - 2 - Math.floor(rng() * 2); // leave 1-2 gap on far side
      if (fromLeft) {
        for (let cc = 0; cc <= Math.min(C - 1, teethLen); cc++) grid[currentRow][cc] = 1;
        // Go down on the right side — minimum 2 rows to avoid double-thick paths
        const endCol = Math.min(C - 1, teethLen);
        const downSteps = 2 + Math.floor(rng() * 2);
        for (let d = 0; d < downSteps && currentRow < R - 1; d++) {
          currentRow++;
          // Only draw the vertical connector column, not full rows
          grid[currentRow][endCol] = 1;
        }
      } else {
        for (let cc = C - 1; cc >= Math.max(0, C - 1 - teethLen); cc--) grid[currentRow][cc] = 1;
        const endCol = Math.max(0, C - 1 - teethLen);
        const downSteps = 2 + Math.floor(rng() * 2);
        for (let d = 0; d < downSteps && currentRow < R - 1; d++) {
          currentRow++;
          grid[currentRow][endCol] = 1;
        }
      }
      fromLeft = !fromLeft;
    }

    // Draw final horizontal on last row
    const lastRowHasPath = grid[R - 1].some(v => v === 1);
    if (!lastRowHasPath) {
      // Extend down from wherever we are
      for (let rr = currentRow; rr < R; rr++) {
        const cc = grid[rr].indexOf(1);
        if (cc < 0) {
          // Copy column from row above
          for (let c = 0; c < C; c++) if (grid[rr - 1][c] >= 1) { grid[rr][c] = 1; break; }
        }
      }
    }

    // Place start and end
    grid[0][startC] = 2;
    // Find a path cell on the bottom row
    let endC2 = -1;
    for (let c = 0; c < C; c++) if (grid[R - 1][c] === 1) { endC2 = c; break; }
    if (endC2 < 0) {
      // Connect down to bottom
      for (let c = 0; c < C; c++) {
        if (grid[R - 2][c] >= 1) {
          grid[R - 1][c] = 1;
          endC2 = c;
          break;
        }
      }
    }
    if (endC2 >= 0) grid[R - 1][endC2] = 3;
  }

  // Validate: ensure path from 2 to 3 exists via BFS
  let startR = -1, startC = -1, endR = -1, endC = -1;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 2) { startR = r; startC = c; }
      if (grid[r][c] === 3) { endR = r; endC = c; }
    }

  if (startR < 0 || endR < 0) return null;

  // BFS to check connectivity
  const bfsVisited = new Set();
  const bfsQueue = [{ r: startR, c: startC }];
  bfsVisited.add(`${startR},${startC}`);
  let found = false;
  while (bfsQueue.length) {
    const cur = bfsQueue.shift();
    if (cur.r === endR && cur.c === endC) { found = true; break; }
    for (const [ddr, ddc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + ddr, nc = cur.c + ddc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !bfsVisited.has(key) && grid[nr][nc] >= 1 && grid[nr][nc] <= 3) {
        bfsVisited.add(key);
        bfsQueue.push({ r: nr, c: nc });
      }
    }
  }
  if (!found) return null;

  // Measure path length — reject maps with too-short paths
  // BFS from start to end, count steps
  const distMap = new Map();
  const dQueue = [{ r: startR, c: startC }];
  distMap.set(`${startR},${startC}`, 0);
  while (dQueue.length) {
    const cur = dQueue.shift();
    const curDist = distMap.get(`${cur.r},${cur.c}`);
    for (const [ddr, ddc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + ddr, nc = cur.c + ddc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !distMap.has(key) && grid[nr][nc] >= 1 && grid[nr][nc] <= 3) {
        distMap.set(key, curDist + 1);
        dQueue.push({ r: nr, c: nc });
      }
    }
  }
  const pathLen = distMap.get(`${endR},${endC}`) || 0;
  if (pathLen < 50) return null; // too short, reject

  // --- PRUNE DEAD-END BRANCHES ---
  // BFS from end to find all tiles reachable from the exit
  const reachFromEnd = new Set();
  const eQueue = [{ r: endR, c: endC }];
  reachFromEnd.add(`${endR},${endC}`);
  while (eQueue.length) {
    const cur = eQueue.shift();
    for (const [ddr, ddc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + ddr, nc = cur.c + ddc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !reachFromEnd.has(key) && grid[nr][nc] >= 1 && grid[nr][nc] <= 3) {
        reachFromEnd.add(key);
        eQueue.push({ r: nr, c: nc });
      }
    }
  }

  // Iteratively remove dead-end tiles (path tiles with only 1 path neighbor)
  // but never remove start or end tiles
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] !== 1) continue; // only prune plain path tiles (not start=2 or end=3)
        let neighbors = 0;
        for (const [ddr, ddc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
          const nr = r + ddr, nc = c + ddc;
          if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] >= 1 && grid[nr][nc] <= 3) neighbors++;
        }
        if (neighbors <= 1) {
          grid[r][c] = 0; // remove dead end
          changed = true;
        }
      }
    }
  }

  // Re-validate after pruning
  const finalVisited = new Set();
  const fQueue = [{ r: startR, c: startC }];
  finalVisited.add(`${startR},${startC}`);
  let finalFound = false;
  while (fQueue.length) {
    const cur = fQueue.shift();
    if (cur.r === endR && cur.c === endC) { finalFound = true; break; }
    for (const [ddr, ddc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = cur.r + ddr, nc = cur.c + ddc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !finalVisited.has(key) && grid[nr][nc] >= 1 && grid[nr][nc] <= 3) {
        finalVisited.add(key);
        fQueue.push({ r: nr, c: nc });
      }
    }
  }
  if (!finalFound) return null;

  return grid;
}

// Generate 4 random worlds with fixed seeds and forced strategies for variety
const RANDOM_WORLDS_CONFIG = [
  { name: 'LABYRINTH', seed: 2563, strategy: 0 },  // serpentine
  { name: 'GAUNTLET',  seed: 1702, strategy: 1 },  // switchback
  { name: 'CRUCIBLE',  seed: 19675, strategy: 2 }, // winding
  { name: 'VORTEX',    seed: 9253, strategy: 3 },  // comb
];

for (const cfg of RANDOM_WORLDS_CONFIG) {
  let map = null;
  for (let attempt = 0; attempt < 100; attempt++) {
    map = generateRandomMap(cfg.seed + attempt * 17, cfg.strategy);
    if (map) break;
  }
  if (map) {
    WORLDS.push({ name: cfg.name, data: map, generated: true });
  }
}

function loadBestScores() { try { return JSON.parse(localStorage.getItem('tawer_best')) || {}; } catch(e) { return {}; } }
function saveBestScore(world, s) { const b = loadBestScores(); if (!b[world] || s > b[world]) { b[world] = s; localStorage.setItem('tawer_best', JSON.stringify(b)); return true; } return false; }

// Tower evolution tiers — unlocked at levels 1, 5, 10, 15
// Each tier has 4 tower types mapped to the base slots: gun, cannon, sniper, frost
const TOWER_TIERS = [
  // TIER 1 (default)
  {
    tierName: 'STANDARD',
    tierLevel: 1,
    defs: {
      gun:    { name: 'GUN',     cost: 50,  range: 110, damage: 12, rate: 450,  color: '#00ff88', bullet: '#00ff88', bulletSpeed: 6, splash: 0 },
      cannon: { name: 'CANNON',  cost: 100, range: 95,  damage: 40, rate: 1100, color: '#ff6b35', bullet: '#ff6b35', bulletSpeed: 4, splash: 35 },
      sniper: { name: 'SNIPER',  cost: 150, range: 250, damage: 75, rate: 1800, color: '#a55eea', bullet: '#a55eea', bulletSpeed: 10, splash: 0 },
      frost:  { name: 'FROST',   cost: 75,  range: 110, damage: 5,  rate: 350,  color: '#00d2ff', bullet: '#00d2ff', bulletSpeed: 5, splash: 0, slow: 0.4 },
    }
  },
  // TIER 2 — Level 5
  {
    tierName: 'ADVANCED',
    tierLevel: 5,
    defs: {
      gun:    { name: 'PULSE',   cost: 80,  range: 120, damage: 22, rate: 380,  color: '#44ffaa', bullet: '#44ffaa', bulletSpeed: 7, splash: 0 },
      cannon: { name: 'MORTAR',  cost: 160, range: 105, damage: 70, rate: 1000, color: '#ff8844', bullet: '#ff8844', bulletSpeed: 4.5, splash: 45 },
      sniper: { name: 'RAILGUN', cost: 240, range: 280, damage: 140,rate: 1600, color: '#bb77ff', bullet: '#bb77ff', bulletSpeed: 14, splash: 0 },
      frost:  { name: 'CRYO',    cost: 120, range: 120, damage: 10, rate: 300,  color: '#33eeff', bullet: '#33eeff', bulletSpeed: 6, splash: 0, slow: 0.5 },
    }
  },
  // TIER 3 — Level 10
  {
    tierName: 'ELITE',
    tierLevel: 10,
    defs: {
      gun:    { name: 'PLASMA',  cost: 130, range: 130, damage: 40, rate: 320,  color: '#88ffcc', bullet: '#88ffcc', bulletSpeed: 8, splash: 0 },
      cannon: { name: 'SIEGE',   cost: 260, range: 115, damage: 120,rate: 900,  color: '#ffaa55', bullet: '#ffaa55', bulletSpeed: 5, splash: 55 },
      sniper: { name: 'GAUSS',   cost: 400, range: 310, damage: 260,rate: 1400, color: '#dd99ff', bullet: '#dd99ff', bulletSpeed: 18, splash: 0 },
      frost:  { name: 'BLIZZARD',cost: 200, range: 135, damage: 18, rate: 260,  color: '#66f0ff', bullet: '#66f0ff', bulletSpeed: 7, splash: 0, slow: 0.6 },
    }
  },
  // TIER 4 — Level 15
  {
    tierName: 'LEGENDARY',
    tierLevel: 15,
    defs: {
      gun:    { name: 'NOVA',    cost: 220, range: 145, damage: 72, rate: 270,  color: '#ccffee', bullet: '#ccffee', bulletSpeed: 10, splash: 0 },
      cannon: { name: 'ORBITAL', cost: 440, range: 130, damage: 220,rate: 800,  color: '#ffcc66', bullet: '#ffcc66', bulletSpeed: 6, splash: 70 },
      sniper: { name: 'VOID',    cost: 660, range: 350, damage: 500,rate: 1200, color: '#eeccff', bullet: '#eeccff', bulletSpeed: 24, splash: 0 },
      frost:  { name: 'ZERO',    cost: 330, range: 150, damage: 35, rate: 220,  color: '#aaf4ff', bullet: '#aaf4ff', bulletSpeed: 9, splash: 0, slow: 0.7 },
    }
  },
];

// Evolution schedule — which levels trigger tier upgrades
const EVOLUTION_LEVELS = [5, 10, 15];

// Active tower defs — starts as tier 0, swapped on evolution
let currentTier = 0;
let TOWER_DEFS = Object.assign({}, TOWER_TIERS[0].defs);

const ENEMY_TYPES = {
  grunt:   { color: '#55cc55', shape: 'circle',  speedMul: 1,   hpMul: 1,   rewardMul: 1,   label: '\u25CF' },
  runner:  { color: '#ffaa22', shape: 'diamond',  speedMul: 1.6, hpMul: 0.5, rewardMul: 1.2, label: '\u25C6' },
  tank:    { color: '#7788cc', shape: 'square',   speedMul: 0.51, hpMul: 3.0, rewardMul: 2,   label: '\u25A0' },
  swarm:   { color: '#dd55dd', shape: 'triangle', speedMul: 1.3, hpMul: 0.35,rewardMul: 0.6, label: '\u25B2' },
  healer:  { color: '#44eebb', shape: 'hex',      speedMul: 0.9, hpMul: 1.2, rewardMul: 1.5, label: '\u2B21' },
  boss:    { color: '#ff2255', shape: 'star',     speedMul: 0.5, hpMul: 5,   rewardMul: 6,   label: '\u2605' },
};

const ATMOSPHERE_PALETTES = [
  // LVL 1: FOREST — earthy green, warm browns
  { name: 'FOREST', grass: '#08100a', grassTex: '#0c1610', gridLine: '#0e1a10',
    rock: '#2a2a1e', rockTex: '#3a382a',
    path: '#4a4035', pathInset: '#5c5045', pathBorder: '#6a6050',
    glowOuter: 'rgba(180,150,100,0.16)', glowInner: 'rgba(200,170,120,0.08)',
    startTile: '#2a6040', startInset: '#308050', endTile: '#6a2828', endInset: '#803030',
    accent: '#88aa66', notifColor: '#aacc55' },

  // LVL 2: OCEAN DEPTHS — deep navy, cyan glow
  { name: 'DEPTHS', grass: '#040a18', grassTex: '#081020', gridLine: '#0c1830',
    rock: '#1a2840', rockTex: '#2a3850',
    path: '#1a3050', pathInset: '#254068', pathBorder: '#355880',
    glowOuter: 'rgba(40,160,255,0.20)', glowInner: 'rgba(60,180,255,0.10)',
    startTile: '#105540', startInset: '#186850', endTile: '#502040', endInset: '#682858',
    accent: '#33bbff', notifColor: '#33ccff' },

  // LVL 3: TOXIC SWAMP — sickly green, acid yellow
  { name: 'SWAMP', grass: '#0a0e04', grassTex: '#101806', gridLine: '#182008',
    rock: '#252c14', rockTex: '#363e20',
    path: '#2a3510', pathInset: '#384818', pathBorder: '#4a5a20',
    glowOuter: 'rgba(160,220,40,0.22)', glowInner: 'rgba(180,240,60,0.10)',
    startTile: '#2a5020', startInset: '#306828', endTile: '#604010', endInset: '#785018',
    accent: '#aadd22', notifColor: '#ccee44' },

  // LVL 4: CORRUPTION — deep purple, magenta energy
  { name: 'CORRUPTION', grass: '#0c0616', grassTex: '#140a20', gridLine: '#1c0e2c',
    rock: '#281840', rockTex: '#3a2850',
    path: '#3a1850', pathInset: '#4c2868', pathBorder: '#603880',
    glowOuter: 'rgba(180,50,255,0.22)', glowInner: 'rgba(200,80,255,0.10)',
    startTile: '#204060', startInset: '#285070', endTile: '#601848', endInset: '#782060',
    accent: '#cc44ff', notifColor: '#dd66ff' },

  // LVL 5: INFERNO — deep red, orange fire
  { name: 'INFERNO', grass: '#140604', grassTex: '#1c0a06', gridLine: '#280e08',
    rock: '#351810', rockTex: '#482820',
    path: '#502010', pathInset: '#683018', pathBorder: '#804020',
    glowOuter: 'rgba(255,120,30,0.25)', glowInner: 'rgba(255,160,50,0.12)',
    startTile: '#2a5030', startInset: '#306838', endTile: '#801810', endInset: '#a02018',
    accent: '#ff6622', notifColor: '#ff8833' },

  // LVL 6: FROZEN — icy blue-white, silver
  { name: 'FROZEN', grass: '#080e14', grassTex: '#0c1420', gridLine: '#141c2c',
    rock: '#283848', rockTex: '#384858',
    path: '#304050', pathInset: '#405868', pathBorder: '#587080',
    glowOuter: 'rgba(150,220,255,0.25)', glowInner: 'rgba(180,240,255,0.12)',
    startTile: '#206050', startInset: '#287860', endTile: '#503848', endInset: '#684860',
    accent: '#88ddff', notifColor: '#aaeeff' },

  // LVL 7: GOLDEN SANDS — warm gold, desert amber
  { name: 'SANDS', grass: '#100c04', grassTex: '#181208', gridLine: '#20180c',
    rock: '#2c2410', rockTex: '#3e3420',
    path: '#4a3818', pathInset: '#5c4820', pathBorder: '#706028',
    glowOuter: 'rgba(255,200,80,0.25)', glowInner: 'rgba(255,220,100,0.12)',
    startTile: '#305028', startInset: '#386830', endTile: '#6a3018', endInset: '#804020',
    accent: '#ffcc44', notifColor: '#ffdd66' },

  // LVL 8: CRIMSON ECLIPSE — blood red, black
  { name: 'ECLIPSE', grass: '#0e0406', grassTex: '#160608', gridLine: '#22080a',
    rock: '#301418', rockTex: '#422428',
    path: '#501418', pathInset: '#681c22', pathBorder: '#80282e',
    glowOuter: 'rgba(255,40,60,0.28)', glowInner: 'rgba(255,60,80,0.14)',
    startTile: '#204840', startInset: '#286050', endTile: '#901010', endInset: '#b01818',
    accent: '#ff2244', notifColor: '#ff4466' },

  // LVL 9: SHADOW REALM — near black, ghostly white wisps
  { name: 'SHADOW', grass: '#040406', grassTex: '#080810', gridLine: '#0c0c18',
    rock: '#1c1c28', rockTex: '#2c2c38',
    path: '#1c1c28', pathInset: '#282838', pathBorder: '#383848',
    glowOuter: 'rgba(200,200,240,0.22)', glowInner: 'rgba(220,220,255,0.10)',
    startTile: '#143038', startInset: '#1c4048', endTile: '#381428', endInset: '#481c38',
    accent: '#bbbbee', notifColor: '#ccccff' },

  // LVL 10: VOID NEXUS — ultra dark with vivid white/rainbow energy
  { name: 'VOID NEXUS', grass: '#020204', grassTex: '#040408', gridLine: '#08080c',
    rock: '#181824', rockTex: '#282834',
    path: '#181820', pathInset: '#24242e', pathBorder: '#34343e',
    glowOuter: 'rgba(255,255,255,0.30)', glowInner: 'rgba(200,180,255,0.15)',
    startTile: '#0a2828', startInset: '#103838', endTile: '#280a28', endInset: '#381038',
    accent: '#ffffff', notifColor: '#ffffff' },
];

function shadeColor(hex, amt) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, r + amt); g = Math.min(255, g + amt); b = Math.min(255, b + amt);
  return `rgb(${r},${g},${b})`;
}

function lerpHex(a, b, t) {
  const ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
  const br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return '#' + ((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1);
}

// Pre-parsed rgba cache to avoid regex per frame
const _rgbaCache = new Map();
function _parseRgba(s) {
  let v = _rgbaCache.get(s);
  if (v) return v;
  const m = s.match(/[\d.]+/g);
  v = [+m[0], +m[1], +m[2], +m[3]];
  _rgbaCache.set(s, v);
  return v;
}
function lerpRgba(a, b, t) {
  const pa = _parseRgba(a), pb = _parseRgba(b);
  const r = Math.round(pa[0]+(pb[0]-pa[0])*t);
  const g = Math.round(pa[1]+(pb[1]-pa[1])*t);
  const bl = Math.round(pa[2]+(pb[2]-pa[2])*t);
  const al = +(pa[3]+(pb[3]-pa[3])*t).toFixed(3);
  return `rgba(${r},${g},${bl},${al})`;
}

function copyPalette(p) { return Object.assign({}, p); }

function lerpPalette(from, to, t) {
  return {
    name: to.name,
    grass: lerpHex(from.grass, to.grass, t),
    grassTex: lerpHex(from.grassTex, to.grassTex, t),
    gridLine: lerpHex(from.gridLine, to.gridLine, t),
    rock: lerpHex(from.rock, to.rock, t),
    rockTex: lerpHex(from.rockTex, to.rockTex, t),
    path: lerpHex(from.path, to.path, t),
    pathInset: lerpHex(from.pathInset, to.pathInset, t),
    pathBorder: lerpHex(from.pathBorder, to.pathBorder, t),
    glowOuter: lerpRgba(from.glowOuter, to.glowOuter, t),
    glowInner: lerpRgba(from.glowInner, to.glowInner, t),
    startTile: lerpHex(from.startTile, to.startTile, t),
    startInset: lerpHex(from.startInset, to.startInset, t),
    endTile: lerpHex(from.endTile, to.endTile, t),
    endInset: lerpHex(from.endInset, to.endInset, t),
    accent: lerpHex(from.accent, to.accent, t),
    notifColor: lerpHex(from.notifColor, to.notifColor, t),
  };
}