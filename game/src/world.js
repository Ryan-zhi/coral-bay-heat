// Coral Bay Heat — the simulation. This module owns the city and every
// actor in it: traffic that minds its lane, pedestrians, the police, the
// wanted meter, collisions and Rosa's four jobs. It never touches the
// DOM; render.js paints whatever state this produces, main.js feeds it
// input one frame at a time.

import { CITY, PAINTS, CAR_PAINTS, WALKER, CHAPTERS } from './config.js';
import { rngFrom, choose, between } from './random.js';

export const STEP_X = CITY.blockW + CITY.road;
export const STEP_Y = CITY.blockH + CITY.road;
export const SHORE_X = CITY.w - 470;

export function vRoads() {
  const list = [];
  for (let x = CITY.road / 2; x < SHORE_X; x += STEP_X) list.push(x);
  return list;
}
export function hRoads() {
  const list = [];
  for (let y = CITY.road / 2; y < CITY.h; y += STEP_Y) list.push(y);
  return list;
}
function closest(list, v) {
  let best = list[0];
  let gap = Infinity;
  for (const c of list) {
    const d = Math.abs(c - v);
    if (d < gap) { gap = d; best = c; }
  }
  return best;
}
export function inSea(x) { return x > CITY.w - 300; }
export function onSand(x) { return x > SHORE_X && !inSea(x); }

let uid = 1;
function spawnCar(x, y, heading, paint, role) {
  return {
    id: uid++, x, y, heading, speed: 0, paint, role,
    health: 100, wrecked: false, cool: 0, taken: false,
  };
}
function spawnWalker(rng, xs, ys) {
  return {
    id: uid++,
    x: choose(rng, xs) + between(rng, -160, 160),
    y: choose(rng, ys) + between(rng, -120, 120),
    heading: between(rng, 0, Math.PI * 2),
    pace: between(rng, 34, 62),
    shirt: choose(rng, ['#ff5d5d', '#ffd93d', '#6bcbef', '#95d5b2', '#f9a8d4', '#ffffff', '#ffa26b']),
    goalX: 0, goalY: 0, down: false, downFor: 0,
  };
}

export function buildWorld(seed) {
  const rng = rngFrom(seed);
  const xs = vRoads();
  const ys = hRoads();
  const buildings = [];
  const palms = [];

  // Blocks of towers. Two lots are left open on purpose: the park at
  // block (1,1) and the plaza at block (4,0).
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      if (i === 1 && j === 1) continue;
      if (i === 4 && j === 0) continue;
      const bx = xs[i] + CITY.road / 2;
      const by = ys[j] + CITY.road / 2;
      const bw = CITY.blockW;
      const bh = CITY.blockH;
      const pad = 26;
      if (rng() < 0.3) {
        const half = (bw - pad * 2 - 18) / 2;
        for (const off of [0, half + 18]) {
          buildings.push({ x: bx + pad + off, y: by + pad, w: half, h: bh - pad * 2, paint: choose(rng, PAINTS) });
        }
      } else {
        buildings.push({ x: bx + pad, y: by + pad, w: bw - pad * 2, h: bh - pad * 2, paint: choose(rng, PAINTS) });
      }
      for (let t = 0; t < 3; t++) {
        palms.push({ x: bx + between(rng, 6, bw - 6), y: by + (rng() < 0.5 ? 4 : bh - 4), s: between(rng, 0.8, 1.25) });
      }
    }
  }
  for (let x = SHORE_X + 30; x < CITY.w - 320; x += 90) {
    palms.push({ x, y: between(rng, 60, CITY.h - 60), s: between(rng, 0.9, 1.4) });
  }

  const places = {
    motel: { x: xs[1] + 30, y: ys[2] + CITY.road / 2, name: 'Coral Motel' },
    docks: { x: CITY.w - 330, y: ys[4] ?? CITY.h - 300, name: 'The Docks' },
    marina: { x: CITY.w - 350, y: ys[1] + 40, name: 'Marina' },
    spray: { x: xs[2] + 20, y: ys[1] + CITY.road / 2, name: 'Spray Shop' },
    light: { x: CITY.w - 150, y: 130, name: 'Lighthouse Point' },
    park: { x: xs[1] + STEP_X / 2, y: ys[1] + STEP_Y / 2, name: 'Palm Park' },
  };

  const cars = [];
  for (let n = 0; n < 16; n++) {
    const horiz = rng() < 0.5;
    const cx = horiz ? between(rng, 80, SHORE_X - 80) : closest(xs, between(rng, 80, SHORE_X - 80));
    const cy = horiz ? closest(ys, between(rng, 80, CITY.h - 80)) : between(rng, 80, CITY.h - 80);
    const dir = horiz ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const car = spawnCar(cx, cy, dir, choose(rng, CAR_PAINTS), 'traffic');
    car.speed = between(rng, 90, 150);
    cars.push(car);
  }
  for (let n = 0; n < 22; n++) {
    const horiz = rng() < 0.5;
    const cx = horiz ? between(rng, 100, SHORE_X - 100) : closest(xs, between(rng, 100, SHORE_X - 100)) + (rng() < 0.5 ? -30 : 30);
    const cy = horiz ? closest(ys, between(rng, 100, CITY.h - 100)) + (rng() < 0.5 ? -30 : 30) : between(rng, 100, CITY.h - 100);
    cars.push(spawnCar(cx, cy, horiz ? 0 : Math.PI / 2, choose(rng, CAR_PAINTS), 'parked'));
  }

  const walkers = [];
  for (let n = 0; n < 26; n++) walkers.push(spawnWalker(rng, xs, ys));

  const hero = {
    x: places.motel.x + 60, y: places.motel.y + 90, heading: -Math.PI / 2,
    health: 100, car: null, cash: 120, bustMeter: 0, swingCool: 0, carrying: false,
  };

  return {
    rng, buildings, palms, places, cars, walkers, hero,
    heat: 0, stars: 0, sinceCrime: 0,
    chapter: 0, phase: 'idle', clock: 0, missionClock: 0,
    banner: null, bannerFor: 0, note: null, noteFor: 0,
    ended: null, elapsed: 0, jolt: 0, live: false, storyDone: false,
  };
}

export function starsFor(heat) {
  if (heat <= 0) return 0;
  if (heat < 30) return 1;
  if (heat < 60) return 2;
  if (heat < 100) return 3;
  if (heat < 150) return 4;
  return 5;
}

export function makeTrouble(state, points) {
  state.heat = Math.min(220, state.heat + points);
  state.sinceCrime = 6;
}

function gap(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function pushOutOfBuildings(state, body, r) {
  for (const b of state.buildings) {
    const nx = Math.max(b.x, Math.min(body.x, b.x + b.w));
    const ny = Math.max(b.y, Math.min(body.y, b.y + b.h));
    const dx = body.x - nx;
    const dy = body.y - ny;
    if (dx * dx + dy * dy < r * r) {
      const d = Math.hypot(dx, dy);
      if (d === 0) { body.x = nx + r + 1; return true; }
      body.x = nx + (dx / d) * r;
      body.y = ny + (dy / d) * r;
      return true;
    }
  }
  body.x = Math.max(r, Math.min(CITY.w - r, body.x));
  body.y = Math.max(r, Math.min(CITY.h - r, body.y));
  return false;
}

// --- story -----------------------------------------------------------------

export function objectiveText(state) {
  if (state.storyDone) return 'Free roam — Coral Bay is yours';
  const ch = CHAPTERS[state.chapter];
  if (!ch) return '';
  switch (state.phase) {
    case 'idle': return ch.task;
    case 'toDocks': return 'Drive to the docks marker';
    case 'fetch': return 'Pick up the package at the marina';
    case 'deliver': return 'Deliver the package to the Coral Motel';
    case 'toSpray': return 'Reach the spray shop by Palm Park';
    case 'coolOff': return 'Lose the police (wanted stars to zero)';
    case 'dash': return `Reach Lighthouse Point — ${Math.max(0, Math.ceil(state.missionClock))}s left`;
    default: return ch.task;
  }
}

export function targetPlace(state) {
  const P = state.places;
  switch (state.phase) {
    case 'toDocks': return P.docks;
    case 'fetch': return P.marina;
    case 'deliver': return P.motel;
    case 'toSpray': case 'coolOff': return P.spray;
    case 'dash': return P.light;
    default: return null;
  }
}

export function openChapter(state, idx) {
  state.chapter = idx;
  const ch = CHAPTERS[idx];
  state.banner = { heading: ch.heading, body: ch.brief };
  state.bannerFor = 6;
  if (idx === 0) state.phase = 'idle';
  if (idx === 1) state.phase = 'fetch';
  if (idx === 2) { state.phase = 'toSpray'; makeTrouble(state, 70); }
  if (idx === 3) { state.phase = 'dash'; state.missionClock = 150; }
}

function closeChapter(state) {
  const ch = CHAPTERS[state.chapter];
  state.hero.cash += ch.pay;
  state.note = `Chapter complete — +$${ch.pay}`;
  state.noteFor = 4;
  if (state.chapter + 1 < CHAPTERS.length) openChapter(state, state.chapter + 1);
  else {
    state.storyDone = true;
    state.phase = 'free';
    state.banner = { heading: 'Story complete', body: 'Marco Reyes — King of Coral Bay. Free roam: the bay is yours.' };
    state.bannerFor = 7;
  }
}

export function startStory(state) {
  state.live = true;
  openChapter(state, 0);
}

// --- frame step --------------------------------------------------------------

export function stepWorld(state, input, dt) {
  const hero = state.hero;
  state.elapsed += dt;
  if (state.bannerFor > 0) state.bannerFor -= dt;
  if (state.noteFor > 0) state.noteFor -= dt;
  if (state.jolt > 0) state.jolt -= dt * 3;
  if (hero.swingCool > 0) hero.swingCool -= dt;
  if (state.sinceCrime > 0) state.sinceCrime -= dt;

  stepHero(state, input, dt);
  stepTraffic(state, dt);
  stepWalkers(state, dt);
  stepPolice(state, dt);
  stepHeat(state, dt);
  stepStory(state, dt);
}

function stepHero(state, input, dt) {
  const hero = state.hero;
  if (hero.car) {
    const car = hero.car;
    if (input.up) car.speed += 300 * dt;
    else if (input.down) car.speed -= (car.speed > 0 ? 380 : 160) * dt;
    else car.speed -= car.speed * 0.7 * dt;
    car.speed = Math.max(-130, Math.min(445, car.speed));
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    if (steer && Math.abs(car.speed) > 4) {
      car.heading += steer * 1.9 * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 130);
    }
    car.x += Math.cos(car.heading) * car.speed * dt;
    car.y += Math.sin(car.heading) * car.speed * dt;
    if (pushOutOfBuildings(state, car, 24)) {
      if (Math.abs(car.speed) > 170) { state.jolt = 0.7; car.health -= 9; }
      car.speed *= -0.25;
    }
    for (const walker of state.walkers) {
      if (!walker.down && Math.abs(car.speed) > 55 && gap(car, walker) < 24) {
        walker.down = true;
        walker.downFor = 5;
        makeTrouble(state, 40);
        car.speed *= 0.82;
      }
    }
    for (const other of state.cars) {
      if (other === car || other.wrecked) continue;
      const d = gap(car, other);
      if (d < 40) {
        const push = (40 - d) / 2;
        const a = Math.atan2(other.y - car.y, other.x - car.x);
        other.x += Math.cos(a) * push;
        other.y += Math.sin(a) * push;
        if (Math.abs(car.speed) > 120) {
          other.health -= 12;
          car.health -= 6;
          state.jolt = Math.max(state.jolt, 0.5);
          if (other.role === 'police') makeTrouble(state, 26);
          car.speed *= 0.72;
        }
      }
    }
    hero.x = car.x;
    hero.y = car.y;
    hero.heading = car.heading;
    if (input.use) leaveCar(state);
  } else {
    const speed = input.sprint ? WALKER.sprint : WALKER.cruise;
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (mx || my) {
      const len = Math.hypot(mx, my);
      hero.x += (mx / len) * speed * dt;
      hero.y += (my / len) * speed * dt;
      hero.heading = Math.atan2(my, mx);
    }
    if (inSea(hero.x)) hero.x -= 60 * dt;
    pushOutOfBuildings(state, hero, WALKER.radius);
    if (input.use) takeCar(state);
    if (input.hit && hero.swingCool <= 0) {
      hero.swingCool = 0.38;
      for (const walker of state.walkers) {
        if (!walker.down && gap(hero, walker) < 38) {
          walker.down = true;
          walker.downFor = 6;
          makeTrouble(state, 30);
        }
      }
    }
  }
}

function takeCar(state) {
  const hero = state.hero;
  let best = null;
  let bestGap = 52;
  for (const car of state.cars) {
    if (car.wrecked || car.role === 'police') continue;
    const d = gap(hero, car);
    if (d < bestGap) { bestGap = d; best = car; }
  }
  if (!best) return;
  const wasParked = best.role === 'parked';
  best.role = 'hero';
  hero.car = best;
  if (state.phase === 'idle' && state.chapter === 0) {
    state.phase = 'toDocks';
    state.note = 'Wheels acquired — head for the docks';
    state.noteFor = 3.5;
  }
  if (!wasParked || best.taken) makeTrouble(state, 22);
  best.taken = true;
}

function leaveCar(state) {
  const hero = state.hero;
  const car = hero.car;
  car.role = car.taken ? 'parked' : 'traffic';
  car.speed = 0;
  hero.car = null;
  hero.x = car.x + Math.cos(car.heading + Math.PI / 2) * 30;
  hero.y = car.y + Math.sin(car.heading + Math.PI / 2) * 30;
  pushOutOfBuildings(state, hero, WALKER.radius);
}

function stepTraffic(state, dt) {
  const xs = vRoads();
  const ys = hRoads();
  for (const car of state.cars) {
    if (car.role !== 'traffic' || car.wrecked) continue;
    car.cool -= dt;
    const horizontal = Math.abs(Math.cos(car.heading)) > 0.7;
    // Settle into the right-hand lane of whichever road carries the car.
    if (horizontal) {
      const lane = closest(ys, car.y) + (Math.cos(car.heading) > 0 ? CITY.road / 4 : -CITY.road / 4);
      car.y += (lane - car.y) * Math.min(1, dt * 2.4);
    } else {
      const lane = closest(xs, car.x) + (Math.sin(car.heading) > 0 ? -CITY.road / 4 : CITY.road / 4);
      car.x += (lane - car.x) * Math.min(1, dt * 2.4);
    }
    let cruise = 150;
    for (const other of state.cars) {
      if (other === car || other.wrecked) continue;
      const dx = other.x - car.x;
      const dy = other.y - car.y;
      const ahead = dx * Math.cos(car.heading) + dy * Math.sin(car.heading);
      const side = Math.abs(-dx * Math.sin(car.heading) + dy * Math.cos(car.heading));
      if (ahead > 0 && ahead < 74 && side < 20) cruise = Math.min(cruise, Math.max(0, (ahead - 46) * 3));
    }
    car.speed += Math.max(-260 * dt, Math.min(190 * dt, cruise - car.speed));
    car.x += Math.cos(car.heading) * car.speed * dt;
    car.y += Math.sin(car.heading) * car.speed * dt;
    const ix = closest(xs, car.x);
    const iy = closest(ys, car.y);
    if (car.cool <= 0 && Math.abs(ix - car.x) < 20 && Math.abs(iy - car.y) < 20 && state.rng() < 0.4) {
      const turn = state.rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      car.heading = Math.round((car.heading + turn) / (Math.PI / 2)) * (Math.PI / 2);
      car.cool = 2.5;
    }
    if (car.x > SHORE_X + 60 || car.x < -60 || car.y < -60 || car.y > CITY.h + 60) {
      car.x = 120;
      car.y = closest(ys, car.y);
    }
    if (car.health <= 0) { car.wrecked = true; car.speed = 0; }
  }
}

function stepWalkers(state, dt) {
  for (const walker of state.walkers) {
    if (walker.down) {
      walker.downFor -= dt;
      if (walker.downFor <= 0) walker.down = false;
      continue;
    }
    let threat = null;
    for (const car of state.cars) {
      if (!car.wrecked && Math.abs(car.speed) > 200 && gap(car, walker) < 90) threat = car;
    }
    if (threat) {
      walker.heading = Math.atan2(walker.y - threat.y, walker.x - threat.x);
      walker.x += Math.cos(walker.heading) * 130 * dt;
      walker.y += Math.sin(walker.heading) * 130 * dt;
      continue;
    }
    if (!walker.goalX || Math.hypot(walker.goalX - walker.x, walker.goalY - walker.y) < 12) {
      walker.goalX = choose(state.rng, vRoads()) + between(state.rng, -190, 190);
      walker.goalY = choose(state.rng, hRoads()) + between(state.rng, -150, 150);
    }
    const a = Math.atan2(walker.goalY - walker.y, walker.goalX - walker.x);
    walker.heading = a;
    walker.x += Math.cos(a) * walker.pace * dt;
    walker.y += Math.sin(a) * walker.pace * dt;
    pushOutOfBuildings(state, walker, 10);
  }
}

function stepPolice(state, dt) {
  const hero = state.hero;
  const want = state.stars;
  const active = state.cars.filter((c) => c.role === 'police' && !c.wrecked);
  const target = want === 0 ? 0 : Math.min(6, want + 1);
  if (active.length < target && state.rng() < dt * 0.7) {
    const a = between(state.rng, 0, Math.PI * 2);
    const x = Math.max(40, Math.min(CITY.w - 40, hero.x + Math.cos(a) * 620));
    const y = Math.max(40, Math.min(CITY.h - 40, hero.y + Math.sin(a) * 620));
    if (!inSea(x)) state.cars.push(spawnCar(x, y, a + Math.PI, '#dfe6ee', 'police'));
  }
  for (const cop of state.cars) {
    if (cop.role !== 'police' || cop.wrecked) continue;
    if (want === 0) {
      cop.role = 'traffic';
      cop.speed = 120;
      continue;
    }
    const d = gap(cop, hero);
    const wantAngle = Math.atan2(hero.y - cop.y, hero.x - cop.x);
    let diff = wantAngle - cop.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const top = d > 420 ? 480 : 415;
    cop.speed += Math.max(-320 * dt, Math.min(300 * dt, top - cop.speed));
    cop.x += Math.cos(cop.heading) * cop.speed * dt;
    cop.y += Math.sin(cop.heading) * cop.speed * dt;
    if (pushOutOfBuildings(state, cop, 24)) cop.speed *= 0.4;
    if (d < 42 && Math.abs(cop.speed) > 130) {
      state.jolt = Math.max(state.jolt, 0.45);
      if (hero.car) { hero.car.health -= 7; cop.speed *= 0.5; }
      else hero.health -= 6;
    }
    if (cop.health <= 0) { cop.wrecked = true; makeTrouble(state, 34); }
  }
  let copClose = false;
  for (const cop of state.cars) {
    if (cop.role === 'police' && !cop.wrecked && gap(cop, hero) < (hero.car ? 64 : 50)) copClose = true;
  }
  const heroSpeed = hero.car ? Math.abs(hero.car.speed) : 0;
  if (copClose && state.stars > 0 && (!hero.car || heroSpeed < 42)) hero.bustMeter += dt;
  else hero.bustMeter = Math.max(0, hero.bustMeter - dt * 1.6);
  if (hero.bustMeter >= 2.4) finishRun(state, 'busted');
  if (hero.health <= 0 || (hero.car && hero.car.health <= 0)) finishRun(state, 'wasted');
}

function finishRun(state, kind) {
  state.ended = kind;
  state.hero.cash = Math.max(0, state.hero.cash - 150);
  state.heat = 0;
  state.hero.bustMeter = 0;
}

export function respawnHero(state) {
  const hero = state.hero;
  state.ended = null;
  hero.health = 100;
  hero.car = null;
  hero.x = state.places.motel.x + 60;
  hero.y = state.places.motel.y + 90;
  state.cars = state.cars.filter((c) => c.role !== 'police');
}

function stepHeat(state, dt) {
  state.stars = starsFor(state.heat);
  if (state.sinceCrime <= 0 && state.heat > 0) {
    let watched = false;
    for (const cop of state.cars) {
      if (cop.role === 'police' && !cop.wrecked && gap(cop, state.hero) < 300) watched = true;
    }
    state.heat = Math.max(0, state.heat - dt * (watched ? 0.7 : 3.2));
  }
}

function stepStory(state, dt) {
  if (!state.live || state.storyDone || state.ended) return;
  const hero = state.hero;
  const target = targetPlace(state);
  const near = target && Math.hypot(target.x - hero.x, target.y - hero.y) < 95;
  switch (state.phase) {
    case 'toDocks':
      if (near && hero.car) closeChapter(state);
      break;
    case 'fetch':
      if (near) {
        hero.carrying = true;
        state.phase = 'deliver';
        state.note = 'Package picked up — the police noticed';
        state.noteFor = 3.5;
        makeTrouble(state, 45);
      }
      break;
    case 'deliver':
      if (near) { hero.carrying = false; closeChapter(state); }
      break;
    case 'toSpray':
      if (near) {
        state.phase = 'coolOff';
        state.note = 'Made it to the shop — now lose the heat';
        state.noteFor = 3.5;
      }
      break;
    case 'coolOff':
      if (state.stars === 0) closeChapter(state);
      break;
    case 'dash':
      state.missionClock -= dt;
      if (near && hero.car) closeChapter(state);
      else if (state.missionClock <= 0) {
        state.missionClock = 150;
        state.note = 'Out of time — the run resets, try again';
        state.noteFor = 3.5;
      }
      break;
  }
}
