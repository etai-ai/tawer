# TAWER — Tower Defense Game

## Overview
Single-file HTML5 canvas tower defense game (~1245 lines). Everything (HTML, CSS, JS) lives in `index.html`. No build tools, no dependencies, no frameworks.

## Architecture
- **Single file**: `index.html` contains all markup, styles, and game logic
- **Rendering**: HTML5 Canvas 2D (id: `game-canvas`)
- **UI**: DOM-based HUD overlay on top of canvas (tower bar, wave controls, stats)
- **Fonts**: Orbitron (headings), Share Tech Mono (monospace UI)
- **Mobile**: Full touch support, responsive, PWA-capable meta tags

## Key Code Sections (in index.html)
- **Lines ~10-200**: CSS styles
- **Lines ~300-340**: HTML structure (canvas, HUD, tower buttons, modals)
- **Lines ~360-500**: Map definitions (`MAPS` array, 10x16 grid), BFS path computation
- **Lines ~500-510**: Game state variables (gold, lives, score, towers, enemies, etc.)
- **Lines ~510-515**: `TOWER_DEFS` — tower type definitions (gun, cannon, sniper, frost)
- **Lines ~600-630**: Game speed / auto-wave controls
- **Lines ~660-695**: Tower placement and selection logic
- **Lines ~700-710**: `ENEMY_TYPES` — enemy type definitions (grunt, runner, tank, swarm, healer, boss)
- **Lines ~712-762**: Wave spawning, scaling formulas, and composition logic
- **Lines ~770-905**: Game loop, update (spawning, movement, targeting, bullets, damage), levelUp
- **Lines ~940+**: Rendering (draw function)

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
