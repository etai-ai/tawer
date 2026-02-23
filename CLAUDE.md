# TAWER — Tower Defense Game

## Overview
HTML5 canvas tower defense game split across 3 files + config. No build tools, no dependencies, no frameworks.

## Architecture
- **`index.html`**: HTML structure (canvas, HUD, tower buttons, records modal, game-over overlay)
- **`style.css`**: All CSS styles, modal styles, and responsive media queries
- **`config.js`**: Data definitions & pure utilities (loaded first, no DOM access)
- **`crazygames.js`**: CrazyGames SDK v3 wrapper (loaded after config, before engine)
- **`engine.js`**: Game state, logic, sound, UI handlers (loaded after crazygames)
- **`render.js`**: Drawing & game loop (loaded third)
- **Rendering**: HTML5 Canvas 2D (id: `game-canvas`)
- **UI**: DOM-based HUD overlay on top of canvas (tower bar, wave controls, stats)
- **Fonts**: Orbitron (headings), Share Tech Mono (monospace UI)
- **Mobile**: Full touch support, responsive, PWA-capable meta tags

## Key Code Sections

### config.js — Data & Utilities
- `BALANCE` object — all game balance constants (gold, HP, speed, rewards, upgrades, etc.)
- `WORLDS` array (map data, 10x16 grid, 2 handcrafted maps: SPIRAL, FORTRESS)
- Random map generator: `mulberry32` (seeded PRNG), `generateRandomMap(seed, strategy)` — 4 strategies (serpentine, switchback, winding, comb), BFS validation, dead-end pruning, min path length 50
- 4 generated worlds appended to WORLDS: LABYRINTH, GAUNTLET, CRUCIBLE, VORTEX (fixed seeds for reproducible records)
- Total 6 maps: 2 handcrafted + 4 procedurally generated
- `TOWER_TIERS` array — 4 evolution tiers (STANDARD, ADVANCED, ELITE, LEGENDARY), each with 4 tower defs
- `EVOLUTION_LEVELS` — levels that trigger tower evolution [5, 10, 15]
- `TOWER_DEFS` — active tower type definitions (swapped on evolution)
- `ENEMY_TYPES` — enemy type definitions (grunt, runner, tank, swarm, healer, boss)
- `ATMOSPHERE_PALETTES` — 10 level atmosphere color palettes (rock colors boosted for dark visibility)
- Helper functions: `shadeColor`, `lerpHex`, `lerpRgba` (with `_rgbaCache` for perf), `copyPalette`, `lerpPalette`
- `loadBestScores`, `saveBestScore` (localStorage)

### crazygames.js — CrazyGames SDK v3 Wrapper
- `CG` global object — wraps all SDK calls with graceful fallback (game works standalone without SDK)
- `CG.init()` — async init, detects environment ('local', 'crazygames', 'disabled'), respects `muteAudio` setting
- `CG.loadingStart/Stop()` — called from index.html init script
- `CG.gameplayStart()` — called on first wave start
- `CG.gameplayStop()` — called on game over
- `CG.happytime()` — called on new record (triggers CrazyGames confetti)
- `CG.requestMidgame()` — midgame ad on restart, returns promise; pauses/mutes during ad
- `CG.requestRewarded()` — rewarded ad, returns promise resolving to true/false
- `CG.dataGet/Set/Remove(key)` — cloud save wrapper, falls back to localStorage when SDK unavailable
- Audio mute/restore: respects CrazyGames `muteAudio` platform setting, restores user preference after ads

### index.html — Script Load Order & SDK Init
- CrazyGames SDK v3 script loaded in head: `https://sdk.crazygames.com/crazygames-sdk-v3.js`
- Load order: SDK → config.js → crazygames.js → engine.js → render.js → async init block
- Init block: `CG.loadingStart()` → `CG.init()` → `CG.loadingStop()`, plus scroll prevention for iframe embed


- Canvas/wrapper references, map variables & functions (padMap, scatterRocks, resize, buildPath)
- Game state variables (gold, lives, score, towers, enemies, bullets, particles, etc.)
- Extra spawn points system (`extraSpawnPoints`, `buildPathFromEdge`, `findExtraSpawnCandidates`, `addExtraSpawnPoint`, `rebuildExtraSpawnPaths`) — from level 2+, enemies enter from additional map edges via path-only BFS routing
- Atmosphere state & ambient particles
- Sound engine (Web Audio, procedural SFX)
- HUD updates, UI event handlers (tower selection, speed/auto/sound buttons, hover/touch, canvas tap)
- Records modal (`openRecords`, click on "TAWER" title to open, clear records button)
- Tower evolution system (`evolveTowers`, `refreshTowerBar`, `currentTier`) — resets towers to L1 with new tier stats at levels 5/10/15
- Evolution notification with `evolutionWaiting` — pauses game until player taps "TAP TO CONTINUE"
- Game logic: startWave, getWaveComposition, spawnEnemy, update, levelUp, damageEnemy, endGame
- Tower animated state: `scannerAngle`, `smokeTimer`, `crystalPhase` (updated per frame in tower loop)
- Cannon L3 idle smoke wisps (spawns trail particles every 3s)
- Cheat keys: K (kill all mobs), G (+1000 gold), L (skip to next level)
- Particle/array caps for mobile perf: particles (150), trail particles (100), light sources (20)
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
- **Spawn point markers** — unified style for main + extra spawns (pulsing glow, ring, arrow, portal vortex)
- **Rock tiles** — organic wobbly boulders (seeded per tile), no grid lines, grass base shows through
- `draw()` function (all canvas rendering)
- `gameLoop` function
- Init: resize listener, first resize, updateHUD, requestAnimationFrame

## Game Constants
All balance numbers live in the `BALANCE` object in `config.js`. Key values:
- Grid: 10 cols x 16 rows, tile size `TILE` computed from canvas
- Starting gold: 300, starting lives: 10
- 4 tower types: gun (50g), cannon (100g), sniper (150g), frost (75g)
- 6 enemy types: grunt, runner, tank, swarm, healer, boss (every 5 waves)
- Kill reward base: `3.675 * 1.546` scaled by enemy type multiplier
- Mob count multiplier: 0.57528; HP multiplier: 1.1
- Level-up every 10 waves (towers kept, gold bonus, +3 lives, atmosphere change, extra spawn point from L2+)
- Tower evolution at levels 5, 10, 15 (ADVANCED, ELITE, LEGENDARY tiers)
- Spawn interval: 600ms between enemies
- Speed multiplier: 0.8145 (applies to all enemy speeds)
- Tank: speedMul 0.51, hpMul 3.0 (slow and beefy)
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
- Gold/score displayed as `Math.floor()` integers
- No `shadowBlur` in per-frame rendering (mobile perf); only used in one-time icon draws
- Gradients minimized: only L3 energy cores, capped light sources, firing towers
- Tower ambient lights only render for towers that just fired (not idle)