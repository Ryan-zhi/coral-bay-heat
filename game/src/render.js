// Coral Bay Heat — the painter. Everything the player sees is drawn here
// with flat canvas shapes: the sunlit city, its traffic and crowds, the
// HUD with the minimap, and the full-screen title / pause / busted /
// wasted cards. No images, no fonts to fetch — just geometry and colour.

import { CITY, PALETTE } from './config.js';
import { vRoads, hRoads, SHORE_X, targetPlace } from './world.js';

export function cameraFor(state, w, h) {
  const hero = state.hero;
  let tx = hero.x - w / 2;
  let ty = hero.y - h / 2;
  if (hero.car) {
    tx += Math.cos(hero.car.heading) * hero.car.speed * 0.34;
    ty += Math.sin(hero.car.heading) * hero.car.speed * 0.34;
  }
  return {
    x: Math.max(0, Math.min(CITY.w - w, tx)),
    y: Math.max(0, Math.min(CITY.h - h, ty)),
  };
}

function box(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flowText(ctx, text, x, y, maxW, lineH, centered) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width > maxW && line) {
      ctx.fillText(line, centered ? x + (maxW - ctx.measureText(line).width) / 2 : x, yy);
      line = word;
      yy += lineH;
    } else line = trial;
  }
  if (line) ctx.fillText(line, centered ? x + (maxW - ctx.measureText(line).width) / 2 : x, yy);
}

export function paintWorld(ctx, state, cam, w, h, now) {
  const jx = state.jolt > 0 ? (Math.random() - 0.5) * 10 * state.jolt : 0;
  const jy = state.jolt > 0 ? (Math.random() - 0.5) * 10 * state.jolt : 0;
  ctx.save();
  ctx.translate(-cam.x + jx, -cam.y + jy);

  // Base ground, then sand and sea down the east edge.
  ctx.fillStyle = PALETTE.lawn;
  ctx.fillRect(cam.x - 20, cam.y - 20, w + 40, h + 40);
  ctx.fillStyle = PALETTE.beach;
  ctx.fillRect(SHORE_X, 0, CITY.w - SHORE_X, CITY.h);
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(CITY.w - 300, 0, 300, CITY.h);
  ctx.fillStyle = PALETTE.seaDeep;
  ctx.globalAlpha = 0.35;
  for (let y = 30; y < CITY.h; y += 130) {
    ctx.fillRect(CITY.w - 260 + Math.sin(now / 900 + y) * 12, y, 120, 7);
  }
  ctx.globalAlpha = 1;

  paintRoads(ctx);
  paintPark(ctx, state);

  for (const b of state.buildings) {
    if (b.x + b.w < cam.x - 40 || b.x > cam.x + w + 40 || b.y + b.h < cam.y - 40 || b.y > cam.y + h + 40) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    box(ctx, b.x + 9, b.y + 12, b.w, b.h, 6); ctx.fill();
    ctx.fillStyle = b.paint;
    box(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    box(ctx, b.x, b.y, b.w, 12, 6); ctx.fill();
    ctx.fillStyle = 'rgba(38,70,83,0.55)';
    const cols = Math.max(2, Math.floor(b.w / 42));
    const rows = Math.max(2, Math.floor(b.h / 40));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        ctx.fillRect(b.x + 14 + i * ((b.w - 28) / cols), b.y + 22 + j * ((b.h - 34) / rows), 13, 9);
      }
    }
  }

  for (const palm of state.palms) paintPalm(ctx, palm);
  paintLandmarks(ctx, state, now);

  const target = targetPlace(state);
  if (target && state.live && !state.ended) {
    const pulse = 1 + Math.sin(now / 240) * 0.16;
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(target.x, target.y, 44 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,10,0.2)';
    ctx.beginPath(); ctx.arc(target.x, target.y, 44 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    const bob = Math.sin(now / 240) * 7;
    ctx.beginPath();
    ctx.moveTo(target.x, target.y - 84 - bob);
    ctx.lineTo(target.x - 15, target.y - 112 - bob);
    ctx.lineTo(target.x + 15, target.y - 112 - bob);
    ctx.closePath(); ctx.fill();
  }

  for (const walker of state.walkers) paintWalker(ctx, walker, now);
  for (const car of state.cars) paintCar(ctx, car, now, car === state.hero.car);
  if (!state.hero.car) paintHero(ctx, state.hero, now);
  ctx.restore();
}

function paintRoads(ctx) {
  const xs = vRoads();
  const ys = hRoads();
  ctx.fillStyle = PALETTE.asphalt;
  for (const x of xs) ctx.fillRect(x - CITY.road / 2, 0, CITY.road, CITY.h);
  for (const y of ys) ctx.fillRect(0, y - CITY.road / 2, SHORE_X + 190, CITY.road);
  ctx.fillRect(SHORE_X + 60, 0, 64, CITY.h); // the bay road
  ctx.strokeStyle = PALETTE.lanePaint;
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 22]);
  ctx.beginPath();
  for (const x of xs) { ctx.moveTo(x, 0); ctx.lineTo(x, CITY.h); }
  for (const y of ys) { ctx.moveTo(0, y); ctx.lineTo(SHORE_X + 190, y); }
  ctx.moveTo(SHORE_X + 92, 0); ctx.lineTo(SHORE_X + 92, CITY.h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = PALETTE.pavement;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (const x of xs) {
    ctx.moveTo(x - CITY.road / 2, 0); ctx.lineTo(x - CITY.road / 2, CITY.h);
    ctx.moveTo(x + CITY.road / 2, 0); ctx.lineTo(x + CITY.road / 2, CITY.h);
  }
  ctx.stroke();
}

function paintPark(ctx, state) {
  const park = state.places.park;
  ctx.fillStyle = PALETTE.lawnDark;
  box(ctx, park.x - 195, park.y - 140, 390, 280, 18); ctx.fill();
  ctx.fillStyle = '#e8dfc9';
  ctx.beginPath(); ctx.arc(park.x, park.y, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fd8f7';
  ctx.beginPath(); ctx.arc(park.x, park.y, 26, 0, Math.PI * 2); ctx.fill();
}

function paintLandmarks(ctx, state, now) {
  const P = state.places;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const tag = (x, y, text, color) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const wdt = ctx.measureText(text).width + 18;
    box(ctx, x - wdt / 2, y - 15, wdt, 24, 8); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 3);
  };
  tag(P.motel.x + 60, P.motel.y - 58, 'CORAL MOTEL', '#ffd6e0');
  tag(P.spray.x + 40, P.spray.y - 58, 'SPRAY SHOP', '#c8f7dc');
  tag(P.docks.x + 40, P.docks.y - 66, 'THE DOCKS', '#ffe9a8');
  tag(P.marina.x + 30, P.marina.y - 66, 'MARINA', '#bde8ff');
  // The lighthouse itself.
  const L = P.light;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(L.x - 16, L.y + 34);
  ctx.lineTo(L.x - 9, L.y - 34);
  ctx.lineTo(L.x + 9, L.y - 34);
  ctx.lineTo(L.x + 16, L.y + 34);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.fillRect(L.x - 12, L.y - 6, 24, 12);
  ctx.fillRect(L.x - 10, L.y - 30, 20, 10);
  ctx.fillStyle = '#ffd60a';
  ctx.beginPath(); ctx.arc(L.x, L.y - 40, 7 + Math.sin(now / 300) * 1.5, 0, Math.PI * 2); ctx.fill();
  // Dock crates and a crane arm.
  ctx.fillStyle = '#8d6e63';
  for (let i = 0; i < 4; i++) ctx.fillRect(P.docks.x - 60 + i * 44, P.docks.y + 26, 32, 22);
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(P.docks.x + 130, P.docks.y + 50);
  ctx.lineTo(P.docks.x + 130, P.docks.y - 60);
  ctx.lineTo(P.docks.x + 210, P.docks.y - 60);
  ctx.stroke();
}

function paintPalm(ctx, palm) {
  const { x, y, s } = palm;
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 5 * s, y - 14 * s, x + 9 * s, y - 24 * s);
  ctx.stroke();
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

export function paintCar(ctx, car, now, isHero) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  box(ctx, -24, -6, 52, 26, 8); ctx.fill();
  ctx.fillStyle = car.wrecked ? '#55565c' : car.paint;
  if (car.role === 'police') ctx.fillStyle = '#eef2f5';
  box(ctx, -26, -13, 52, 26, 8); ctx.fill();
  if (car.role === 'police') {
    ctx.fillStyle = '#1d3557';
    box(ctx, -26, -13, 52, 9, 6); ctx.fill();
    box(ctx, -26, 4, 52, 9, 6); ctx.fill();
    const phase = Math.floor(now / 260) % 2 === 0;
    ctx.fillStyle = phase ? '#ff2e2e' : '#4361ee';
    box(ctx, -7, -8, 14, 6, 3); ctx.fill();
    ctx.fillStyle = phase ? '#4361ee' : '#ff2e2e';
    box(ctx, -7, 2, 14, 6, 3); ctx.fill();
  }
  ctx.fillStyle = 'rgba(20,30,40,0.85)';
  box(ctx, -6, -10, 15, 20, 4); ctx.fill();
  box(ctx, 13, -10, 8, 20, 3); ctx.fill();
  ctx.fillStyle = '#ffe66d';
  ctx.fillRect(24, -10, 3, 6); ctx.fillRect(24, 4, 3, 6);
  ctx.fillStyle = '#ff5964';
  ctx.fillRect(-27, -10, 3, 6); ctx.fillRect(-27, 4, 3, 6);
  if (isHero) {
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 2.5;
    box(ctx, -29, -16, 58, 32, 10); ctx.stroke();
  }
  if (car.health < 45 && !car.wrecked) {
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    ctx.beginPath(); ctx.arc(16, -4, 8 + Math.sin(now / 130) * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function paintWalker(ctx, walker, now) {
  ctx.save();
  ctx.translate(walker.x, walker.y);
  if (walker.down) {
    ctx.rotate(walker.heading + Math.PI / 2);
    ctx.fillStyle = walker.shirt;
    box(ctx, -13, -6, 26, 12, 6); ctx.fill();
    ctx.fillStyle = '#f2c29b';
    ctx.beginPath(); ctx.arc(16, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  const bob = Math.sin(now / 120 + walker.id) * 1.6;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = walker.shirt;
  ctx.beginPath(); ctx.arc(0, bob * 0.3, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c29b';
  ctx.beginPath(); ctx.arc(0, -7 + bob * 0.3, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function paintHero(ctx, hero, now) {
  ctx.save();
  ctx.translate(hero.x, hero.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 6, 10, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(hero.heading);
  ctx.fillStyle = '#123c5e';
  box(ctx, -7, -9, 15, 18, 6); ctx.fill();
  ctx.fillStyle = '#ffb703';
  box(ctx, -7, -9, 15, 7, 5); ctx.fill();
  ctx.fillStyle = '#f2c29b';
  ctx.beginPath(); ctx.arc(3, 0, 6.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(5.5, 0, 3.4, 0, Math.PI * 2); ctx.fill();
  if (hero.carrying) {
    ctx.fillStyle = '#b08968';
    ctx.fillRect(-16, -6, 9, 9);
  }
  ctx.restore();
}

// --- HUD -------------------------------------------------------------------

export function paintHud(ctx, state, w, h, objective, now) {
  const hero = state.hero;
  ctx.textAlign = 'left';
  // Mission + cash card.
  ctx.fillStyle = 'rgba(10,16,24,0.66)';
  box(ctx, 16, 16, 348, 84, 10); ctx.fill();
  ctx.fillStyle = '#ffd60a';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(state.storyDone ? 'CORAL BAY — FREE ROAM' : `CASH $${hero.cash}`, 30, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 14.5px system-ui, sans-serif';
  flowText(ctx, objective, 30, 66, 322, 19, false);
  // Health.
  ctx.fillStyle = 'rgba(10,16,24,0.66)';
  box(ctx, 16, h - 52, 190, 34, 9); ctx.fill();
  ctx.fillStyle = '#3a3f46';
  box(ctx, 26, h - 40, 130, 11, 5); ctx.fill();
  ctx.fillStyle = hero.health > 35 ? '#51cf66' : '#ff5964';
  box(ctx, 26, h - 40, 130 * Math.max(0, hero.health) / 100, 11, 5); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('HP', 164, h - 30);
  if (hero.car) {
    ctx.fillStyle = 'rgba(10,16,24,0.66)';
    box(ctx, w - 150, h - 52, 134, 34, 9); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(Math.abs(hero.car.speed) * 0.24)} mph`, w - 83, h - 30);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3a3f46';
    box(ctx, w - 138, h - 66, 110, 7, 3); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    box(ctx, w - 138, h - 66, 110 * Math.max(0, hero.car.health) / 100, 7, 3); ctx.fill();
  }
  // Wanted stars.
  if (state.stars > 0) {
    ctx.font = '26px system-ui, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < state.stars ? '#ffd60a' : 'rgba(255,255,255,0.28)';
      ctx.fillText('★', w - 178 - (4 - i) * 30, 48);
    }
    ctx.textAlign = 'left';
  }
  // Bust meter.
  if (hero.bustMeter > 0.15) {
    ctx.fillStyle = 'rgba(10,16,24,0.7)';
    box(ctx, w / 2 - 110, 108, 220, 30, 9); ctx.fill();
    ctx.fillStyle = '#ff5964';
    box(ctx, w / 2 - 100, 117, 200 * Math.min(1, hero.bustMeter / 2.4), 12, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED?', w / 2, 106);
    ctx.textAlign = 'left';
  }
  // Chapter banner.
  if (state.bannerFor > 0 && state.banner) {
    ctx.globalAlpha = Math.min(1, state.bannerFor);
    ctx.fillStyle = 'rgba(10,16,24,0.78)';
    box(ctx, w / 2 - 330, 148, 660, 86, 12); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.font = '800 21px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner.heading, w / 2, 180);
    ctx.fillStyle = '#e8f1f2';
    ctx.font = '500 15px system-ui, sans-serif';
    flowText(ctx, state.banner.body, w / 2 - 306, 206, 612, 20, true);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Toast.
  if (state.noteFor > 0 && state.note) {
    ctx.globalAlpha = Math.min(1, state.noteFor);
    ctx.font = '700 16px system-ui, sans-serif';
    const tw = ctx.measureText(state.note).width + 44;
    ctx.fillStyle = 'rgba(10,16,24,0.75)';
    box(ctx, w / 2 - tw / 2, h - 108, tw, 36, 10); ctx.fill();
    ctx.fillStyle = '#a7f3c9';
    ctx.textAlign = 'center';
    ctx.fillText(state.note, w / 2, h - 84);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  paintMinimap(ctx, state, w, now);
  // Off-screen direction arrow for the mission marker.
  const target = targetPlace(state);
  if (target && state.live && !state.ended) {
    const cam = cameraFor(state, w, h);
    const mx = target.x - cam.x;
    const my = target.y - cam.y;
    if (mx < 0 || my < 0 || mx > w || my > h) {
      const a = Math.atan2(my - h / 2, mx - w / 2);
      const ax = w / 2 + Math.cos(a) * (Math.min(w, h) / 2 - 64);
      const ay = h / 2 + Math.sin(a) * (Math.min(w, h) / 2 - 64);
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

function paintMinimap(ctx, state, w, now) {
  const mw = 168;
  const mh = 126;
  const x0 = w - mw - 16;
  const y0 = 62;
  ctx.fillStyle = 'rgba(10,16,24,0.72)';
  box(ctx, x0 - 5, y0 - 5, mw + 10, mh + 10, 10); ctx.fill();
  const kx = mw / CITY.w;
  const ky = mh / CITY.h;
  ctx.fillStyle = PALETTE.lawnDark;
  ctx.fillRect(x0, y0, mw, mh);
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(x0 + (CITY.w - 300) * kx, y0, 300 * kx, mh);
  ctx.fillStyle = PALETTE.beach;
  ctx.fillRect(x0 + SHORE_X * kx, y0, (CITY.w - 300 - SHORE_X) * kx, mh);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const x of vRoads()) { ctx.moveTo(x0 + x * kx, y0); ctx.lineTo(x0 + x * kx, y0 + mh); }
  for (const y of hRoads()) { ctx.moveTo(x0, y0 + y * ky); ctx.lineTo(x0 + mw, y0 + y * ky); }
  ctx.stroke();
  const target = targetPlace(state);
  if (target && state.live) {
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.arc(x0 + target.x * kx, y0 + target.y * ky, 4 + Math.sin(now / 240) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const car of state.cars) {
    if (car.role !== 'police' || car.wrecked) continue;
    ctx.fillStyle = Math.floor(now / 260) % 2 ? '#ff2e2e' : '#4361ee';
    ctx.fillRect(x0 + car.x * kx - 2, y0 + car.y * ky - 2, 4, 4);
  }
  const hero = state.hero;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x0 + hero.x * kx, y0 + hero.y * ky, 3.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#123c5e';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x0 + hero.x * kx, y0 + hero.y * ky, 3.6, 0, Math.PI * 2); ctx.stroke();
}
