# TAWER — Tower Defense Game

## Overview
HTML5 canvas tower defense game split across 3 files. No build tools, no dependencies, no frameworks.

## Architecture
- **`index.html`**: HTML structure only (canvas, HUD, tower buttons, modals)
- **`style.css`**: All CSS styles and responsive media queries
- **`game.js`**: All game logic (rendering, state, maps, towers, enemies, sound)
- **Rendering**: HTML5 Canvas 2D (id: `game-canvas`)
- **UI**: DOM-based HUD overlay on top of canvas (tower bar, wave controls, stats)
- **Fonts**: Orbitron (headings), Share Tech Mono (monospace UI)
- **Mobile**: Full touch support, responsive, PWA-capable meta tags

## Key Code Sections (in game.js)
- Map definitions (`WORLDS` array, 10x16 grid), BFS path computation
- Game state variables (gold, lives, score, towers, enemies, etc.)
- `TOWER_DEFS` — tower type definitions (gun, cannon, sniper, frost)
- Game speed / auto-wave controls
- Tower placement, upgrade, and selection logic
- `ENEMY_TYPES` — enemy type definitions (grunt, runner, tank, swarm, healer, boss)
- Wave spawning, scaling formulas, and composition logic
- Game loop, update (spawning, movement, targeting, bullets, damage), levelUp
- Atmosphere palettes and lerping
- Sound engine (Web Audio, procedural SFX)
- Rendering (draw function)

## Game Constants
- Grid: 10 cols x 16 rows, tile size `TILE` computed from canvas
- Starting gold: 300, starting lives: 30
- 4 tower types: gun (50g), cannon (100g), sniper (150g), frost (75g)
- 6 enemy types: grunt, runner, tank, swarm, healer, boss (every 5 waves)
- Level-up every 10 waves (towers kept, gold bonus, +3 lives, atmosphere change)
- Spawn interval: 600ms between enemies
- Frost slow: 40% speed for 1500ms; Cannon splash: 50% damage in 35-unit radius
- Wave completion bonus: `15 + floor(wave * 2)` gold
- Level-up bonus: `100 + level * 25` gold, +3 lives (capped at 30)

## Conventions
- All game state is in module-level variables (no classes, no modules)
- Enemies/towers/bullets stored as plain object arrays
- Canvas redraws every frame via `requestAnimationFrame`
- Colors use hex strings; tower/enemy types have distinct color identities
- UI buttons wired up via `onclick` attributes and `querySelectorAll` in init
- No sell/upgrade mechanic for towers — placement is permanent
