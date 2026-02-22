# TAWER - Player Manual

## How to Play

TAWER is an endless tower defense game. Place towers along the path to destroy waves of enemies before they reach the exit. Survive as long as you can.

### Getting Started

- You start with **300 gold** and **30 lives**
- A random map is selected each game
- Waves auto-start by default (AUTO mode)
- Click **START** to begin the first wave

### Placing Towers

1. Select a tower type from the bottom bar (GUN, CANNON, SNIPER, or FROST)
2. Hover over the map to preview placement — a range ring shows the tower's reach
3. Click/tap a **grass tile** to place the tower
4. Tower buttons gray out when you can't afford them

Towers cannot be sold, upgraded, or moved once placed.

### Selecting Placed Towers

- Tap a placed tower to highlight it and see its range
- Tap again to deselect

### Controls

| Control | Action |
|---------|--------|
| Click/tap tower button | Select tower type to place |
| Click/tap grass tile | Place selected tower |
| Click/tap placed tower | Show its range ring |
| **START** | Begin next wave (when not in AUTO) |
| **AUTO / MANUAL** | Toggle automatic wave progression |
| **1X / 2X / 3X** | Cycle game speed |

Touch controls are fully supported on mobile.

---

## Towers

| Tower | Cost | Damage | Range | Fire Rate | Special |
|-------|------|--------|-------|-----------|---------|
| **GUN** | 50g | 12 | 110 | Fast (450ms) | Single target, reliable all-rounder |
| **CANNON** | 100g | 40 | 95 | Slow (1100ms) | **Splash damage** in a 35-unit radius (50% to nearby) |
| **SNIPER** | 150g | 65 | 220 | Very slow (1800ms) | Longest range, highest single-target damage |
| **FROST** | 75g | 5 | 110 | Very fast (350ms) | **Slows enemies to 40% speed** for 1.5s |

### Tower Tips

- **GUN** is your bread and butter — cheap, fast, and effective early on
- **CANNON** excels against swarms with its area-of-effect splash
- **SNIPER** is the boss killer — massive damage from extreme range
- **FROST** is a force multiplier — place it where enemies pass by other towers to maximize their damage

All towers target the closest enemy within range.

---

## Enemies

| Enemy | Shape | Speed | HP | Reward | First Appears |
|-------|-------|-------|-----|--------|---------------|
| **Grunt** | Green Circle | Normal | Normal | Normal | Wave 1 |
| **Runner** | Orange Diamond | **1.6x fast** | 0.5x (fragile) | 1.2x | Wave 3 |
| **Tank** | Blue Square | 0.6x (slow) | **2.5x tough** | 2x | Wave 5 |
| **Swarm** | Pink Triangle | 1.3x fast | **0.35x (very fragile)** | 0.6x | Wave 7 |
| **Healer** | Teal Hexagon | 0.9x | 1.2x | 1.5x | Wave 9 |
| **Boss** | Red Star | 0.5x (slow) | **5x massive** | **6x** | Every 5 waves |

### Enemy Behaviors

- **Grunt**: The standard enemy. Nothing special, but they keep coming.
- **Runner**: Blazing fast but dies quickly. Can slip past slow-firing towers.
- **Tank**: A wall of HP. Slow but takes a beating. Snipers are your best bet.
- **Swarm**: Tiny and fast, they come in large numbers. Cannons shred them.
- **Healer**: Tougher than a grunt and worth more gold. Identifiable by its pulsing hexagon shape.
- **Boss**: Massive HP pool, large and slow. Spawns every 5 waves; double bosses every 15 waves.

When slowed by a Frost tower, enemies turn **cyan** and move at 40% speed for 1.5 seconds.

---

## Waves

### Scaling

Enemy stats increase every wave:

| Stat | Wave 1 | Later Waves |
|------|--------|-------------|
| HP (base) | 15 | 15 + wave x 10 + wave^1.6 |
| Speed (base) | 0.7 | 0.8 + wave x 0.04 (capped at 1.2) |
| Count | 3 | 3 + floor(wave x 1.5 + wave^0.8) |
| Kill Reward | 8g | 8 + floor(wave x 0.8) |

### Enemy Introduction Schedule

Enemy types unlock progressively and cycle through the available pool:

| Wave | Enemies Available |
|------|-------------------|
| 1-2 | Grunts only |
| 3-4 | + Runners |
| 5-6 | + Tanks |
| 7-8 | + Swarms |
| 9+ | + Healers (all types) |

### Bosses

- **Every 5 waves** (5, 10, 15, 20...): 1 Boss spawns
- **Every 15 waves** (15, 30, 45...): 2 Bosses spawn

### Level Up

Every **10 waves**, you level up:

- All towers are **kept** — nothing is destroyed
- You receive a gold bonus: **100 + level x 25** gold
- You gain **+3 lives** (capped at 30)
- The atmosphere shifts to a new color palette

---

## Gold & Economy

### Earning Gold

| Source | Amount |
|--------|--------|
| Killing enemies | Varies by type and wave (see enemy table) |
| Wave completion bonus | 15 + wave x 2 |
| Level-up bonus | 100 + level x 25 |

### Spending Gold

Gold is only spent on placing towers. There is no sell or upgrade system — choose placements carefully.

---

## Scoring

- Each enemy killed grants: **enemy reward x 10** score points
- Score is displayed in the top HUD
- Your final score is shown on the game over screen along with the wave reached

---

## Lives

- You start with **30 lives**
- Each enemy that reaches the exit costs **1 life**
- When lives hit **0**, the game is over
- The game over screen shows "DEFEATED" with your score and wave number
- Press **RESTART** to play again

---

## Game Speed

Cycle through speed modes by pressing the speed button:

- **1X** — Normal speed
- **2X** — Double speed
- **3X** — Triple speed

Affects all movement, firing, and spawning. Useful for speeding through early waves.

---

## Strategy Tips

1. **Start with GUNs** — They're cheap and effective for early waves
2. **Add FROST early** — Slowing enemies amplifies all your other towers
3. **Place FROST before damage towers** — Enemies hit the slow first, then crawl through your kill zone
4. **Save for SNIPERS before boss waves** (5, 10, 15...) — Their high damage melts bosses
5. **Use CANNONS against swarms** (wave 7+) — Splash damage handles groups efficiently
6. **Level-ups are free power** — Every 10 waves you get bonus gold, +3 lives, and keep all towers
7. **Cover chokepoints** — Place towers where the path turns so enemies spend more time in range
