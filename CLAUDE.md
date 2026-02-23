# TAWER — Tower Defense Game

## Overview
HTML5 canvas tower defense game split across 4 files. No build tools, no dependencies, no frameworks.

## Architecture
- **`index.html`**: HTML structure (canvas, HUD, tower buttons, records modal, game-over overlay)
- **`style.css`**: All CSS styles, modal styles, and responsive media queries
- **`config.js`**: Data definitions & pure utilities (loaded first, no DOM access)
- **`engine.js`**: Game state, logic, sound, UI handlers (loaded second)
- **`render.js`**: Drawing & game loop (loaded third)
- **Rendering**: HTML5 Canvas 2D (id: `game-canvas`)
- **UI**: DOM-based HUD overlay on top of canvas (tower bar, wave controls, stats)
- **Fonts**: Orbitron (headings), Share Tech Mono (monospace UI)
- **Mobile**: Full touch support, responsive, PWA-capable meta tags

## Key Code Sections

### config.js — Data & Utilities
- `BALANCE` object — all game balance constants (gold, HP, speed, rewards, upgrades, etc.)
- `WORLDS` array (map data, 10x16 grid, 4 maps: SERPENT, SPIRAL, ZIGZAG, FORTRESS)
- `TOWER_DEFS` — tower type definitions (gun, cannon, sniper, frost)
- `ENEMY_TYPES` — enemy type definitions (grunt, runner, tank, swarm, healer, boss)
- `ATMOSPHERE_PALETTES` — 10 level atmosphere color palettes
- Helper functions: `shadeColor`, `lerpHex`, `lerpRgba`, `copyPalette`, `lerpPalette`
- `loadBestScores`, `saveBestScore` (localStorage)

### engine.js — State, Logic, Sound, UI
- Canvas/wrapper references, map variables & functions (padMap, scatterRocks, resize, buildPath)
- Game state variables (gold, lives, score, towers, enemies, bullets, particles, etc.)
- Extra spawn points system (`extraSpawnPoints`, `buildPathFromEdge`, `findExtraSpawnCandidates`, `addExtraSpawnPoint`, `rebuildExtraSpawnPaths`) — from level 2+, enemies enter from additional map edges via path-only BFS routing
- Atmosphere state & ambient particles
- Sound engine (Web Audio, procedural SFX)
- HUD updates, UI event handlers (tower selection, speed/auto/sound buttons, hover/touch, canvas tap)
- Records modal (`openRecords`, click on "TAWER" title to open, clear records button)
- Game logic: startWave, getWaveComposition, spawnEnemy, update, levelUp, damageEnemy, endGame
- Tower animated state: `scannerAngle`, `smokeTimer`, `crystalPhase` (updated per frame in tower loop)
- Cannon L3 idle smoke wisps (spawns trail particles every 3s)
- Restart handler

### render.js — Drawing & Game Loop
- **Tower icon functions**: `drawGunIcon`, `drawCannonIcon`, `drawSniperIcon`, `drawFrostIcon` — type-specific icons for tower bar buttons
- **`drawTowerIcon`** — dispatcher to icon functions, shared range ring + glow
- **In-game tower draw functions** (called per tower per frame):
  - `drawGunTower` — hexagonal base, barrel with cooling ridges (2/3/4 by level), L2+ rotating scanner dot, L3 energy core gradient + scanner trail
  - `drawCannonTower` — rounded rect base with armor plate lines, T-shaped muzzle brake, ammo feeds, L2+ loading mechanism with recoil, L3 corner reinforcements + inner glow
  - `drawSniperTower` — diamond base (rotates with aim), extra-long barrel, scope lens, tripod struts (L3 dog-leg), L2 dashed laser sight, L3 solid laser + impact dot + scope halo
  - `drawFrostTower` — 6-pointed crystalline star base, floating rotating diamond crystal, frost mist dots (animated at L3), L3 aurora arc + crystal glow, L2+ orbiting ice shards (2→3), L3 shard trails
- **Tower draw loop** in `draw()` — type dispatcher for base/barrel/center, shared range ring, ground glow, L3 halo, upgrade rings, muzzle flash, level pips, cost labels
- **Ghost preview** — type-specific shapes (hex/roundrect/diamond/crystal) instead of generic circle
- **Extra spawn portal rendering** — static markers + active portal vortex for extra spawn points
- `draw()` function (all canvas rendering)
- `gameLoop` function
- Init: resize listener, first resize, updateHUD, requestAnimationFrame

## Game Constants
All balance numbers live in the `BALANCE` object in `config.js`. Key values:
- Grid: 10 cols x 16 rows, tile size `TILE` computed from canvas
- Starting gold: 300, starting lives: 10
- 4 tower types: gun (50g), cannon (100g), sniper (150g), frost (75g)
- 6 enemy types: grunt, runner, tank, swarm, healer, boss (every 5 waves)
- Kill reward base: `3.675 * 1.169` scaled by enemy type multiplier
- Level-up every 10 waves (towers kept, gold bonus, +3 lives, atmosphere change, extra spawn point from L2+)
- Spawn interval: 600ms between enemies
- Speed multiplier: 0.857375 (applies to all enemy speeds)
- Frost slow: 40% speed for 1500ms; Cannon splash: 50% damage in 35-unit radius
- Wave completion bonus: `10.5 + floor(wave * 1.575)` gold
- Level-up bonus: `63 + level * 15.75` gold, +3 lives (capped at 10)
- Extra spawn points: ~35% of mobs per extra spawn routed there (same total count, split across entrances)

## Tower Visual Progression

| Feature | L1 | L2 | L3 |
|---|---|---|---|
| Gun ridges | 2 | 3 | 4 + energy core |
| Gun scanner | — | Rotating dot | Dot + trail |
| Cannon armor lines | 2 | 3 + loader | 3 + corners + glow |
| Cannon smoke | — | — | Idle wisps |
| Sniper laser | — | Dashed | Solid + impact dot |
| Sniper struts | Plain | + feet | Dog-leg + feet |
| Frost shards | 0 | 2 orbiting | 3 + trails |
| Frost mist | Static dots | Static dots | Animated drift + aurora |

## Conventions
- All game state is in module-level variables (no classes, no modules)
- Enemies/towers/bullets stored as plain object arrays
- Canvas redraws every frame via `requestAnimationFrame`
- Colors use hex strings; tower/enemy types have distinct color identities
- UI buttons wired up via `onclick` attributes and `querySelectorAll` in init
- Towers upgradeable to level 3 by tapping; upgrade cost is 50% of base placement cost
- Records stored in localStorage under key `tawer_best` (JSON object keyed by world name)
- Click "TAWER" title to view records modal