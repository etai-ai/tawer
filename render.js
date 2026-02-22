// --- RENDER: Drawing & game loop ---
// Depends on: config.js, engine.js

// --- TYPE-SPECIFIC ICON FUNCTIONS ---
function drawGunIcon(c, cx, cy, s, col) {
  // Hexagonal base
  c.fillStyle = '#1a2535';
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i - Math.PI / 6;
    const hx = cx + Math.cos(a) * s * 0.32;
    const hy = cy + Math.sin(a) * s * 0.32;
    i === 0 ? c.moveTo(hx, hy) : c.lineTo(hx, hy);
  }
  c.closePath(); c.fill();
  c.strokeStyle = col; c.lineWidth = 2; c.stroke();
  // Barrel with cooling ridges
  c.strokeStyle = col; c.lineWidth = s * 0.08; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.38); c.stroke();
  c.lineCap = 'butt';
  c.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    const ry = cy - s * 0.16 - i * s * 0.1;
    c.beginPath(); c.moveTo(cx - s * 0.06, ry); c.lineTo(cx + s * 0.06, ry); c.stroke();
  }
  // Center dot
  c.fillStyle = col;
  c.beginPath(); c.arc(cx, cy, s * 0.06, 0, Math.PI * 2); c.fill();
}

function drawCannonIcon(c, cx, cy, s, col) {
  // Rounded rectangle base
  const bw = s * 0.58, bh = s * 0.52, br = s * 0.1;
  const bx = cx - bw / 2, by = cy - bh / 2;
  c.fillStyle = '#1a2535';
  c.beginPath();
  c.moveTo(bx + br, by);
  c.lineTo(bx + bw - br, by); c.arcTo(bx + bw, by, bx + bw, by + br, br);
  c.lineTo(bx + bw, by + bh - br); c.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
  c.lineTo(bx + br, by + bh); c.arcTo(bx, by + bh, bx, by + bh - br, br);
  c.lineTo(bx, by + br); c.arcTo(bx, by, bx + br, by, br);
  c.closePath(); c.fill();
  c.strokeStyle = col; c.lineWidth = 2; c.stroke();
  // Armor lines
  c.strokeStyle = col + '44'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(bx + s * 0.08, cy); c.lineTo(bx + bw - s * 0.08, cy); c.stroke();
  c.beginPath(); c.moveTo(bx + s * 0.12, cy + s * 0.1); c.lineTo(bx + bw - s * 0.12, cy + s * 0.1); c.stroke();
  // Wide barrel + muzzle brake
  c.strokeStyle = col; c.lineWidth = s * 0.13; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.3); c.stroke();
  c.lineCap = 'butt';
  c.lineWidth = s * 0.05;
  c.beginPath(); c.moveTo(cx - s * 0.12, cy - s * 0.33); c.lineTo(cx + s * 0.12, cy - s * 0.33); c.stroke();
  // Center dot
  c.fillStyle = col;
  c.beginPath(); c.arc(cx, cy, s * 0.06, 0, Math.PI * 2); c.fill();
}

function drawSniperIcon(c, cx, cy, s, col) {
  // Diamond base
  const dr = s * 0.3;
  c.fillStyle = '#1a2535';
  c.beginPath();
  c.moveTo(cx, cy - dr); c.lineTo(cx + dr * 0.7, cy);
  c.lineTo(cx, cy + dr); c.lineTo(cx - dr * 0.7, cy);
  c.closePath(); c.fill();
  c.strokeStyle = col; c.lineWidth = 2; c.stroke();
  // Extra-long thin barrel
  c.strokeStyle = col; c.lineWidth = s * 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - s * 0.46); c.stroke();
  c.lineCap = 'butt';
  // Scope lens
  c.fillStyle = col + 'aa';
  c.beginPath(); c.arc(cx, cy - s * 0.14, s * 0.035, 0, Math.PI * 2); c.fill();
  // Tripod struts
  c.strokeStyle = col + '88'; c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i - 1) * Math.PI * 0.35;
    c.beginPath(); c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.28);
    c.stroke();
  }
  // Center dot
  c.fillStyle = col;
  c.beginPath(); c.arc(cx, cy, s * 0.045, 0, Math.PI * 2); c.fill();
}

function drawFrostIcon(c, cx, cy, s, col) {
  // 6-pointed crystalline star
  c.fillStyle = '#1a2535';
  c.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = Math.PI / 6 * i - Math.PI / 2;
    const r = i % 2 === 0 ? s * 0.34 : s * 0.18;
    const hx = cx + Math.cos(a) * r;
    const hy = cy + Math.sin(a) * r;
    i === 0 ? c.moveTo(hx, hy) : c.lineTo(hx, hy);
  }
  c.closePath(); c.fill();
  c.strokeStyle = col; c.lineWidth = 2; c.stroke();
  // Central diamond crystal
  const cs = s * 0.1;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(cx, cy - cs); c.lineTo(cx + cs * 0.6, cy);
  c.lineTo(cx, cy + cs); c.lineTo(cx - cs * 0.6, cy);
  c.closePath(); c.fill();
}

function drawTowerIcon(cvs, type) {
  const c = cvs.getContext('2d');
  const s = cvs.width;
  const cx = s / 2, cy = s / 2;
  const def = TOWER_DEFS[type];
  const col = def.color;
  c.clearRect(0, 0, s, s);
  // Range hint ring
  c.strokeStyle = col + '22'; c.lineWidth = 1;
  c.beginPath(); c.arc(cx, cy, s * 0.46, 0, Math.PI * 2); c.stroke();
  // Dispatch to type-specific icon
  if (type === 'gun') drawGunIcon(c, cx, cy, s, col);
  else if (type === 'cannon') drawCannonIcon(c, cx, cy, s, col);
  else if (type === 'sniper') drawSniperIcon(c, cx, cy, s, col);
  else if (type === 'frost') drawFrostIcon(c, cx, cy, s, col);
  // Glow
  c.shadowColor = col; c.shadowBlur = 6;
  c.fillStyle = col + '44';
  c.beginPath(); c.arc(cx, cy, s * 0.12, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;
}

// Draw all tower button icons
document.querySelectorAll('.tower-btn').forEach(btn => {
  const cvs = btn.querySelector('.icon-canvas');
  if (cvs) drawTowerIcon(cvs, btn.dataset.type);
});

// --- TYPE-SPECIFIC TOWER DRAW FUNCTIONS ---
function drawGunTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime) {
  const col = t.color;
  const recoilOff = (t.recoil || 0) * TILE * 0.12;

  // Hexagonal base
  ctx.fillStyle = sel ? '#1e3040' : '#1a2535';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i - Math.PI / 6;
    ctx.lineTo(t.x + Math.cos(a) * baseR, t.y + Math.sin(a) * baseR);
  }
  ctx.closePath(); ctx.fill();
  if (lvl >= 2) { ctx.fillStyle = col + (lvl >= 3 ? '28' : '14'); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = sel ? 3 : (1.5 + 1.0 * (lvl - 1)); ctx.stroke();

  // L3 energy core gradient
  if (lvl >= 3) {
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, baseR * 0.9);
    grad.addColorStop(0, col + '44');
    grad.addColorStop(0.6, col + '11');
    grad.addColorStop(1, col + '00');
    ctx.fillStyle = grad; ctx.fill();
  }

  // Barrel with cooling ridges
  const barrelLen = TILE * 0.4 - recoilOff;
  ctx.strokeStyle = col; ctx.lineWidth = TILE * (0.07 + 0.02 * (lvl - 1)); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * barrelLen, t.y + Math.sin(t.angle) * barrelLen);
  ctx.stroke(); ctx.lineCap = 'butt';

  // Cooling ridge hash marks
  const ridgeCount = lvl >= 3 ? 4 : lvl >= 2 ? 3 : 2;
  ctx.strokeStyle = col; ctx.lineWidth = 1.5;
  const gpx = -Math.sin(t.angle), gpy = Math.cos(t.angle);
  for (let i = 0; i < ridgeCount; i++) {
    const d = barrelLen * (0.3 + i * 0.15);
    const rx = t.x + Math.cos(t.angle) * d;
    const ry = t.y + Math.sin(t.angle) * d;
    const w = TILE * 0.06;
    ctx.beginPath();
    ctx.moveTo(rx - gpx * w, ry - gpy * w);
    ctx.lineTo(rx + gpx * w, ry + gpy * w);
    ctx.stroke();
  }

  // Scanner antenna (L2+)
  if (lvl >= 2 && t.scannerAngle !== undefined) {
    const scanR = baseR * 0.75;
    const sa = t.scannerAngle;
    const sx = t.x + Math.cos(sa) * scanR;
    const sy = t.y + Math.sin(sa) * scanR;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.04, 0, Math.PI * 2); ctx.fill();
    if (lvl >= 3) {
      ctx.strokeStyle = col + '66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, scanR, sa - 0.8, sa); ctx.stroke();
    }
  }

  // Center dot
  ctx.fillStyle = lvl >= 3 ? '#ffffff' : (lvl >= 2 ? shadeColor(col, 60) : col);
  ctx.beginPath(); ctx.arc(t.x, t.y, TILE * 0.07, 0, Math.PI * 2); ctx.fill();
}

function drawCannonTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime) {
  const col = t.color;
  const recoilOff = (t.recoil || 0) * TILE * 0.12;

  // Rounded rectangle base
  const bw = baseR * 1.8, bh = baseR * 1.6, br = TILE * 0.08;
  const bx = t.x - bw / 2, by = t.y - bh / 2;
  ctx.fillStyle = sel ? '#1e3040' : '#1a2535';
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by); ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
  ctx.lineTo(bx + bw, by + bh - br); ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
  ctx.lineTo(bx + br, by + bh); ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
  ctx.lineTo(bx, by + br); ctx.arcTo(bx, by, bx + br, by, br);
  ctx.closePath(); ctx.fill();
  if (lvl >= 2) { ctx.fillStyle = col + (lvl >= 3 ? '28' : '14'); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = sel ? 3 : (1.5 + 1.0 * (lvl - 1)); ctx.stroke();

  // Armor plate lines
  const lineCount = lvl >= 2 ? 3 : 2;
  ctx.strokeStyle = col + (lvl >= 3 ? '66' : '33');
  ctx.lineWidth = lvl >= 3 ? 1.5 : 1;
  for (let i = 0; i < lineCount; i++) {
    const ly = by + bh * (0.3 + i * 0.2);
    ctx.beginPath(); ctx.moveTo(bx + TILE * 0.06, ly); ctx.lineTo(bx + bw - TILE * 0.06, ly); ctx.stroke();
  }

  // L3 reinforced corner triangles
  if (lvl >= 3) {
    ctx.fillStyle = col + '33';
    const cs = TILE * 0.08;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + cs, by); ctx.lineTo(bx, by + cs); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw - cs, by); ctx.lineTo(bx + bw, by + cs); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx + cs, by + bh); ctx.lineTo(bx, by + bh - cs); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + bw, by + bh); ctx.lineTo(bx + bw - cs, by + bh); ctx.lineTo(bx + bw, by + bh - cs); ctx.closePath(); ctx.fill();
  }

  // Wide barrel with T-shaped muzzle brake
  const barrelLen = TILE * 0.38 - recoilOff;
  ctx.strokeStyle = col; ctx.lineWidth = TILE * (0.1 + 0.03 * (lvl - 1)); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * barrelLen, t.y + Math.sin(t.angle) * barrelLen);
  ctx.stroke(); ctx.lineCap = 'butt';

  // T-shaped muzzle brake
  const cpx = -Math.sin(t.angle), cpy = Math.cos(t.angle);
  const tipX = t.x + Math.cos(t.angle) * (barrelLen + TILE * 0.02);
  const tipY = t.y + Math.sin(t.angle) * (barrelLen + TILE * 0.02);
  ctx.strokeStyle = col; ctx.lineWidth = TILE * 0.05;
  ctx.beginPath();
  ctx.moveTo(tipX - cpx * TILE * 0.1, tipY - cpy * TILE * 0.1);
  ctx.lineTo(tipX + cpx * TILE * 0.1, tipY + cpy * TILE * 0.1);
  ctx.stroke();

  // Ammo feed rects flanking barrel
  for (const side of [-1, 1]) {
    const fx = t.x + cpx * side * TILE * 0.1 + Math.cos(t.angle) * barrelLen * 0.3;
    const fy = t.y + cpy * side * TILE * 0.1 + Math.sin(t.angle) * barrelLen * 0.3;
    ctx.fillStyle = col + '66';
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(t.angle);
    ctx.fillRect(-TILE * 0.06, -TILE * 0.02, TILE * 0.12, TILE * 0.04);
    ctx.restore();
  }

  // L2+ Loading mechanism rect with recoil animation
  if (lvl >= 2) {
    const mechDist = barrelLen * 0.15 + (t.recoil || 0) * TILE * 0.08;
    const mx = t.x + Math.cos(t.angle) * mechDist;
    const my = t.y + Math.sin(t.angle) * mechDist;
    ctx.fillStyle = col + '88';
    ctx.save(); ctx.translate(mx, my); ctx.rotate(t.angle);
    ctx.fillRect(-TILE * 0.05, -TILE * 0.07, TILE * 0.1, TILE * 0.14);
    ctx.restore();
  }

  // L3 inner glow
  if (lvl >= 3) {
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, baseR * 0.8);
    grad.addColorStop(0, col + '33');
    grad.addColorStop(1, col + '00');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(t.x, t.y, baseR * 0.8, 0, Math.PI * 2); ctx.fill();
  }

  // Center dot
  ctx.fillStyle = lvl >= 3 ? '#ffffff' : (lvl >= 2 ? shadeColor(col, 60) : col);
  ctx.beginPath(); ctx.arc(t.x, t.y, TILE * 0.07, 0, Math.PI * 2); ctx.fill();
}

function drawSniperTower(ctx, t, lvl, pulse, baseR, sel, TILE, enemies, gameTime) {
  const col = t.color;
  const recoilOff = (t.recoil || 0) * TILE * 0.12;
  const da = t.angle;

  // Diamond base (rotates with aim angle)
  ctx.fillStyle = sel ? '#1e3040' : '#1a2535';
  ctx.beginPath();
  ctx.moveTo(t.x + Math.cos(da) * baseR, t.y + Math.sin(da) * baseR);
  ctx.lineTo(t.x + Math.cos(da + Math.PI / 2) * baseR * 0.65, t.y + Math.sin(da + Math.PI / 2) * baseR * 0.65);
  ctx.lineTo(t.x + Math.cos(da + Math.PI) * baseR, t.y + Math.sin(da + Math.PI) * baseR);
  ctx.lineTo(t.x + Math.cos(da - Math.PI / 2) * baseR * 0.65, t.y + Math.sin(da - Math.PI / 2) * baseR * 0.65);
  ctx.closePath(); ctx.fill();
  if (lvl >= 2) { ctx.fillStyle = col + (lvl >= 3 ? '28' : '14'); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = sel ? 3 : (1.5 + 1.0 * (lvl - 1)); ctx.stroke();

  // Tripod stabilizer struts
  ctx.strokeStyle = col + '88'; ctx.lineWidth = lvl >= 3 ? 2 : 1.5;
  for (let i = 0; i < 3; i++) {
    const sa = t.angle + Math.PI + (i - 1) * 0.7;
    const footR = baseR * 1.1;
    if (lvl >= 3) {
      // Dog-leg struts
      const midR = footR * 0.55;
      const midA = sa + 0.15;
      ctx.beginPath(); ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(midA) * midR, t.y + Math.sin(midA) * midR);
      ctx.lineTo(t.x + Math.cos(sa) * footR, t.y + Math.sin(sa) * footR);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(sa) * footR, t.y + Math.sin(sa) * footR);
      ctx.stroke();
    }
    // Feet (L2+)
    if (lvl >= 2) {
      ctx.fillStyle = col + 'aa';
      ctx.beginPath(); ctx.arc(t.x + Math.cos(sa) * footR, t.y + Math.sin(sa) * footR, TILE * 0.03, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Extra-long thin barrel
  const barrelLen = TILE * 0.50 - recoilOff;
  ctx.strokeStyle = col; ctx.lineWidth = TILE * (0.04 + 0.015 * (lvl - 1)); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * barrelLen, t.y + Math.sin(t.angle) * barrelLen);
  ctx.stroke(); ctx.lineCap = 'butt';

  // Scope lens dot near base
  const scopeX = t.x + Math.cos(t.angle) * TILE * 0.12;
  const scopeY = t.y + Math.sin(t.angle) * TILE * 0.12;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(scopeX, scopeY, TILE * 0.035, 0, Math.PI * 2); ctx.fill();
  if (lvl >= 3) {
    ctx.strokeStyle = col + '66'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(scopeX, scopeY, TILE * 0.06, 0, Math.PI * 2); ctx.stroke();
  }

  // Laser sight (L2+) — find target
  if (lvl >= 2) {
    let closest = null, closestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d < t.range && d < closestDist) { closest = e; closestDist = d; }
    }
    if (closest) {
      const blx = t.x + Math.cos(t.angle) * barrelLen;
      const bly = t.y + Math.sin(t.angle) * barrelLen;
      if (lvl >= 3) {
        ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(blx, bly); ctx.lineTo(closest.x, closest.y); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(closest.x, closest.y, TILE * 0.04, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = col + '55'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(blx, bly); ctx.lineTo(closest.x, closest.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Center dot
  ctx.fillStyle = lvl >= 3 ? '#ffffff' : (lvl >= 2 ? shadeColor(col, 60) : col);
  ctx.beginPath(); ctx.arc(t.x, t.y, TILE * 0.05, 0, Math.PI * 2); ctx.fill();
}

function drawFrostTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime) {
  const col = t.color;

  // 6-pointed crystalline star base
  ctx.fillStyle = sel ? '#1e3040' : '#1a2535';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = Math.PI / 6 * i - Math.PI / 2;
    const r = i % 2 === 0 ? baseR : baseR * 0.55;
    ctx.lineTo(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  if (lvl >= 2) { ctx.fillStyle = col + (lvl >= 3 ? '28' : '14'); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = sel ? 3 : (1.5 + 1.0 * (lvl - 1)); ctx.stroke();

  // L3 crystal glow
  if (lvl >= 3) {
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, baseR);
    grad.addColorStop(0, col + '44');
    grad.addColorStop(0.5, col + '15');
    grad.addColorStop(1, col + '00');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(t.x, t.y, baseR, 0, Math.PI * 2); ctx.fill();
  }

  // Frost mist
  if (lvl >= 3) {
    const phase = t.crystalPhase || 0;
    for (let i = 0; i < 5; i++) {
      const ma = phase + i * Math.PI * 0.4;
      const mr = baseR * (0.6 + 0.3 * Math.sin(ma * 2 + gameTime * 0.001));
      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(gameTime * 0.002 + i);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(t.x + Math.cos(ma) * mr, t.y + Math.sin(ma) * mr, TILE * 0.04, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    for (let i = 0; i < 3; i++) {
      const ma = i * Math.PI * 0.67;
      ctx.globalAlpha = 0.2; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(t.x + Math.cos(ma) * baseR * 0.7, t.y + Math.sin(ma) * baseR * 0.7, TILE * 0.025, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // L3 rotating aurora arc
  if (lvl >= 3) {
    const auroraA = (t.crystalPhase || 0) * 1.5;
    ctx.strokeStyle = col + '44'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(t.x, t.y, baseR * 1.1, auroraA, auroraA + Math.PI * 0.6); ctx.stroke();
  }

  // Central floating diamond crystal
  const crystalFloat = Math.sin(gameTime * 0.003) * TILE * 0.03;
  const cs = TILE * (0.1 + 0.02 * (lvl - 1));
  const crot = gameTime * 0.002;
  const ccy = t.y + crystalFloat;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(t.x + Math.cos(crot) * cs, ccy + Math.sin(crot) * cs);
  ctx.lineTo(t.x + Math.cos(crot + Math.PI / 2) * cs * 0.5, ccy + Math.sin(crot + Math.PI / 2) * cs * 0.5);
  ctx.lineTo(t.x + Math.cos(crot + Math.PI) * cs, ccy + Math.sin(crot + Math.PI) * cs);
  ctx.lineTo(t.x + Math.cos(crot - Math.PI / 2) * cs * 0.5, ccy + Math.sin(crot - Math.PI / 2) * cs * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 1; ctx.stroke();

  // Orbiting ice shards (L2+)
  const shardCount = lvl >= 3 ? 3 : (lvl >= 2 ? 2 : 0);
  const cp = t.crystalPhase || 0;
  for (let i = 0; i < shardCount; i++) {
    const orbitA = cp + i * (Math.PI * 2 / shardCount);
    const orbitR = baseR * 0.65;
    const sx = t.x + Math.cos(orbitA) * orbitR;
    const sy = t.y + Math.sin(orbitA) * orbitR;
    const ss = TILE * 0.05;
    ctx.fillStyle = '#aaeeff';
    ctx.beginPath();
    ctx.moveTo(sx, sy - ss); ctx.lineTo(sx + ss * 0.5, sy);
    ctx.lineTo(sx, sy + ss); ctx.lineTo(sx - ss * 0.5, sy);
    ctx.closePath(); ctx.fill();
    if (lvl >= 3) {
      ctx.strokeStyle = col + '44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, orbitR, orbitA - 0.5, orbitA); ctx.stroke();
    }
  }
}

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

  // --- ALL SPAWN POINT MARKERS (unified style) ---
  // Collect all spawn points: main + extras
  const allSpawns = [];
  if (path.length > 0) {
    allSpawns.push({
      x: path[0].x, y: path[0].y, color: '#00ff88',
      portalActive: spawnPortal.active,
      portalLife: spawnPortal.life, portalMaxLife: spawnPortal.maxLife,
    });
  }
  for (const esp of extraSpawnPoints) {
    if (!esp.path || esp.path.length < 1) continue;
    allSpawns.push({
      x: esp.path[0].x, y: esp.path[0].y, color: '#ff4444',
      portalActive: esp.portalActive,
      portalLife: esp.portalLife, portalMaxLife: esp.portalMaxLife,
    });
  }

  for (const sp of allSpawns) {
    // Static marker — pulsing glow + ring + arrow icon
    const markerPulse = Math.sin(gameTime * 0.003) * 0.15 + 0.35;
    ctx.globalAlpha = markerPulse;
    const markerGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, TILE * 0.6);
    markerGrad.addColorStop(0, sp.color);
    markerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = markerGrad;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, TILE * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, TILE * 0.4, 0, Math.PI * 2); ctx.stroke();
    // Center icon
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = sp.color;
    ctx.font = `bold ${Math.max(8, TILE * 0.3)}px Orbitron, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u25B6', sp.x, sp.y);
    ctx.globalAlpha = 1;

    // Active portal vortex when wave is spawning from here
    if (sp.portalActive) {
      const intensity = Math.min(1, sp.portalLife / (sp.portalMaxLife * 0.2), (sp.portalMaxLife - sp.portalLife + 1) / (sp.portalMaxLife * 0.2));
      const portalR = TILE * (0.5 + 0.3 * Math.sin(gameTime * 0.003));
      ctx.save();
      ctx.translate(sp.x, sp.y);
      for (let ring = 0; ring < 3; ring++) {
        const rot = gameTime * (0.002 + ring * 0.001) * (ring % 2 === 0 ? 1 : -1);
        ctx.globalAlpha = intensity * (0.35 - ring * 0.08);
        ctx.strokeStyle = ring === 0 ? sp.color : ring === 1 ? '#ffffff' : shadeColor(sp.color, -40);
        ctx.lineWidth = 2.5 - ring * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, portalR * (1 + ring * 0.35), rot, rot + Math.PI * 1.3);
        ctx.stroke();
      }
      ctx.globalAlpha = intensity * 0.4;
      const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, portalR * 0.8);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.4, sp.color);
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath(); ctx.arc(0, 0, portalR * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      if (Math.random() < 0.3) {
        lightSources.push({ x: sp.x, y: sp.y, radius: TILE * 2, color: sp.color, life: 100, maxLife: 100 });
      }
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

    // Type-specific tower drawing (base + barrel + center)
    const baseR = TILE * 0.35;
    if (t.type === 'gun') drawGunTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime);
    else if (t.type === 'cannon') drawCannonTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime);
    else if (t.type === 'sniper') drawSniperTower(ctx, t, lvl, pulse, baseR, sel, TILE, enemies, gameTime);
    else if (t.type === 'frost') drawFrostTower(ctx, t, lvl, pulse, baseR, sel, TILE, gameTime);

    // Muzzle flash (type-agnostic)
    if ((t.muzzleFlash || 0) > 0.1) {
      const mf = t.muzzleFlash;
      const recoilOff = (t.recoil || 0) * TILE * 0.12;
      const bLen = (t.type === 'sniper' ? TILE * 0.50 : t.type === 'cannon' ? TILE * 0.38 : TILE * 0.4) - recoilOff;
      const mfx = t.x + Math.cos(t.angle) * (bLen + TILE * 0.05);
      const mfy = t.y + Math.sin(t.angle) * (bLen + TILE * 0.05);
      const flashR = TILE * 0.15 * mf;
      ctx.save();
      ctx.globalAlpha = mf * 0.9;
      ctx.shadowColor = t.color; ctx.shadowBlur = 15 * mf;
      const flashGrad = ctx.createRadialGradient(mfx, mfy, 0, mfx, mfy, flashR);
      flashGrad.addColorStop(0, '#ffffff');
      flashGrad.addColorStop(0.3, t.color);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath(); ctx.arc(mfx, mfy, flashR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = mf * 0.6;
      ctx.lineWidth = 1;
      for (let fi = 0; fi < 3; fi++) {
        const fAngle = t.angle + (fi - 1) * 0.4;
        const fLen = TILE * 0.12 * mf;
        ctx.beginPath(); ctx.moveTo(mfx, mfy);
        ctx.lineTo(mfx + Math.cos(fAngle) * fLen, mfy + Math.sin(fAngle) * fLen);
        ctx.stroke();
      }
      ctx.restore();
    }

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

  // End marker (exit point)
  if (path.length > 1) {
    const fs = Math.max(8, TILE*0.28);
    ctx.font = `bold ${fs}px Orbitron, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
    // Extra spawn warning (only from level 2+)
    if (ms.hasNewSpawn) {
      ctx.fillStyle = '#ff4444';
      ctx.font = `bold ${Math.max(10, TILE * 0.3)}px 'Share Tech Mono', monospace`;
      ctx.fillText('\u26A0 NEW SPAWN POINT!', W / 2, H * 0.68);
    }
    ctx.restore();
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

    // Ghost tower base — type-specific shape
    ctx.globalAlpha = canPlace ? 0.7 : 0.35;
    const gc = canPlace ? def.color : '#ff4444';
    const gr = TILE * 0.35;
    ctx.fillStyle = '#1a2535';

    if (selectedTower === 'gun') {
      // Hexagonal
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i - Math.PI / 6;
        ctx.lineTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = gc; ctx.lineWidth = 2; ctx.stroke();
      // Barrel
      ctx.strokeStyle = gc; ctx.lineWidth = TILE * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - TILE * 0.4); ctx.stroke();
      ctx.lineCap = 'butt';
    } else if (selectedTower === 'cannon') {
      // Rounded rectangle
      const bw = gr * 1.8, bh = gr * 1.6, br = TILE * 0.08;
      const bx = gx - bw / 2, by = gy - bh / 2;
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by); ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
      ctx.lineTo(bx + bw, by + bh - br); ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
      ctx.lineTo(bx + br, by + bh); ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
      ctx.lineTo(bx, by + br); ctx.arcTo(bx, by, bx + br, by, br);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = gc; ctx.lineWidth = 2; ctx.stroke();
      // Barrel + muzzle brake
      ctx.strokeStyle = gc; ctx.lineWidth = TILE * 0.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - TILE * 0.38); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.lineWidth = TILE * 0.05;
      ctx.beginPath(); ctx.moveTo(gx - TILE * 0.1, gy - TILE * 0.4); ctx.lineTo(gx + TILE * 0.1, gy - TILE * 0.4); ctx.stroke();
    } else if (selectedTower === 'sniper') {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(gx, gy - gr); ctx.lineTo(gx + gr * 0.65, gy);
      ctx.lineTo(gx, gy + gr); ctx.lineTo(gx - gr * 0.65, gy);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = gc; ctx.lineWidth = 2; ctx.stroke();
      // Extra-long barrel
      ctx.strokeStyle = gc; ctx.lineWidth = TILE * 0.04; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - TILE * 0.50); ctx.stroke();
      ctx.lineCap = 'butt';
      // Struts
      ctx.strokeStyle = gc + '88'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const sa = -Math.PI / 2 + Math.PI + (i - 1) * 0.7;
        ctx.beginPath(); ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(sa) * gr * 1.1, gy + Math.sin(sa) * gr * 1.1);
        ctx.stroke();
      }
    } else if (selectedTower === 'frost') {
      // 6-pointed star
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = Math.PI / 6 * i - Math.PI / 2;
        const r = i % 2 === 0 ? gr : gr * 0.55;
        ctx.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = gc; ctx.lineWidth = 2; ctx.stroke();
      // Central diamond crystal
      const cs = TILE * 0.1;
      ctx.fillStyle = gc;
      ctx.beginPath();
      ctx.moveTo(gx, gy - cs); ctx.lineTo(gx + cs * 0.5, gy);
      ctx.lineTo(gx, gy + cs); ctx.lineTo(gx - cs * 0.5, gy);
      ctx.closePath(); ctx.fill();
    }

    // Center dot
    ctx.fillStyle = gc;
    ctx.beginPath();
    ctx.arc(gx, gy, TILE * 0.05, 0, Math.PI * 2);
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