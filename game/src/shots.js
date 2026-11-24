// Coral Bay Heat — staged scenes for the entry's screenshot folder.
// Every scene builds the real seeded city, starts the real story, then
// poses the actors by hand (positions, speeds, heat) so a headless
// browser can photograph a truthful frame of the game:
// ?shot=title | street | chase | marina.

import { buildWorld, startStory, hRoads } from './world.js';
import { CITY } from './config.js';

export function stageScene(name) {
  const state = buildWorld(20261124);
  const P = state.places;
  const hero = state.hero;
  if (name === 'title') return { state, screen: 'title' };
  startStory(state);
  state.bannerFor = 0;

  if (name === 'street') {
    // On foot outside the Coral Motel at rush hour.
    hero.x = P.motel.x + 150;
    hero.y = P.motel.y + 40;
    hero.heading = 0.4;
    state.walkers[0].x = hero.x + 90; state.walkers[0].y = hero.y + 46;
    state.walkers[1].x = hero.x - 70; state.walkers[1].y = hero.y + 88;
    state.walkers[2].x = hero.x + 40; state.walkers[2].y = hero.y - 96;
    return { state, screen: 'play' };
  }

  if (name === 'chase') {
    // Chapter 2, seconds after the pickup: package aboard, four stars,
    // three patrol cars stacked up behind Marco's stolen ride on the
    // straight road that runs past the marina.
    state.chapter = 1;
    state.phase = 'deliver';
    hero.carrying = true;
    state.sinceCrime = 30;
    const ys = hRoads();
    let roadY = ys[0];
    let bestGap = Infinity;
    for (const y of ys) {
      const d = Math.abs(y - P.marina.y);
      if (d < bestGap) { bestGap = d; roadY = y; }
    }
    const ride = state.cars.find((c) => c.role === 'traffic');
    ride.role = 'hero';
    ride.taken = true;
    ride.x = P.marina.x - 240;
    ride.y = roadY - CITY.road / 4;
    ride.heading = Math.PI;
    ride.speed = 385;
    hero.car = ride;
    hero.x = ride.x;
    hero.y = ride.y;
    state.heat = 120;
    for (let i = 0; i < 3; i++) {
      const cop = state.cars[state.cars.length - 1 - i];
      cop.role = 'police';
      cop.paint = '#dfe6ee';
      cop.wrecked = false;
      cop.x = ride.x + 100 + i * 74;
      cop.y = ride.y + (i === 1 ? 26 : 0);
      cop.heading = Math.PI;
      cop.speed = 380;
    }
    return { state, screen: 'play' };
  }

  if (name === 'marina') {
    // Chapter 2 opening beat: on foot at the marina, marker overhead.
    state.chapter = 1;
    state.phase = 'fetch';
    hero.x = P.marina.x - 90;
    hero.y = P.marina.y + 60;
    hero.heading = 0.2;
    state.walkers[3].x = hero.x + 120;
    state.walkers[3].y = hero.y + 30;
    return { state, screen: 'play' };
  }

  return { state, screen: 'title' };
}
