// Coral Bay Heat — the world: city generation, traffic, pedestrians,
// police, the wanted system, combat, collisions and the mission chain.
// Pure simulation: this file never touches the DOM; render.js draws the
// state and main.js feeds it input.

import { WORLD, COLORS, BUILDING_COLORS, CAR_COLORS, PLAYER, MISSIONS } from './config.js';
import { makeRandom, pick, range } from './random.js';

export const PITCH_X = WORLD.blockW + WORLD.roadW;
export const PITCH_Y = WORLD.blockH + WORLD.roadW;
export const BEACH_X = WORLD.width - 470;

export function roadCentersX() {
  const out = [];
  for (let x = WORLD.roadW / 2; x < BEACH_X; x += PITCH_X) out.push(x);
  return out;
}
export function roadCentersY() {
  const out = [];
  for (let y = WORLD.roadW / 2; y < WORLD.height; y += PITCH_Y) out.push(y);
  return out;
}
function nearest(list, v) {
  let best = list[0], bd = Infinity;
  for (const c of list) { const d = Math.abs(c - v); if (d < bd) { bd = d; best = c; } }
  return best;
}
export function isWater(x, y) { return x > WORLD.width - 300; }
export function isBeach(x, y) { return x > BEACH_X && !isWater(x, y); }

let nextId = 1;
function makeCar(x, y, angle, color, kind) {
  return { id: nextId++, x, y, angle, speed: 0, color, kind, hp: 100, dead: false, turnCool: 0, honk: 0 };
}

export function buildWorld(seed) {
  const rng = makeRandom(seed);
  const xs = roadCentersX(), ys = roadCentersY();
  const buildings = [];
  const palms = [];
  const lamps = [];
  // One building (sometimes two) per block, with a few special blocks:
  // block (1,1) is the park, (4,0) the plaza, the motel sits in block (1,2).
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const bx = xs[i] + WORLD.roadW / 2, by = ys[j] + WORLD.roadW / 2;
      const bw = WORLD.blockW, bh = WORLD.blockH;
      if (i === 1 && j === 1) continue; // park
      if (i === 4 && j === 0) continue; // plaza
      const inset = 26;
      if (rng() < 0.3) {
        const w2 = (bw - inset * 2 - 18) / 2;
        for (const dx of [0, w2 + 18]) {
          buildings.push({ x: bx + inset + dx, y: by + inset, w: w2, h: bh - inset * 2, color: pick(rng, BUILDING_COLORS), floors: 2 + Math.floor(rng() * 5) });
        }
      } else {
        buildings.push({ x: bx + inset, y: by + inset, w: bw - inset * 2, h: bh - inset * 2, color: pick(rng, BUILDING_COLORS), floors: 2 + Math.floor(rng() * 6) });
      }
      for (let t = 0; t < 3; t++) {
        palms.push({ x: bx + range(rng, 6, bw - 6), y: by + (rng() < 0.5 ? 4 : bh - 4), s: range(rng, 0.8, 1.25) });
      }
    }
  }
  for (let x = BEACH_X + 30; x < WORLD.width - 320; x += 90) {
    palms.push({ x, y: range(rng, 60, WORLD.height - 60), s: range(rng, 0.9, 1.4) });
  }
  for (const x of xs) for (const y of ys) lamps.push({ x: x + WORLD.roadW / 2 - 4, y: y + WORLD.roadW / 2 - 4 });

  const landmarks = {
    motel: { x: xs[1] + 30, y: ys[2] + WORLD.roadW / 2, name: 'Coral Motel' },
    docks: { x: WORLD.width - 330, y: ys[4] ?? WORLD.height - 300, name: 'The Docks' },
    marina: { x: WORLD.width - 350, y: ys[1] + 40, name: 'Marina' },
    spray: { x: xs[2] + 20, y: ys[1] + WORLD.roadW / 2, name: 'Spray Shop' },
    lighthouse: { x: WORLD.width - 150, y: 130, name: 'Lighthouse Point' },
    park: { x: xs[1] + PITCH_X / 2, y: ys[1] + PITCH_Y / 2, name: 'Palm Park' },
  };

  const cars = [];
  // Traffic: a car on a random road, aimed along it.
  for (let n = 0; n < 16; n++) {
    const horiz = rng() < 0.5;
    const cx = horiz ? range(rng, 80, BEACH_X - 80) : nearest(xs, range(rng, 80, BEACH_X - 80));
    const cy = horiz ? nearest(ys, range(rng, 80, WORLD.height - 80)) : range(rng, 80, WORLD.height - 80);
    const dir = horiz ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const c = makeCar(cx, cy, dir, pick(rng, CAR_COLORS), 'traffic');
    c.speed = range(rng, 90, 150);
    cars.push(c);
  }
  // Parked cars along the curbs.
  for (let n = 0; n < 22; n++) {
    const horiz = rng() < 0.5;
    const cx = horiz ? range(rng, 100, BEACH_X - 100) : nearest(xs, range(rng, 100, BEACH_X - 100)) + (rng() < 0.5 ? -30 : 30);
    const cy = horiz ? nearest(ys, range(rng, 100, WORLD.height - 100)) + (rng() < 0.5 ? -30 : 30) : range(rng, 100, WORLD.height - 100);
    cars.push(makeCar(cx, cy, horiz ? 0 : Math.PI / 2, pick(rng, CAR_COLORS), 'parked'));
  }

  const peds = [];
  for (let n = 0; n < 26; n++) {
    peds.push(spawnPed(rng, xs, ys));
  }

  const player = {
    x: landmarks.motel.x + 60, y: landmarks.motel.y + 90, angle: -Math.PI / 2,
    hp: 100, car: null, cash: 120, bust: 0, attackCool: 0, hasPackage: false,
  };

  return {
    rng, buildings, palms, lamps, landmarks, cars, peds,
    player, heat: 0, wanted: 0, crimeTimer: 0,
    missionIndex: 0, phase: 'start', missionTimer: 0, banner: null, bannerT: 0,
    toast: null, toastT: 0, over: null, time: 0, shake: 0,
    started: false, finishedStory: false,
  };
}

function spawnPed(rng, xs, ys) {
  const bx = pick(rng, xs), by = pick(rng, ys);
  return {
    id: nextId++, x: bx + range(rng, -160, 160), y: by + range(rng, -120, 120),
    angle: range(rng, 0, Math.PI * 2), speed: range(rng, 34, 62),
    color: pick(rng, ['#ff5d5d', '#ffd93d', '#6bcbef', '#95d5b2', '#f9a8d4', '#ffffff', '#ffa26b']),
    tx: 0, ty: 0, state: 'walk', fallT: 0,
  };
}

export function wantedFor(heat) {
  if (heat <= 0) return 0;
  if (heat < 30) return 1;
  if (heat < 60) return 2;
  if (heat < 100) return 3;
  if (heat < 150) return 4;
  return 5;
}

export function commitCrime(state, points, x, y) {
  state.heat = Math.min(220, state.heat + points);
  state.crimeTimer = 6;
}

function circleRectHit(x, y, r, rect) {
  const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - nx, dy = y - ny;
  return { hit: dx * dx + dy * dy < r * r, nx, ny, dx, dy };
}

function collideBuildings(state, e, r) {
  for (const b of state.buildings) {
    const res = circleRectHit(e.x, e.y, r, b);
    if (res.hit) {
      const d = Math.hypot(res.dx, res.dy) || 1;
      if (res.dx === 0 && res.dy === 0) { e.x = res.nx + r + 1; continue; }
      e.x = res.nx + (res.dx / d) * r;
      e.y = res.ny + (res.dy / d) * r;
      return true;
    }
  }
  if (e.x < r) e.x = r;
  if (e.y < r) e.y = r;
  if (e.x > WORLD.width - r) e.x = WORLD.width - r;
  if (e.y > WORLD.height - r) e.y = WORLD.height - r;
  return false;
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// --- missions ------------------------------------------------------------

export function currentObjective(state) {
  if (state.finishedStory) return 'Free roam — Coral Bay is yours';
  const m = MISSIONS[state.missionIndex];
  if (!m) return '';
  switch (state.phase) {
    case 'start': return m.objective;
    case 'toDocks': return 'Drive to the docks marker';
    case 'toPackage': return 'Pick up the package at the marina';
    case 'toMotel': return 'Deliver the package to the Coral Motel';
    case 'toShop': return 'Reach the spray shop by Palm Park';
    case 'shakeCops': return 'Lose the police (wanted stars to zero)';
    case 'toLighthouse': return `Reach Lighthouse Point — ${Math.max(0, Math.ceil(state.missionTimer))}s left`;
    default: return m.objective;
  }
}

export function markerFor(state) {
  const L = state.landmarks;
  switch (state.phase) {
    case 'toDocks': return L.docks;
    case 'toPackage': return L.marina;
    case 'toMotel': return L.motel;
    case 'toShop': case 'shakeCops': return L.spray;
    case 'toLighthouse': return L.lighthouse;
    default: return null;
  }
}

export function startMission(state, idx) {
  state.missionIndex = idx;
  const m = MISSIONS[idx];
  state.banner = { title: m.title, text: m.intro };
  state.bannerT = 6;
  if (idx === 0) state.phase = 'start';
  if (idx === 1) state.phase = 'toPackage';
  if (idx === 2) { state.phase = 'toShop'; commitCrime(state, 70, state.player.x, state.player.y); }
  if (idx === 3) { state.phase = 'toLighthouse'; state.missionTimer = 150; }
}

function completeMission(state) {
  const m = MISSIONS[state.missionIndex];
  state.player.cash += m.reward;
  state.toast = `Mission complete — +$${m.reward}`;
  state.toastT = 4;
  if (state.missionIndex + 1 < MISSIONS.length) startMission(state, state.missionIndex + 1);
  else {
    state.finishedStory = true;
    state.phase = 'done';
    state.banner = { title: 'Story complete', text: 'Marco Reyes — King of Coral Bay. Free roam: the bay is yours.' };
    state.bannerT = 7;
  }
}

export function beginStory(state) {
  state.started = true;
  startMission(state, 0);
}

// --- per-frame update ------------------------------------------------------

export function update(state, input, dt) {
  const p = state.player;
  state.time += dt;
  if (state.bannerT > 0) state.bannerT -= dt;
  if (state.toastT > 0) state.toastT -= dt;
  if (state.shake > 0) state.shake -= dt * 3;
  if (p.attackCool > 0) p.attackCool -= dt;
  if (state.crimeTimer > 0) state.crimeTimer -= dt;

  updatePlayer(state, input, dt);
  updateTraffic(state, dt);
  updatePeds(state, dt);
  updatePolice(state, dt);
  updateWanted(state, dt);
  updateMissions(state, dt);
}

function updatePlayer(state, input, dt) {
  const p = state.player;
  if (p.car) {
    const car = p.car;
    const accel = 300, top = 445, rev = -130;
    if (input.up) car.speed += accel * dt;
    else if (input.down) car.speed -= (car.speed > 0 ? 380 : 160) * dt;
    else car.speed -= car.speed * 0.7 * dt;
    car.speed = Math.max(rev, Math.min(top, car.speed));
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    if (steer && Math.abs(car.speed) > 4) {
      car.angle += steer * 1.9 * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 130);
    }
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    if (collideBuildings(state, car, 24)) {
      if (Math.abs(car.speed) > 170) { state.shake = 0.7; car.hp -= 9; }
      car.speed *= -0.25;
    }
    // Running over a pedestrian in a car is a crime and a mess.
    for (const ped of state.peds) {
      if (ped.state !== 'down' && Math.abs(car.speed) > 55 && dist(car, ped) < 24) {
        ped.state = 'down'; ped.fallT = 5;
        commitCrime(state, 40, ped.x, ped.y);
        car.speed *= 0.82;
      }
    }
    for (const other of state.cars) {
      if (other === car || other.dead) continue;
      const d = dist(car, other);
      if (d < 40) {
        const push = (40 - d) / 2;
        const a = Math.atan2(other.y - car.y, other.x - car.x);
        other.x += Math.cos(a) * push; other.y += Math.sin(a) * push;
        if (Math.abs(car.speed) > 120) {
          other.hp -= 12; car.hp -= 6; state.shake = Math.max(state.shake, 0.5);
          if (other.kind === 'police') commitCrime(state, 26, other.x, other.y);
          car.speed *= 0.72;
        }
      }
    }
    p.x = car.x; p.y = car.y; p.angle = car.angle;
    if (input.interact) tryExitCar(state);
  } else {
    const sp = input.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (mx || my) {
      const len = Math.hypot(mx, my);
      p.x += (mx / len) * sp * dt;
      p.y += (my / len) * sp * dt;
      p.angle = Math.atan2(my, mx);
    }
    if (isWater(p.x, p.y)) { p.x -= 60 * dt; }
    collideBuildings(state, p, PLAYER.radius);
    if (input.interact) tryEnterCar(state);
    if (input.attack && p.attackCool <= 0) {
      p.attackCool = 0.38;
      for (const ped of state.peds) {
        if (ped.state !== 'down' && dist(p, ped) < 38) {
          ped.state = 'down'; ped.fallT = 6;
          commitCrime(state, 30, ped.x, ped.y);
        }
      }
    }
  }
}

function tryEnterCar(state) {
  const p = state.player;
  let best = null, bd = 52;
  for (const car of state.cars) {
    if (car.dead || car.kind === 'police') continue;
    const d = dist(p, car);
    if (d < bd) { bd = d; best = car; }
  }
  if (!best) return;
  const wasParked = best.kind === 'parked';
  best.kind = 'player';
  p.car = best;
  if (state.phase === 'start' && state.missionIndex === 0) {
    state.phase = 'toDocks';
    state.toast = 'Wheels acquired — head for the docks';
    state.toastT = 3.5;
  }
  if (!wasParked || best.stolen) commitCrime(state, 22, best.x, best.y);
  best.stolen = true;
}

function tryExitCar(state) {
  const p = state.player;
  const car = p.car;
  car.kind = car.stolen ? 'parked' : 'traffic';
  car.speed = 0;
  p.car = null;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
  collideBuildings(state, p, PLAYER.radius);
}

function updateTraffic(state, dt) {
  const xs = roadCentersX(), ys = roadCentersY();
  for (const car of state.cars) {
    if (car.kind !== 'traffic' || car.dead) continue;
    car.turnCool -= dt;
    const horiz = Math.abs(Math.cos(car.angle)) > 0.7;
    // Hold the right-hand lane of the road we are on.
    const right = { x: -Math.sin(car.angle), y: Math.cos(car.angle) };
    if (horiz) {
      const laneY = nearest(ys, car.y) + right.y * (WORLD.roadW / 4) * Math.sign(Math.cos(car.angle)) * (Math.cos(car.angle) > 0 ? 1 : -1);
      car.y += (nearest(ys, car.y) + (Math.cos(car.angle) > 0 ? WORLD.roadW / 4 : -WORLD.roadW / 4) - car.y) * Math.min(1, dt * 2.4);
    } else {
      car.x += (nearest(xs, car.x) + (Math.sin(car.angle) > 0 ? -WORLD.roadW / 4 : WORLD.roadW / 4) - car.x) * Math.min(1, dt * 2.4);
    }
    // Slow for the car ahead.
    let target = 150;
    for (const other of state.cars) {
      if (other === car || other.dead) continue;
      const dx = other.x - car.x, dy = other.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
      const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
      if (ahead > 0 && ahead < 74 && side < 20) target = Math.min(target, Math.max(0, (ahead - 46) * 3));
    }
    car.speed += Math.max(-260 * dt, Math.min(190 * dt, target - car.speed));
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // At an intersection, sometimes turn.
    const ix = nearest(xs, car.x), iy = nearest(ys, car.y);
    if (car.turnCool <= 0 && Math.abs(ix - car.x) < 20 && Math.abs(iy - car.y) < 20 && state.rng() < 0.4) {
      const turn = state.rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      car.angle = Math.round((car.angle + turn) / (Math.PI / 2)) * (Math.PI / 2);
      car.turnCool = 2.5;
    }
    if (car.x > BEACH_X + 60 || car.x < -60 || car.y < -60 || car.y > WORLD.height + 60) {
      car.x = 120; car.y = nearest(ys, car.y);
    }
    if (car.hp <= 0) { car.dead = true; car.speed = 0; }
  }
}

function updatePeds(state, dt) {
  for (const ped of state.peds) {
    if (ped.state === 'down') {
      ped.fallT -= dt;
      if (ped.fallT <= 0) ped.state = 'walk';
      continue;
    }
    // Flee from fast cars and from trouble.
    let flee = null;
    for (const car of state.cars) {
      if (!car.dead && Math.abs(car.speed) > 200 && dist(car, ped) < 90) flee = car;
    }
    if (flee) {
      ped.angle = Math.atan2(ped.y - flee.y, ped.x - flee.x);
      ped.x += Math.cos(ped.angle) * 130 * dt;
      ped.y += Math.sin(ped.angle) * 130 * dt;
      continue;
    }
    if (!ped.tx || Math.hypot(ped.tx - ped.x, ped.ty - ped.y) < 12) {
      const bx = pick(state.rng, roadCentersX()), by = pick(state.rng, roadCentersY());
      ped.tx = bx + range(state.rng, -190, 190);
      ped.ty = by + range(state.rng, -150, 150);
    }
    const a = Math.atan2(ped.ty - ped.y, ped.tx - ped.x);
    ped.angle = a;
    ped.x += Math.cos(a) * ped.speed * dt;
    ped.y += Math.sin(a) * ped.speed * dt;
    collideBuildings(state, ped, 10);
  }
}

function updatePolice(state, dt) {
  const p = state.player;
  const want = state.wanted;
  const cops = state.cars.filter((c) => c.kind === 'police' && !c.dead);
  const target = want === 0 ? 0 : Math.min(6, want + 1);
  if (cops.length < target && state.rng() < dt * 0.7) {
    const a = range(state.rng, 0, Math.PI * 2);
    const x = Math.max(40, Math.min(WORLD.width - 40, p.x + Math.cos(a) * 620));
    const y = Math.max(40, Math.min(WORLD.height - 40, p.y + Math.sin(a) * 620));
    if (!isWater(x, y)) state.cars.push(makeCar(x, y, a + Math.PI, '#dfe6ee', 'police'));
  }
  for (const cop of state.cars) {
    if (cop.kind !== 'police') continue;
    if (cop.dead) continue;
    if (want === 0) {
      cop.kind = 'traffic';
      cop.speed = 120;
      continue;
    }
    const d = dist(cop, p);
    const desired = Math.atan2(p.y - cop.y, p.x - cop.x);
    let diff = desired - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const top = d > 420 ? 480 : 415;
    cop.speed += Math.max(-320 * dt, Math.min(300 * dt, top - cop.speed));
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    if (collideBuildings(state, cop, 24)) cop.speed *= 0.4;
    if (d < 42 && Math.abs(cop.speed) > 130) {
      state.shake = Math.max(state.shake, 0.45);
      if (p.car) { p.car.hp -= 7; cop.speed *= 0.5; }
      else { p.hp -= 6; }
    }
    if (cop.hp <= 0) { cop.dead = true; commitCrime(state, 34, cop.x, cop.y); }
  }
  // Bust meter: a nearby cop while you are slow or on foot.
  const pSpeed = p.car ? Math.abs(p.car.speed) : 0;
  let nearCop = false;
  for (const cop of state.cars) {
    if (cop.kind === 'police' && !cop.dead && dist(cop, p) < (p.car ? 64 : 50)) nearCop = true;
  }
  if (nearCop && state.wanted > 0 && (!p.car || pSpeed < 42)) p.bust += dt;
  else p.bust = Math.max(0, p.bust - dt * 1.6);
  if (p.bust >= 2.4) endRun(state, 'busted');
  if (p.hp <= 0 || (p.car && p.car.hp <= 0)) endRun(state, 'wasted');
}

function endRun(state, kind) {
  state.over = kind;
  state.player.cash = Math.max(0, state.player.cash - 150);
  state.heat = 0;
  state.player.bust = 0;
}

export function respawn(state) {
  const p = state.player;
  state.over = null;
  p.hp = 100;
  p.car = null;
  p.x = state.landmarks.motel.x + 60;
  p.y = state.landmarks.motel.y + 90;
  state.cars = state.cars.filter((c) => c.kind !== 'police');
}

function updateWanted(state, dt) {
  state.wanted = wantedFor(state.heat);
  if (state.crimeTimer <= 0 && state.heat > 0) {
    let seen = false;
    for (const cop of state.cars) {
      if (cop.kind === 'police' && !cop.dead && dist(cop, state.player) < 300) seen = true;
    }
    state.heat = Math.max(0, state.heat - dt * (seen ? 0.7 : 3.2));
  }
}

function updateMissions(state, dt) {
  if (!state.started || state.finishedStory || state.over) return;
  const p = state.player;
  const marker = markerFor(state);
  const near = marker && Math.hypot(marker.x - p.x, marker.y - p.y) < 95;
  switch (state.phase) {
    case 'toDocks':
      if (near && p.car) completeMission(state);
      break;
    case 'toPackage':
      if (near) {
        p.hasPackage = true;
        state.phase = 'toMotel';
        state.toast = 'Package picked up — the police noticed';
        state.toastT = 3.5;
        commitCrime(state, 45, p.x, p.y);
      }
      break;
    case 'toMotel':
      if (near) { p.hasPackage = false; completeMission(state); }
      break;
    case 'toShop':
      if (near) {
        state.phase = 'shakeCops';
        state.toast = 'Made it to the shop — now lose the heat';
        state.toastT = 3.5;
      }
      break;
    case 'shakeCops':
      if (state.wanted === 0) completeMission(state);
      break;
    case 'toLighthouse':
      state.missionTimer -= dt;
      if (near && p.car) completeMission(state);
      else if (state.missionTimer <= 0) {
        state.missionTimer = 150;
        state.toast = 'Out of time — the run resets, try again';
        state.toastT = 3.5;
      }
      break;
  }
}
