// Coral Bay Heat — drawing: the city, the cars, the people, the HUD with
// its minimap, and the full-screen menus. Everything is canvas 2D with
// flat, sun-soaked colours and soft shadows.

import { WORLD, COLORS } from './config.js';
import { roadCentersX, roadCentersY, BEACH_X, markerFor } from './world.js';

export function makeCamera(state, w, h) {
  const p = state.player;
  let tx = p.x - w / 2, ty = p.y - h / 2;
  if (p.car) {
    tx += Math.cos(p.car.angle) * p.car.speed * 0.34;
    ty += Math.sin(p.car.angle) * p.car.speed * 0.34;
  }
  return {
    x: Math.max(0, Math.min(WORLD.width - w, tx)),
    y: Math.max(0, Math.min(WORLD.height - h, ty)),
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, state, cam, w, h, now) {
  const sx = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
  const sy = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
  ctx.save();
  ctx.translate(-cam.x + sx, -cam.y + sy);

  // Ground: grass everywhere, then beach and water on the east edge.
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(cam.x - 20, cam.y - 20, w + 40, h + 40);
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(BEACH_X, 0, WORLD.width - BEACH_X, WORLD.height);
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(WORLD.width - 300, 0, 300, WORLD.height);
  ctx.fillStyle = COLORS.waterDeep;
  for (let y = 30; y < WORLD.height; y += 130) {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(WORLD.width - 260 + Math.sin(now / 900 + y) * 12, y, 120, 7);
  }
  ctx.globalAlpha = 1;

  drawRoads(ctx, state);
  drawPark(ctx, state);

  // Buildings with drop shadows and window grids.
  for (const b of state.buildings) {
    if (b.x + b.w < cam.x - 40 || b.x > cam.x + w + 40 || b.y + b.h < cam.y - 40 || b.y > cam.y + h + 40) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    rr(ctx, b.x + 9, b.y + 12, b.w, b.h, 6); ctx.fill();
    ctx.fillStyle = b.color;
    rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    rr(ctx, b.x, b.y, b.w, 12, 6); ctx.fill();
    ctx.fillStyle = 'rgba(38,70,83,0.55)';
    const cols = Math.max(2, Math.floor(b.w / 42)), rows = Math.max(2, Math.floor(b.h / 40));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      ctx.fillRect(b.x + 14 + i * ((b.w - 28) / cols), b.y + 22 + j * ((b.h - 34) / rows), 13, 9);
    }
  }

  for (const palm of state.palms) drawPalm(ctx, palm.x, palm.y, palm.s);
  drawLandmarks(ctx, state, now);

  const marker = markerFor(state);
  if (marker && state.started && !state.over) {
    const pulse = 1 + Math.sin(now / 240) * 0.16;
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 44 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,10,0.2)';
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 44 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - 84 - Math.sin(now / 240) * 7);
    ctx.lineTo(marker.x - 15, marker.y - 112 - Math.sin(now / 240) * 7);
    ctx.lineTo(marker.x + 15, marker.y - 112 - Math.sin(now / 240) * 7);
    ctx.closePath(); ctx.fill();
  }

  for (const ped of state.peds) drawPed(ctx, ped, now);
  for (const car of state.cars) drawCar(ctx, car, now, car === state.player.car);
  if (!state.player.car) drawPlayerOnFoot(ctx, state.player, now);
  ctx.restore();
}

function drawRoads(ctx, state) {
  const xs = roadCentersX(), ys = roadCentersY();
  ctx.fillStyle = COLORS.road;
  for (const x of xs) ctx.fillRect(x - WORLD.roadW / 2, 0, WORLD.roadW, WORLD.height);
  for (const y of ys) ctx.fillRect(0, y - WORLD.roadW / 2, BEACH_X + 190, WORLD.roadW);
  // Bay road along the beach.
  ctx.fillRect(BEACH_X + 60, 0, 64, WORLD.height);
  ctx.strokeStyle = COLORS.lane;
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 22]);
  ctx.beginPath();
  for (const x of xs) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); }
  for (const y of ys) { ctx.moveTo(0, y); ctx.lineTo(BEACH_X + 190, y); }
  ctx.moveTo(BEACH_X + 92, 0); ctx.lineTo(BEACH_X + 92, WORLD.height);
  ctx.stroke();
  ctx.setLineDash([]);
  // Sidewalk rims.
  ctx.strokeStyle = COLORS.sidewalk;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (const x of xs) {
    ctx.moveTo(x - WORLD.roadW / 2, 0); ctx.lineTo(x - WORLD.roadW / 2, WORLD.height);
    ctx.moveTo(x + WORLD.roadW / 2, 0); ctx.lineTo(x + WORLD.roadW / 2, WORLD.height);
  }
  ctx.stroke();
}

function drawPark(ctx, state) {
  const park = state.landmarks.park;
  ctx.fillStyle = COLORS.grassDark;
  rr(ctx, park.x - 195, park.y - 140, 390, 280, 18); ctx.fill();
  ctx.fillStyle = '#e8dfc9';
  ctx.beginPath(); ctx.arc(park.x, park.y, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fd8f7';
  ctx.beginPath(); ctx.arc(park.x, park.y, 26, 0, Math.PI * 2); ctx.fill();
}

function drawLandmarks(ctx, state, now) {
  const L = state.landmarks;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label = (x, y, text, color) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const wdt = ctx.measureText(text).width + 18;
    rr(ctx, x - wdt / 2, y - 15, wdt, 24, 8); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 3);
  };
  label(L.motel.x + 60, L.motel.y - 58, 'CORAL MOTEL', '#ffd6e0');
  label(L.spray.x + 40, L.spray.y - 58, 'SPRAY SHOP', '#c8f7dc');
  label(L.docks.x + 40, L.docks.y - 66, 'THE DOCKS', '#ffe9a8');
  label(L.marina.x + 30, L.marina.y - 66, 'MARINA', '#bde8ff');
  // Lighthouse.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(L.lighthouse.x - 16, L.lighthouse.y + 34);
  ctx.lineTo(L.lighthouse.x - 9, L.lighthouse.y - 34);
  ctx.lineTo(L.lighthouse.x + 9, L.lighthouse.y - 34);
  ctx.lineTo(L.lighthouse.x + 16, L.lighthouse.y + 34);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.fillRect(L.lighthouse.x - 12, L.lighthouse.y - 6, 24, 12);
  ctx.fillRect(L.lighthouse.x - 10, L.lighthouse.y - 30, 20, 10);
  ctx.fillStyle = '#ffd60a';
  ctx.beginPath(); ctx.arc(L.lighthouse.x, L.lighthouse.y - 40, 7 + Math.sin(now / 300) * 1.5, 0, Math.PI * 2); ctx.fill();
  // Dock cranes and crates.
  ctx.fillStyle = '#8d6e63';
  for (let i = 0; i < 4; i++) ctx.fillRect(L.docks.x - 60 + i * 44, L.docks.y + 26, 32, 22);
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(L.docks.x + 130, L.docks.y + 50);
  ctx.lineTo(L.docks.x + 130, L.docks.y - 60);
  ctx.lineTo(L.docks.x + 210, L.docks.y - 60);
  ctx.stroke();
}

function drawPalm(ctx, x, y, s) {
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 5 * s;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5 * s, y - 14 * s, x + 9 * s, y - 24 * s); ctx.stroke();
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 3.4 * s;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 9 * s, y - 24 * s);
    ctx.quadraticCurveTo(
      x + 9 * s + Math.cos(a) * 15 * s, y - 24 * s + Math.sin(a) * 8 * s - 5 * s,
      x + 9 * s + Math.cos(a) * 24 * s, y - 24 * s + Math.sin(a) * 13 * s + 3 * s);
    ctx.stroke();
  }
}

export function drawCar(ctx, car, now, isPlayer) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  rr(ctx, -24, -11 + 5, 52, 26, 8); ctx.fill();
  ctx.fillStyle = car.dead ? '#55565c' : car.color;
  if (car.kind === 'police') ctx.fillStyle = '#eef2f5';
  rr(ctx, -26, -13, 52, 26, 8); ctx.fill();
  if (car.kind === 'police') {
    ctx.fillStyle = '#1d3557';
    rr(ctx, -26, -13, 52, 9, 6); ctx.fill();
    rr(ctx, -26, 4, 52, 9, 6); ctx.fill();
    const flash = Math.floor(now / 260) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2e2e' : '#4361ee';
    rr(ctx, -7, -8, 14, 6, 3); ctx.fill();
    ctx.fillStyle = flash ? '#4361ee' : '#ff2e2e';
    rr(ctx, -7, 2, 14, 6, 3); ctx.fill();
  }
  ctx.fillStyle = 'rgba(20,30,40,0.85)';
  rr(ctx, -6, -10, 15, 20, 4); ctx.fill();
  rr(ctx, 13, -10, 8, 20, 3); ctx.fill();
  ctx.fillStyle = '#ffe66d';
  ctx.fillRect(24, -10, 3, 6); ctx.fillRect(24, 4, 3, 6);
  ctx.fillStyle = '#ff5964';
  ctx.fillRect(-27, -10, 3, 6); ctx.fillRect(-27, 4, 3, 6);
  if (isPlayer) {
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 2.5;
    rr(ctx, -29, -16, 58, 32, 10); ctx.stroke();
  }
  if (car.hp < 45 && !car.dead) {
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    ctx.beginPath(); ctx.arc(16, -4, 8 + Math.sin(now / 130) * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPed(ctx, ped, now) {
  ctx.save();
  ctx.translate(ped.x, ped.y);
  if (ped.state === 'down') {
    ctx.rotate(ped.angle + Math.PI / 2);
    ctx.fillStyle = ped.color;
    rr(ctx, -13, -6, 26, 12, 6); ctx.fill();
    ctx.fillStyle = '#f2c29b';
    ctx.beginPath(); ctx.arc(16, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  const bob = Math.sin(now / 120 + ped.id) * 1.6;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ped.color;
  ctx.beginPath(); ctx.arc(0, bob * 0.3, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c29b';
  ctx.beginPath(); ctx.arc(0, -7 + bob * 0.3, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPlayerOnFoot(ctx, p, now) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 6, 10, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(p.angle);
  ctx.fillStyle = '#123c5e';
  rr(ctx, -7, -9, 15, 18, 6); ctx.fill();
  ctx.fillStyle = '#ffb703';
  rr(ctx, -7, -9, 15, 7, 5); ctx.fill();
  ctx.fillStyle = '#f2c29b';
  ctx.beginPath(); ctx.arc(3, 0, 6.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(5.5, 0, 3.4, 0, Math.PI * 2); ctx.fill();
  if (p.hasPackage) {
    ctx.fillStyle = '#b08968';
    ctx.fillRect(-16, -6, 9, 9);
  }
  ctx.restore();
}

// --- HUD -------------------------------------------------------------------

export function drawHUD(ctx, state, w, h, objective, now) {
  const p = state.player;
  ctx.textAlign = 'left';
  // Mission card.
  ctx.fillStyle = 'rgba(10,16,24,0.66)';
  rr(ctx, 16, 16, 348, 84, 10); ctx.fill();
  ctx.fillStyle = '#ffd60a';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(state.finishedStory ? 'CORAL BAY — FREE ROAM' : `CASH $${p.cash}`, 30, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 14.5px system-ui, sans-serif';
  wrapText(ctx, objective, 30, 66, 322, 19);
  // Health.
  ctx.fillStyle = 'rgba(10,16,24,0.66)';
  rr(ctx, 16, h - 52, 190, 34, 9); ctx.fill();
  ctx.fillStyle = '#3a3f46';
  rr(ctx, 26, h - 40, 130, 11, 5); ctx.fill();
  ctx.fillStyle = p.hp > 35 ? '#51cf66' : '#ff5964';
  rr(ctx, 26, h - 40, 130 * Math.max(0, p.hp) / 100, 11, 5); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('HP', 164, h - 30);
  if (p.car) {
    ctx.fillStyle = 'rgba(10,16,24,0.66)';
    rr(ctx, w - 150, h - 52, 134, 34, 9); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(Math.abs(p.car.speed) * 0.24)} mph`, w - 83, h - 30);
    ctx.textAlign = 'left';
    // Car health mini-bar.
    ctx.fillStyle = '#3a3f46';
    rr(ctx, w - 138, h - 66, 110, 7, 3); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    rr(ctx, w - 138, h - 66, 110 * Math.max(0, p.car.hp) / 100, 7, 3); ctx.fill();
  }
  // Wanted stars.
  if (state.wanted > 0) {
    ctx.font = '26px system-ui, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < state.wanted ? '#ffd60a' : 'rgba(255,255,255,0.28)';
      ctx.fillText('★', w - 178 - (4 - i) * 30, 48);
    }
    ctx.textAlign = 'left';
  }
  // Bust meter.
  if (p.bust > 0.15) {
    ctx.fillStyle = 'rgba(10,16,24,0.7)';
    rr(ctx, w / 2 - 110, 108, 220, 30, 9); ctx.fill();
    ctx.fillStyle = '#ff5964';
    rr(ctx, w / 2 - 100, 117, 200 * Math.min(1, p.bust / 2.4), 12, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED?', w / 2, 106);
    ctx.textAlign = 'left';
  }
  // Mission banner.
  if (state.bannerT > 0 && state.banner) {
    const a = Math.min(1, state.bannerT);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(10,16,24,0.78)';
    rr(ctx, w / 2 - 330, 148, 660, 86, 12); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.font = '800 21px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner.title, w / 2, 180);
    ctx.fillStyle = '#e8f1f2';
    ctx.font = '500 15px system-ui, sans-serif';
    wrapText(ctx, state.banner.text, w / 2 - 306, 206, 612, 20, true);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  if (state.toastT > 0 && state.toast) {
    ctx.globalAlpha = Math.min(1, state.toastT);
    ctx.fillStyle = 'rgba(10,16,24,0.75)';
    const tw = ctx.measureText(state.toast).width + 44;
    rr(ctx, w / 2 - tw / 2, h - 108, tw, 36, 10); ctx.fill();
    ctx.fillStyle = '#a7f3c9';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.toast, w / 2, h - 84);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  drawMinimap(ctx, state, w, now);
  // Off-screen marker arrow.
  const marker = markerFor(state);
  if (marker && state.started && !state.over) {
    const cam = makeCamera(state, w, h);
    const mx = marker.x - cam.x, my = marker.y - cam.y;
    if (mx < 0 || my < 0 || mx > w || my > h) {
      const cx = w / 2, cy = h / 2;
      const a = Math.atan2(my - cy, mx - cx);
      const ax = cx + Math.cos(a) * (Math.min(w, h) / 2 - 64);
      const ay = cy + Math.sin(a) * (Math.min(w, h) / 2 - 64);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a);
      ctx.fillStyle = '#ffd60a';
      ctx.beginPath();
      ctx.moveTo(18, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}

function drawMinimap(ctx, state, w, now) {
  const mw = 168, mh = 126, x0 = w - mw - 16, y0 = 62;
  ctx.fillStyle = 'rgba(10,16,24,0.72)';
  rr(ctx, x0 - 5, y0 - 5, mw + 10, mh + 10, 10); ctx.fill();
  const kx = mw / WORLD.width, ky = mh / WORLD.height;
  ctx.fillStyle = COLORS.grassDark;
  ctx.fillRect(x0, y0, mw, mh);
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(x0 + (WORLD.width - 300) * kx, y0, 300 * kx, mh);
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(x0 + BEACH_X * kx, y0, (WORLD.width - 300 - BEACH_X) * kx, mh);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const x of roadCentersX()) { ctx.moveTo(x0 + x * kx, y0); ctx.lineTo(x0 + x * kx, y0 + mh); }
  for (const y of roadCentersY()) { ctx.moveTo(x0, y0 + y * ky); ctx.lineTo(x0 + mw, y0 + y * ky); }
  ctx.stroke();
  const marker = markerFor(state);
  if (marker && state.started) {
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.arc(x0 + marker.x * kx, y0 + marker.y * ky, 4 + Math.sin(now / 240) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const car of state.cars) {
    if (car.kind !== 'police' || car.dead) continue;
    ctx.fillStyle = Math.floor(now / 260) % 2 ? '#ff2e2e' : '#4361ee';
    ctx.fillRect(x0 + car.x * kx - 2, y0 + car.y * ky - 2, 4, 4);
  }
  const p = state.player;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x0 + p.x * kx, y0 + p.y * ky, 3.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#123c5e';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x0 + p.x * kx, y0 + p.y * ky, 3.6, 0, Math.PI * 2); ctx.stroke();
}

function wrapText(ctx, text, x, y, maxW, lineH, center) {
  const words = String(text).split(' ');
  let line = '', yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, center ? x + (maxW - ctx.measureText(line).width) / 2 : x, yy);
      line = word; yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, center ? x + (maxW - ctx.measureText(line).width) / 2 : x, yy);
}
