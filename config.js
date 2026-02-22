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
  countMultiplier: 0.846,
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

  // Enemy speed
  wave1Speed: 0.632,
  speedBase: 0.76,
  speedScaling: 0.038,
  speedCap: 1.52,
  speedMultiplier: 0.9025,

  // Kill reward
  rewardBase: 3.675,
  rewardMultiplier: 1.169,

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
  { name: 'SERPENT', data: [
    [2,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,3,0],
  ]},
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
  { name: 'ZIGZAG', data: [
    [2,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,3,0],
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

function loadBestScores() { try { return JSON.parse(localStorage.getItem('tawer_best')) || {}; } catch(e) { return {}; } }
function saveBestScore(world, s) { const b = loadBestScores(); if (!b[world] || s > b[world]) { b[world] = s; localStorage.setItem('tawer_best', JSON.stringify(b)); return true; } return false; }

const TOWER_DEFS = {
  gun:    { cost: 50,  range: 110, damage: 12, rate: 450,  color: '#00ff88', bullet: '#00ff88', bulletSpeed: 6, splash: 0 },
  cannon: { cost: 100, range: 95,  damage: 40, rate: 1100, color: '#ff6b35', bullet: '#ff6b35', bulletSpeed: 4, splash: 35 },
  sniper: { cost: 150, range: 250, damage: 75, rate: 1800, color: '#a55eea', bullet: '#a55eea', bulletSpeed: 10, splash: 0 },
  frost:  { cost: 75,  range: 110, damage: 5,  rate: 350,  color: '#00d2ff', bullet: '#00d2ff', bulletSpeed: 5, splash: 0, slow: 0.4 },
};

const ENEMY_TYPES = {
  grunt:   { color: '#55cc55', shape: 'circle',  speedMul: 1,   hpMul: 1,   rewardMul: 1,   label: '\u25CF' },
  runner:  { color: '#ffaa22', shape: 'diamond',  speedMul: 1.6, hpMul: 0.5, rewardMul: 1.2, label: '\u25C6' },
  tank:    { color: '#7788cc', shape: 'square',   speedMul: 0.6, hpMul: 2.5, rewardMul: 2,   label: '\u25A0' },
  swarm:   { color: '#dd55dd', shape: 'triangle', speedMul: 1.3, hpMul: 0.35,rewardMul: 0.6, label: '\u25B2' },
  healer:  { color: '#44eebb', shape: 'hex',      speedMul: 0.9, hpMul: 1.2, rewardMul: 1.5, label: '\u2B21' },
  boss:    { color: '#ff2255', shape: 'star',     speedMul: 0.5, hpMul: 5,   rewardMul: 6,   label: '\u2605' },
};

const ATMOSPHERE_PALETTES = [
  // LVL 1: FOREST — earthy green, warm browns
  { name: 'FOREST', grass: '#08100a', grassTex: '#0c1610', gridLine: '#0e1a10',
    rock: '#1a1a14', rockTex: '#2a2820',
    path: '#4a4035', pathInset: '#5c5045', pathBorder: '#6a6050',
    glowOuter: 'rgba(180,150,100,0.16)', glowInner: 'rgba(200,170,120,0.08)',
    startTile: '#2a6040', startInset: '#308050', endTile: '#6a2828', endInset: '#803030',
    accent: '#88aa66', notifColor: '#aacc55' },

  // LVL 2: OCEAN DEPTHS — deep navy, cyan glow
  { name: 'DEPTHS', grass: '#040a18', grassTex: '#081020', gridLine: '#0c1830',
    rock: '#101828', rockTex: '#1a2838',
    path: '#1a3050', pathInset: '#254068', pathBorder: '#355880',
    glowOuter: 'rgba(40,160,255,0.20)', glowInner: 'rgba(60,180,255,0.10)',
    startTile: '#105540', startInset: '#186850', endTile: '#502040', endInset: '#682858',
    accent: '#33bbff', notifColor: '#33ccff' },

  // LVL 3: TOXIC SWAMP — sickly green, acid yellow
  { name: 'SWAMP', grass: '#0a0e04', grassTex: '#101806', gridLine: '#182008',
    rock: '#181c0c', rockTex: '#282c14',
    path: '#2a3510', pathInset: '#384818', pathBorder: '#4a5a20',
    glowOuter: 'rgba(160,220,40,0.22)', glowInner: 'rgba(180,240,60,0.10)',
    startTile: '#2a5020', startInset: '#306828', endTile: '#604010', endInset: '#785018',
    accent: '#aadd22', notifColor: '#ccee44' },

  // LVL 4: CORRUPTION — deep purple, magenta energy
  { name: 'CORRUPTION', grass: '#0c0616', grassTex: '#140a20', gridLine: '#1c0e2c',
    rock: '#1a1028', rockTex: '#2a1838',
    path: '#3a1850', pathInset: '#4c2868', pathBorder: '#603880',
    glowOuter: 'rgba(180,50,255,0.22)', glowInner: 'rgba(200,80,255,0.10)',
    startTile: '#204060', startInset: '#285070', endTile: '#601848', endInset: '#782060',
    accent: '#cc44ff', notifColor: '#dd66ff' },

  // LVL 5: INFERNO — deep red, orange fire
  { name: 'INFERNO', grass: '#140604', grassTex: '#1c0a06', gridLine: '#280e08',
    rock: '#201008', rockTex: '#301810',
    path: '#502010', pathInset: '#683018', pathBorder: '#804020',
    glowOuter: 'rgba(255,120,30,0.25)', glowInner: 'rgba(255,160,50,0.12)',
    startTile: '#2a5030', startInset: '#306838', endTile: '#801810', endInset: '#a02018',
    accent: '#ff6622', notifColor: '#ff8833' },

  // LVL 6: FROZEN — icy blue-white, silver
  { name: 'FROZEN', grass: '#080e14', grassTex: '#0c1420', gridLine: '#141c2c',
    rock: '#1a2030', rockTex: '#283040',
    path: '#304050', pathInset: '#405868', pathBorder: '#587080',
    glowOuter: 'rgba(150,220,255,0.25)', glowInner: 'rgba(180,240,255,0.12)',
    startTile: '#206050', startInset: '#287860', endTile: '#503848', endInset: '#684860',
    accent: '#88ddff', notifColor: '#aaeeff' },

  // LVL 7: GOLDEN SANDS — warm gold, desert amber
  { name: 'SANDS', grass: '#100c04', grassTex: '#181208', gridLine: '#20180c',
    rock: '#1c1608', rockTex: '#2c2410',
    path: '#4a3818', pathInset: '#5c4820', pathBorder: '#706028',
    glowOuter: 'rgba(255,200,80,0.25)', glowInner: 'rgba(255,220,100,0.12)',
    startTile: '#305028', startInset: '#386830', endTile: '#6a3018', endInset: '#804020',
    accent: '#ffcc44', notifColor: '#ffdd66' },

  // LVL 8: CRIMSON ECLIPSE — blood red, black
  { name: 'ECLIPSE', grass: '#0e0406', grassTex: '#160608', gridLine: '#22080a',
    rock: '#1c0a0c', rockTex: '#2c1418',
    path: '#501418', pathInset: '#681c22', pathBorder: '#80282e',
    glowOuter: 'rgba(255,40,60,0.28)', glowInner: 'rgba(255,60,80,0.14)',
    startTile: '#204840', startInset: '#286050', endTile: '#901010', endInset: '#b01818',
    accent: '#ff2244', notifColor: '#ff4466' },

  // LVL 9: SHADOW REALM — near black, ghostly white wisps
  { name: 'SHADOW', grass: '#040406', grassTex: '#080810', gridLine: '#0c0c18',
    rock: '#0e0e14', rockTex: '#18181e',
    path: '#1c1c28', pathInset: '#282838', pathBorder: '#383848',
    glowOuter: 'rgba(200,200,240,0.22)', glowInner: 'rgba(220,220,255,0.10)',
    startTile: '#143038', startInset: '#1c4048', endTile: '#381428', endInset: '#481c38',
    accent: '#bbbbee', notifColor: '#ccccff' },

  // LVL 10: VOID NEXUS — ultra dark with vivid white/rainbow energy
  { name: 'VOID NEXUS', grass: '#020204', grassTex: '#040408', gridLine: '#08080c',
    rock: '#0a0a10', rockTex: '#141418',
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

function lerpRgba(a, b, t) {
  const pa = a.match(/[\d.]+/g).map(Number);
  const pb = b.match(/[\d.]+/g).map(Number);
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
