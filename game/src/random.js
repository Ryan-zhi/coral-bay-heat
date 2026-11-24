// Seeded randomness (mulberry32). Coral Bay is generated from one seed,
// so every visit builds the identical city — same towers, same palms,
// same parked cars — while the scatter still feels hand-placed.

export function rngFrom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function choose(rng, list) {
  return list[(rng() * list.length) | 0];
}

export function between(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}
