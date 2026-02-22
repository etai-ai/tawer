// --- RENDER: Drawing & game loop ---
// Depends on: config.js, engine.js

function drawTowerIcon(cvs, type) {
  const c = cvs.getContext('2d');
  const s = cvs.width; // 44
  const cx = s / 2, cy = s / 2;
  const def = TOWER_DEFS[type];
  const col = def.color;

  c.clearRect(0, 0, s, s);

  // Range hint ring
  c.strokeStyle = col + '22';
  c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, s * 0.46, 0, Math.PI * 2); c.stroke();

  // Base circle
  c.fillStyle = '#1a2535';
  c.beginPath(); c.arc(cx, cy, s * 0.32, 0, Math.PI * 2); c.fill();
  c.strokeStyle = col;
  c.lineWidth = 2;
  c.stroke();

  // Barrel — unique per type
  c.strokeStyle = col;
  c.lineCap = 'round';
  if (type === 'gun') {
    c.lineWidth = s * 0.09;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.38); c.stroke();
  } else if (type === 'cannon') {
    c.lineWidth = s * 0.14;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.32); c.stroke();
    // muzzle flare hint
    c.fillStyle = col + '44';
    c.beginPath(); c.arc(cx, cy - s * 0.34, s * 0.1, 0, Math.PI * 2); c.fill();
  } else if (type === 'sniper') {
    c.lineWidth = s * 0.06;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.44); c.stroke();
    // crosshair
    c.strokeStyle = col + '88';
    c.lineWidth = 1;
    const ch = s * 0.08;
    c.beginPath(); c.moveTo(cx - ch, cy - s * 0.44); c.lineTo(cx + ch, cy - s * 0.44); c.stroke();
  } else if (type === 'frost') {
    c.lineWidth = s * 0.08;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.34); c.stroke();
    // frost spikes
    c.lineWidth = s * 0.05;
    c.beginPath(); c.moveTo(cx - s * 0.1, cy - s * 0.22); c.lineTo(cx, cy - s * 0.34); c.lineTo(cx + s * 0.1, cy - s * 0.22); c.stroke();
  }

  // Center dot
  c.fillStyle = col;
  c.beginPath(); c.arc(cx, cy, s * 0.07, 0, Math.PI * 2); c.fill();

  // Glow
  c.shadowColor = col;
  c.shadowBlur = 6;
  c.fillStyle = col + '44';
  c.beginPath(); c.arc(cx, cy, s * 0.12, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;
}

// Draw all tower button icons
document.querySelectorAll('.tower-btn').forEach(btn => {
  const cvs = btn.querySelector('.icon-canvas');
  if (cvs) drawTowerIcon(cvs, btn.dataset.type);
});

// --- DRAW ---
function draw() {
  ctx.fillStyle = currentAtmosphere.grass;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(GRID_OX + screenShake.x, GRID_OY + screenShake.y);

  const rStart = -Math.ceil(GRID_OY / TILE);
  const rEnd = MAP_ROWS + Math.ceil((canvas.height - GRID_OY - H) / TILE);
  const cStart = -Math.ceil(GRID_OX / TILE);
  const cEnd = MAP_COLS + Math.ceil((canvas.width - GRID_OX - W) / TILE);

  for (let r = rStart; r < rEnd; r++) {
    for (let c = cStart; c < cEnd; c++) {
      const x = c * TILE, y = r * TILE;
      const inGrid = r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS;
      const v = inGrid ? mapData[r][c] : 0;
      if (v === 0 || v === 4) {
        const isRock = v === 4;
        ctx.fillStyle = isRock ? currentAtmosphere.rock : currentAtmosphere.grass;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = currentAtmosphere.gridLine; ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, TILE, TILE);
        ctx.fillStyle = isRock ? currentAtmosphere.rockTex : currentAtmosphere.grassTex;
        if (isRock) {
          // Stone shapes
          ctx.beginPath();
          ctx.moveTo(x+TILE*0.1,y+TILE*0.35); ctx.lineTo(x+TILE*0.2,y+TILE*0.15);
          ctx.lineTo(x+TILE*0.45,y+TILE*0.12); ctx.lineTo(x+TILE*0.5,y+TILE*0.3);
          ctx.lineTo(x+TILE*0.3,y+TILE*0.4); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x+TILE*0.5,y+TILE*0.5); ctx.lineTo(x+TILE*0.6,y+TILE*0.38);
          ctx.lineTo(x+TILE*0.85,y+TILE*0.42); ctx.lineTo(x+TILE*0.9,y+TILE*0.6);
          ctx.lineTo(x+TILE*0.65,y+TILE*0.68); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x+TILE*0.2,y+TILE*0.6); ctx.lineTo(x+TILE*0.35,y+TILE*0.55);
          ctx.lineTo(x+TILE*0.5,y+TILE*0.7); ctx.lineTo(x+TILE*0.4,y+TILE*0.85);
          ctx.lineTo(x+TILE*0.15,y+TILE*0.8); ctx.closePath(); ctx.fill();
          // Highlight edges
          ctx.strokeStyle = currentAtmosphere.gridLine;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x+TILE*0.2,y+TILE*0.15); ctx.lineTo(x+TILE*0.45,y+TILE*0.12);
          ctx.moveTo(x+TILE*0.6,y+TILE*0.38); ctx.lineTo(x+TILE*0.85,y+TILE*0.42);
          ctx.moveTo(x+TILE*0.35,y+TILE*0.55); ctx.lineTo(x+TILE*0.5,y+TILE*0.7);
          ctx.stroke();
        } else {
          ctx.fillRect(x + TILE*0.25, y + TILE*0.35, TILE*0.12, TILE*0.12);
          ctx.fillRect(x + TILE*0.65, y + TILE*0.6, TILE*0.1, TILE*0.1);
        }
      } else if (v === 5) {
          // Cracked/destroyed tile — path with rubble texture
          ctx.fillStyle = currentAtmosphere.path;
          ctx.fillRect(x, y, TILE, TILE);
          const inset5 = TILE * 0.06;
          ctx.fillStyle = currentAtmosphere.pathInset;
          ctx.fillRect(x + inset5, y + inset5, TILE - inset5*2, TILE - inset5*2);
          // Crack lines
          ctx.strokeStyle = '#ff884488';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + TILE*0.1, y + TILE*0.3);
          ctx.lineTo(x + TILE*0.4, y + TILE*0.5);
          ctx.lineTo(x + TILE*0.3, y + TILE*0.8);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + TILE*0.6, y + TILE*0.1);
          ctx.lineTo(x + TILE*0.5, y + TILE*0.5);
          ctx.lineTo(x + TILE*0.8, y + TILE*0.7);
          ctx.stroke();
          // Rubble dots
          ctx.fillStyle = '#ff884433';
          ctx.beginPath(); ctx.arc(x + TILE*0.25, y + TILE*0.4, TILE*0.06, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + TILE*0.7, y + TILE*0.55, TILE*0.05, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + TILE*0.45, y + TILE*0.75, TILE*0.04, 0, Math.PI*2); ctx.fill();
          // Glow pulse for recently cracked
          const crackInfo = crackedTiles.find(ct => ct.r === r && ct.c === c);
          if (crackInfo && crackInfo.age < 3000) {
            const pulse = Math.sin(crackInfo.age * 0.005) * 0.15 + 0.15;
            ctx.fillStyle = `rgba(255, 136, 68, ${pulse})`;
            ctx.fillRect(x, y, TILE, TILE);
          }
          ctx.strokeStyle = currentAtmosphere.pathBorder; ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, TILE, TILE);
      } else {
        ctx.fillStyle = v === 2 ? currentAtmosphere.startTile : v === 3 ? currentAtmosphere.endTile : currentAtmosphere.path;
        ctx.fillRect(x, y, TILE, TILE);
        const inset = TILE * 0.06;
        ctx.fillStyle = v === 2 ? currentAtmosphere.startInset : v === 3 ? currentAtmosphere.endInset : currentAtmosphere.pathInset;
        ctx.fillRect(x + inset, y + inset, TILE - inset*2, TILE - inset*2);
        ctx.strokeStyle = currentAtmosphere.pathBorder; ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  if (path.length > 1) {
    const glowIntensity = 1 + Math.min(level - 1, 9) * 0.25;
    ctx.strokeStyle = currentAtmosphere.glowOuter;
    ctx.lineWidth = TILE * 0.75 * glowIntensity; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.strokeStyle = currentAtmosphere.glowInner;
    ctx.lineWidth = TILE * 0.4 * glowIntensity;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }

  // --- SPAWN PORTAL VORTEX ---
  if (spawnPortal.active && path.length > 0) {
    const sp = spawnPortal;
    const t = 1 - sp.life / sp.maxLife;
    const intensity = sp.life > sp.maxLife * 0.8 ? (1 - (sp.life - sp.maxLife * 0.8) / (sp.maxLife * 0.2)) : (sp.life < sp.maxLife * 0.2 ? sp.life / (sp.maxLife * 0.2) : 1);
    const px = path[0].x, py = path[0].y;
    const portalR = TILE * (0.5 + 0.3 * Math.sin(gameTime * 0.003));

    // Rotating arcs
    ctx.save();
    ctx.translate(px, py);
    for (let ring = 0; ring < 3; ring++) {
      const rot = gameTime * (0.002 + ring * 0.001) * (ring % 2 === 0 ? 1 : -1);
      ctx.globalAlpha = intensity * (0.35 - ring * 0.08);
      ctx.strokeStyle = ring === 0 ? currentAtmosphere.accent : ring === 1 ? '#ffffff' : '#ff4444';
      ctx.lineWidth = 2.5 - ring * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, portalR * (1 + ring * 0.35), rot, rot + Math.PI * 1.3);
      ctx.stroke();
    }
    // Core glow
    ctx.globalAlpha = intensity * 0.4;
    const portalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, portalR * 0.8);
    portalGrad.addColorStop(0, '#ffffff');
    portalGrad.addColorStop(0.4, currentAtmosphere.accent);
    portalGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = portalGrad;
    ctx.beginPath(); ctx.arc(0, 0, portalR * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    // Portal light
    if (Math.random() < 0.3) {
      lightSources.push({ x: px, y: py, radius: TILE * 2, color: currentAtmosphere.accent, life: 100, maxLife: 100 });
    }
  }

  // Ambient particles — more and brighter at higher levels
  const ambientAlphaScale = 0.2 + Math.min(level - 1, 9) * 0.08;
  for (const ap of ambientParticles) {
    const lifeT = ap.life / ap.maxLife;
    const fadeOut = Math.min(lifeT * 5, 1);
    const fadeIn = Math.min((1 - lifeT) * 5, 1);
    const alpha = Math.min(fadeIn, fadeOut) * ambientAlphaScale;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = currentAtmosphere.accent;
    ctx.shadowColor = currentAtmosphere.accent;
    ctx.shadowBlur = level >= 5 ? 6 : 0;
    ctx.beginPath(); ctx.arc(ap.x, ap.y, ap.size * (1 + Math.min(level-1, 9) * 0.1), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  for (const t of towers) {
    const sel = t === selectedPlacedTower;
    const lvl = t.level || 1;
    const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5; // 0-1 pulsing

    // Range ring
    ctx.strokeStyle = sel ? `${t.color}44` : `${t.color}10`;
    ctx.lineWidth = sel ? 1.5 : 0.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI*2); ctx.stroke();

    // Ambient ground glow (contained within cell)
    if (lvl >= 2) {
      const glowR = TILE * 0.45;
      const glowAlpha = lvl >= 3 ? 0.25 + 0.10 * pulse : 0.12 + 0.05 * pulse;
      const grad = ctx.createRadialGradient(t.x, t.y, TILE * 0.15, t.x, t.y, glowR);
      grad.addColorStop(0, t.color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, t.color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(t.x, t.y, glowR, 0, Math.PI*2); ctx.fill();
    }

    // Outer glow halo for level 3 (shadow blur only, no extra radius)
    if (lvl >= 3) {
      ctx.save();
      ctx.shadowColor = t.color; ctx.shadowBlur = 14 + 4 * pulse;
      ctx.strokeStyle = t.color + '70'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, TILE*0.38, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    // Concentric upgrade rings (tight around base)
    if (lvl >= 3) {
      ctx.strokeStyle = t.color + '60'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, TILE*0.42, 0, Math.PI*2); ctx.stroke();
    }
    if (lvl >= 2) {
      ctx.strokeStyle = t.color + '70'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, TILE*0.38, 0, Math.PI*2); ctx.stroke();
    }

    // Base circle — same size, bolder per level
    const baseR = TILE * 0.35;
    ctx.fillStyle = sel ? '#1e3040' : '#1a2535';
    ctx.beginPath(); ctx.arc(t.x, t.y, baseR, 0, Math.PI*2); ctx.fill();

    // Color-tinted fill at higher levels (bolder tint)
    if (lvl >= 2) {
      ctx.fillStyle = t.color + (lvl >= 3 ? '28' : '14');
      ctx.beginPath(); ctx.arc(t.x, t.y, baseR, 0, Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = t.color; ctx.lineWidth = sel ? 3 : (1.5 + 1.0 * (lvl - 1)); ctx.stroke();

    // Barrel — thicker per level, fixed length, with recoil
    const recoilOff = (t.recoil || 0) * TILE * 0.12;
    const barrelW = TILE * (0.08 + 0.03 * (lvl - 1));
    const barrelLen = TILE * 0.4 - recoilOff;
    ctx.strokeStyle = t.color; ctx.lineWidth = barrelW;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(t.angle)*barrelLen, t.y + Math.sin(t.angle)*barrelLen); ctx.stroke();
    ctx.lineCap = 'butt';

    // Muzzle flash
    if ((t.muzzleFlash || 0) > 0.1) {
      const mf = t.muzzleFlash;
      const mfx = t.x + Math.cos(t.angle) * (barrelLen + TILE * 0.05);
      const mfy = t.y + Math.sin(t.angle) * (barrelLen + TILE * 0.05);
      const flashR = TILE * 0.15 * mf;
      ctx.save();
      ctx.globalAlpha = mf * 0.9;
      ctx.shadowColor = t.color; ctx.shadowBlur = 15 * mf;
      // Bright core
      const flashGrad = ctx.createRadialGradient(mfx, mfy, 0, mfx, mfy, flashR);
      flashGrad.addColorStop(0, '#ffffff');
      flashGrad.addColorStop(0.3, t.color);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath(); ctx.arc(mfx, mfy, flashR, 0, Math.PI * 2); ctx.fill();
      // Directional flash lines
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = mf * 0.6;
      ctx.lineWidth = 1;
      for (let fi = 0; fi < 3; fi++) {
        const fAngle = t.angle + (fi - 1) * 0.4;
        const fLen = TILE * 0.12 * mf;
        ctx.beginPath();
        ctx.moveTo(mfx, mfy);
        ctx.lineTo(mfx + Math.cos(fAngle) * fLen, mfy + Math.sin(fAngle) * fLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Center dot — brighter per level, same size
    ctx.fillStyle = lvl >= 3 ? '#ffffff' : (lvl >= 2 ? shadeColor(t.color, 60) : t.color);
    ctx.beginPath(); ctx.arc(t.x, t.y, TILE*0.07, 0, Math.PI*2); ctx.fill();

    // Level indicator pips (inside base, below center)
    if (lvl >= 2) {
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 3;
      for (let i = 0; i < lvl - 1; i++) {
        const px = t.x - (lvl - 2) * TILE * 0.06 + i * TILE * 0.12;
        const py = t.y + TILE * 0.18;
        ctx.beginPath(); ctx.arc(px, py, TILE * 0.035, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }

    // Upgrade cost label when selected and upgradeable
    if (sel && lvl < BALANCE.maxTowerLevel) {
      const cost = Math.floor(TOWER_DEFS[t.type].cost * BALANCE.upgradeCostRatio);
      ctx.fillStyle = gold >= cost ? '#ffd700' : '#ff4444';
      ctx.font = `bold ${Math.round(TILE*0.28)}px Share Tech Mono`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`\u2191 ${cost}g`, t.x, t.y - baseR - TILE * 0.08);
    }
    if (sel && lvl >= BALANCE.maxTowerLevel) {
      ctx.fillStyle = '#88ffaa';
      ctx.font = `bold ${Math.round(TILE*0.24)}px Share Tech Mono`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('MAX', t.x, t.y - baseR - TILE * 0.08);
    }
  }

  // Placement effects
  for (const pe of placeEffects) {
    const t = 1 - pe.life / pe.maxLife; // 0→1
    const alpha = 1 - t;
    // Expanding ring
    ctx.strokeStyle = pe.color;
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = 2.5 * (1 - t);
    ctx.beginPath(); ctx.arc(pe.x, pe.y, pe.range * t, 0, Math.PI * 2); ctx.stroke();
    // Inner flash
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = pe.color;
    ctx.beginPath(); ctx.arc(pe.x, pe.y, TILE * 0.5 * (1 - t), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    const et = ENEMY_TYPES[e.enemyType] || ENEMY_TYPES.grunt;
    const baseColor = e.slowTimer > 0 ? '#66ccff' : et.color;
    const strokeCol = e.slowTimer > 0 ? '#aaddff' : shadeColor(et.color, 50);
    const r = e.radius;
    const pulse = Math.sin(Date.now() * 0.004 + e.x) * 0.15 + 0.85;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(e.x + 1, e.y + 2, r * 0.9, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();

    // Outer glow
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = e.isBoss ? 10 : 5;

    ctx.lineWidth = e.isBoss ? 2.5 : 1.5;

    if (et.shape === 'circle') {
      // Grunt — outer ring + inner core (like a tower base)
      ctx.fillStyle = baseColor + '33';
      ctx.strokeStyle = strokeCol;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = baseColor;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
      // inner dot
      ctx.fillStyle = '#0a0c10';
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.2, 0, Math.PI * 2); ctx.fill();

    } else if (et.shape === 'diamond') {
      // Runner — rotating diamond with speed lines
      const rot = Date.now() * 0.003;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(rot);
      ctx.fillStyle = baseColor + '44';
      ctx.strokeStyle = strokeCol;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, r * 1.1); ctx.lineTo(-r * 0.7, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.3, 0);
      ctx.lineTo(0, r * 0.5); ctx.lineTo(-r * 0.3, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();

    } else if (et.shape === 'square') {
      // Tank — layered armor plates
      const s = r * 0.85;
      ctx.fillStyle = baseColor + '22';
      ctx.strokeStyle = strokeCol;
      ctx.fillRect(e.x - s, e.y - s, s * 2, s * 2);
      ctx.strokeRect(e.x - s, e.y - s, s * 2, s * 2);
      // inner plate
      const s2 = s * 0.6;
      ctx.fillStyle = baseColor + '55';
      ctx.fillRect(e.x - s2, e.y - s2, s2 * 2, s2 * 2);
      ctx.strokeRect(e.x - s2, e.y - s2, s2 * 2, s2 * 2);
      // core
      ctx.fillStyle = baseColor;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.25, 0, Math.PI * 2); ctx.fill();

    } else if (et.shape === 'triangle') {
      // Swarm — spinning shard
      const rot = Date.now() * 0.006;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(rot);
      ctx.fillStyle = baseColor + '66';
      ctx.strokeStyle = strokeCol;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.0);
      ctx.lineTo(r * 0.8, r * 0.6);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = baseColor;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

    } else if (et.shape === 'hex') {
      // Healer — pulsing hex with cross
      const pr = r * pulse;
      ctx.fillStyle = baseColor + '33';
      ctx.strokeStyle = strokeCol;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i - Math.PI / 6;
        const hx = e.x + Math.cos(a) * pr;
        const hy = e.y + Math.sin(a) * pr;
        i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // heal cross
      const cs = r * 0.3;
      const cw = r * 0.12;
      ctx.fillStyle = baseColor;
      ctx.fillRect(e.x - cs, e.y - cw, cs * 2, cw * 2);
      ctx.fillRect(e.x - cw, e.y - cs, cw * 2, cs * 2);

    } else if (et.shape === 'star') {
      // Boss — concentric rings + star corona
      ctx.fillStyle = baseColor + '22';
      ctx.strokeStyle = strokeCol;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 5 * i - Math.PI / 2 + Date.now() * 0.001;
        const sr = i % 2 === 0 ? r * 1.3 : r * 0.6;
        const sx = e.x + Math.cos(a) * sr;
        const sy = e.y + Math.sin(a) * sr;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // inner ring
      ctx.fillStyle = baseColor + '44';
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // core
      ctx.fillStyle = baseColor;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.25 * pulse, 0, Math.PI * 2); ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Hit flash overlay
    if (e.hitFlash > 0.1) {
      ctx.globalAlpha = e.hitFlash * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // HP bar
    const hpR = e.hp / e.maxHp;
    const barW = r*2.5, barH = Math.max(2, TILE*0.06);
    const bx = e.x - barW/2, by = e.y - r*1.4 - TILE*0.1;
    ctx.fillStyle = '#33000088'; ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = hpR > 0.5 ? '#00ff88' : hpR > 0.25 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(bx, by, barW*hpR, barH);
  }

  const bSz = Math.max(2, TILE*0.07);
  for (const b of bullets) {
    if (!b.alive) continue;
    const bt = b.towerType || 'gun';
    ctx.shadowColor = b.color; ctx.shadowBlur = 6;

    if (bt === 'cannon') {
      // Cannon: larger fiery orb
      const cSz = bSz * 2;
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, cSz);
      grad.addColorStop(0, '#ffee88');
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(b.x, b.y, cSz, 0, Math.PI*2); ctx.fill();
      // Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, bSz * 0.5, 0, Math.PI*2); ctx.fill();
    } else if (bt === 'sniper') {
      // Sniper: elongated streak/tracer
      const dx = b.target.alive ? b.target.x - b.x : b.tx - b.x;
      const dy = b.target.alive ? b.target.y - b.y : b.ty - b.y;
      const bAngle = Math.atan2(dy, dx);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(b.x - Math.cos(bAngle) * TILE * 0.25, b.y - Math.sin(bAngle) * TILE * 0.25);
      ctx.lineTo(b.x + Math.cos(bAngle) * TILE * 0.08, b.y + Math.sin(bAngle) * TILE * 0.08);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Bright tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, bSz * 0.6, 0, Math.PI*2); ctx.fill();
    } else if (bt === 'frost') {
      // Frost: crystalline sparkle
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(gameTime * 0.008);
      ctx.fillStyle = '#cceeFF';
      ctx.globalAlpha = 0.9;
      // Diamond shape
      const cs = bSz * 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -cs); ctx.lineTo(cs * 0.5, 0); ctx.lineTo(0, cs); ctx.lineTo(-cs * 0.5, 0);
      ctx.closePath(); ctx.fill();
      // Inner bright
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, bSz * 0.3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      // Gun: standard bright dot
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, bSz, 0, Math.PI*2); ctx.fill();
      // Brighter core
      ctx.fillStyle = '#ffffff88';
      ctx.beginPath(); ctx.arc(b.x, b.y, bSz * 0.4, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // --- TRAIL PARTICLES (lightweight, no velocity) ---
  for (const tp of trailParticles) {
    const a = Math.max(0, tp.life / tp.maxLife);
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = tp.color;
    ctx.beginPath(); ctx.arc(tp.x, tp.y, tp.size * (0.5 + a * 0.5), 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // --- PARTICLES (with velocity) ---
  for (const p of particles) {
    const a = Math.max(0, p.life/400);
    ctx.globalAlpha = a; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size*a, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // --- ADDITIVE LIGHTING PASS ---
  if (lightSources.length > 0 || towers.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ls of lightSources) {
      const t = ls.life / ls.maxLife;
      const alpha = t * 0.2;
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(ls.x, ls.y, 0, ls.x, ls.y, ls.radius * t);
      grad.addColorStop(0, ls.color);
      grad.addColorStop(0.3, ls.color + '44');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(ls.x, ls.y, ls.radius * t, 0, Math.PI * 2); ctx.fill();
    }
    // Tower ambient lights (always-on subtle glow)
    for (const tw of towers) {
      const twAlpha = 0.04 + ((tw.muzzleFlash || 0) * 0.12);
      ctx.globalAlpha = twAlpha;
      const twR = TILE * 1.5;
      const twGrad = ctx.createRadialGradient(tw.x, tw.y, 0, tw.x, tw.y, twR);
      twGrad.addColorStop(0, tw.color);
      twGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = twGrad;
      ctx.beginPath(); ctx.arc(tw.x, tw.y, twR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- FLOATING TEXTS ---
  for (const ft of floatingTexts) {
    const t = ft.life / ft.maxLife;
    ctx.globalAlpha = t;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color; ctx.shadowBlur = 4;
    ctx.font = `bold ${Math.max(9, TILE * 0.28)}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  if (path.length > 1) {
    const fs = Math.max(8, TILE*0.28);
    ctx.font = `bold ${fs}px Orbitron, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff88'; ctx.fillText('\u25B6', path[0].x, path[0].y);
    ctx.fillStyle = '#ff4757'; ctx.fillText('\u25A0', path[path.length-1].x, path[path.length-1].y);
  }

  // --- LEVEL UP NOTIFICATION ---
  if (mapShiftNotification) {
    const ms = mapShiftNotification;
    const t = ms.life / ms.maxLife; // 1→0
    const alpha = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
    const shake = t > 0.85 ? (1 - t) / 0.15 * 3 * Math.sin(Date.now() * 0.02) : 0;
    ctx.save();
    ctx.translate(shake, 0);
    // Dark backdrop
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, H * 0.3, W, H * 0.4);
    // Accent line top & bottom
    ctx.fillStyle = currentAtmosphere.notifColor;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillRect(0, H * 0.3, W, 2);
    ctx.fillRect(0, H * 0.7 - 2, W, 2);
    // "LEVEL X" big
    ctx.globalAlpha = alpha;
    ctx.shadowColor = currentAtmosphere.notifColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = currentAtmosphere.notifColor;
    ctx.font = `bold ${Math.max(20, TILE * 0.9)}px Orbitron, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${ms.level}`, W / 2, H * 0.42);
    ctx.shadowBlur = 0;
    // Atmosphere name
    ctx.fillStyle = currentAtmosphere.accent;
    ctx.font = `bold ${Math.max(14, TILE * 0.5)}px Orbitron, sans-serif`;
    ctx.fillText(ms.palName, W / 2, H * 0.52);
    // Bonus info
    ctx.fillStyle = '#aabbcc';
    ctx.font = `${Math.max(11, TILE * 0.35)}px 'Share Tech Mono', monospace`;
    ctx.fillText(`+${ms.bonus}g  +3\u2665`, W / 2, H * 0.62);
    // Path shift warning
    ctx.fillStyle = '#ff8844';
    ctx.font = `${Math.max(10, TILE * 0.3)}px 'Share Tech Mono', monospace`;
    ctx.fillText('\u26A0 PATH SHIFTING...', W / 2, H * 0.68);
    ctx.restore();
  }

  // --- SHIFT ANIMATIONS ---
  for (const sa of shiftAnimations) {
    const t = 1 - sa.life / sa.maxLife; // 0→1
    const alpha = sa.life / sa.maxLife;
    if (sa.type === 'crack') {
      // Expanding crack shockwave
      ctx.strokeStyle = '#ff8844';
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = 3 * (1 - t);
      ctx.beginPath(); ctx.arc(sa.x, sa.y, TILE * 1.5 * t, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = '#ff6622';
      ctx.beginPath(); ctx.arc(sa.x, sa.y, TILE * 0.8 * (1 - t), 0, Math.PI * 2); ctx.fill();
    } else if (sa.type === 'shift') {
      // New path tile glow
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = currentAtmosphere.accent;
      ctx.beginPath(); ctx.arc(sa.x, sa.y, TILE * 0.6 + TILE * 0.4 * t, 0, Math.PI * 2); ctx.fill();
    } else if (sa.type === 'dissolve') {
      // Old path tile fading
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = '#667788';
      ctx.beginPath(); ctx.arc(sa.x, sa.y, TILE * 0.5 * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- DESTROYED TOWER EFFECTS ---
  for (const de of destroyedTowerEffects) {
    const t = 1 - de.life / de.maxLife;
    const alpha = de.life / de.maxLife;
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    // Expanding X
    const sz = TILE * 0.3 + TILE * 0.3 * t;
    ctx.beginPath(); ctx.moveTo(de.x - sz, de.y - sz); ctx.lineTo(de.x + sz, de.y + sz); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(de.x + sz, de.y - sz); ctx.lineTo(de.x - sz, de.y + sz); ctx.stroke();
    // Expanding ring
    ctx.strokeStyle = de.color;
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath(); ctx.arc(de.x, de.y, TILE * t * 1.2, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // --- GHOST TOWER PREVIEW ---
  if (hoverCol >= 0 && hoverRow >= 0 && hoverCol < MAP_COLS && hoverRow < MAP_ROWS && !gameOver) {
    const def = TOWER_DEFS[selectedTower];
    const gx = hoverCol * TILE + TILE / 2;
    const gy = hoverRow * TILE + TILE / 2;
    const isGrass = mapData[hoverRow][hoverCol] === 0;
    const isOccupied = towers.some(t => t.col === hoverCol && t.row === hoverRow);
    const canAfford = gold >= def.cost;
    const canPlace = isGrass && !isOccupied && canAfford;
    const rangeScaled = def.range * (TILE / 40);

    // Range ring (outline only)
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = canPlace ? def.color : '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(gx, gy, rangeScaled, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost tower base
    ctx.globalAlpha = canPlace ? 0.7 : 0.35;
    ctx.fillStyle = '#1a2535';
    ctx.beginPath();
    ctx.arc(gx, gy, TILE * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = canPlace ? def.color : '#ff4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ghost barrel (pointing up)
    ctx.strokeStyle = canPlace ? def.color : '#ff4444';
    ctx.lineWidth = TILE * 0.08;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - TILE * 0.4);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = canPlace ? def.color : '#ff4444';
    ctx.beginPath();
    ctx.arc(gx, gy, TILE * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Invalid X mark
    if (!canPlace && isGrass && !canAfford) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffdd44';
      ctx.font = `bold ${TILE * 0.3}px Orbitron, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', gx, gy - TILE * 0.6);
    } else if (!isGrass) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2.5;
      const sz = TILE * 0.2;
      ctx.beginPath(); ctx.moveTo(gx - sz, gy - sz); ctx.lineTo(gx + sz, gy + sz); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx + sz, gy - sz); ctx.lineTo(gx - sz, gy + sz); ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// --- GAME LOOP ---
function gameLoop(ts) {
  const rawDt = Math.min(ts - lastTime, 100);
  lastTime = ts;
  if (!gameOver) {
    const dt = rawDt * gameSpeed;
    gameTime += dt;
    update(dt, gameTime);
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// --- INIT ---
window.addEventListener('resize', resize);
resize();
updateHUD();
requestAnimationFrame(gameLoop);
