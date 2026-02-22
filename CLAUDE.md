# TAWER — Tower Defense Game

## Overview
HTML5 canvas tower defense game split across 3 files. No build tools, no dependencies, no frameworks.

## Architecture
- **`index.html`**: HTML structure only (canvas, HUD, tower buttons, modals)
- **`style.css`**: All CSS styles and responsive media queries
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
- `WORLDS` array (map data, 10x16 grid)
- `TOWER_DEFS` — tower type definitions (gun, cannon, sniper, frost)
- `ENEMY_TYPES` — enemy type definitions (grunt, runner, tank, swarm, healer, boss)
- `ATMOSPHERE_PALETTES` — 10 level atmosphere color palettes
- Helper functions: `shadeColor`, `lerpHex`, `lerpRgba`, `copyPalette`, `lerpPalette`
- `loadBestScores`, `saveBestScore` (localStorage)

### engine.js — State, Logic, Sound, UI
- Canvas/wrapper references, map variables & functions (padMap, scatterRocks, resize, buildPath)
- Game state variables (gold, lives, score, towers, enemies, bullets, particles, etc.)
- Atmosphere state & ambient particles
- Sound engine (Web Audio, procedural SFX)
- HUD updates, UI event handlers (tower selection, speed/auto/sound buttons, hover/touch, canvas tap)
- Game logic: startWave, getWaveComposition, spawnEnemy, update, levelUp, damageEnemy, endGame
- Destructible tiles & path shifting
- Restart handler

### render.js — Drawing & Game Loop
- `drawTowerIcon` + initial icon rendering on tower buttons
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
- Level-up every 10 waves (towers kept, gold bonus, +3 lives, atmosphere change)
- Spawn interval: 600ms between enemies
- Frost slow: 40% speed for 1500ms; Cannon splash: 50% damage in 35-unit radius
- Wave completion bonus: `10.5 + floor(wave * 1.575)` gold
- Level-up bonus: `63 + level * 15.75` gold, +3 lives (capped at 10)

## Conventions
- All game state is in module-level variables (no classes, no modules)
- Enemies/towers/bullets stored as plain object arrays
- Canvas redraws every frame via `requestAnimationFrame`
- Colors use hex strings; tower/enemy types have distinct color identities
- UI buttons wired up via `onclick` attributes and `querySelectorAll` in init
- Towers upgradeable to level 3 by tapping; upgrade cost is 50% of base placement cost
