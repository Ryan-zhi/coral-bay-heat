// Coral Bay Heat — screenshot scenes for the entry's screenshots/ folder.
// Each scene poses the world deterministically (seeded city, scripted
// positions) so a headless browser can render a truthful frame of the
// real game: ?shot=title | street | chase | marina.

import { buildWorld, beginStory, roadCentersY } from './world.js';
import { WORLD } from './config.js';

export function poseScene(name) {
  const state = buildWorld(20261124);
  const L = state.landmarks;
  const p = state.player;
  if (name === 'title') return { state, screen: 'title' };
  beginStory(state);
  state.bannerT = 0;
  if (name === 'street') {
    p.x = L.motel.x + 150; p.y = L.motel.y + 40;
    p.angle = 0.4;
    // A couple of pedestrians and cars near the player for a lively street.
    state.peds[0].x = p.x + 90; state.peds[0].y = p.y + 46;
    state.peds[1].x = p.x - 70; state.peds[1].y = p.y + 88;
    state.peds[2].x = p.x + 40; state.peds[2].y = p.y - 96;
    return { state, screen: 'play' };
  }
  if (name === 'chase') {
    // Mid Mission 2: package aboard, heat on, police on the tail —
    // posed on the straight bay-side road so the chase reads at a glance.
    state.missionIndex = 1;
    state.phase = 'toMotel';
    p.hasPackage = true;
    state.crimeTimer = 30;
    const ys = roadCentersY();
    let roadY = ys[0], bd = Infinity;
    for (const y of ys) { const d = Math.abs(y - L.marina.y); if (d < bd) { bd = d; roadY = y; } }
    const car = state.cars.find((c) => c.kind === 'traffic');
    car.kind = 'player'; car.stolen = true;
    car.x = L.marina.x - 240; car.y = roadY - WORLD.roadW / 4;
    car.angle = Math.PI; car.speed = 385;
    p.car = car; p.x = car.x; p.y = car.y;
    state.heat = 120;
    for (let i = 0; i < 3; i++) {
      const cop = state.cars[state.cars.length - 1 - i];
      cop.kind = 'police'; cop.color = '#dfe6ee'; cop.dead = false;
      cop.x = car.x + 100 + i * 74;
      cop.y = car.y + (i === 1 ? 26 : 0);
      cop.angle = Math.PI;
      cop.speed = 380;
    }
    return { state, screen: 'play' };
  }
  if (name === 'marina') {
    state.missionIndex = 1;
    state.phase = 'toPackage';
    p.x = L.marina.x - 90; p.y = L.marina.y + 60;
    p.angle = 0.2;
    state.peds[3].x = p.x + 120; state.peds[3].y = p.y + 30;
    return { state, screen: 'play' };
  }
  return { state, screen: 'title' };
}
