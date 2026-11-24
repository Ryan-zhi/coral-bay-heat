// Coral Bay Heat — tuning constants and the mission script.
// Everything the game balances on lives here: city size, speeds, colours,
// and the four story missions with their dialogue and objectives.

export const WORLD = {
  width: 3360,
  height: 2520,
  blockW: 420,
  blockH: 315,
  roadW: 84,
};

export const COLORS = {
  water: '#2ea8c7',
  waterDeep: '#1f87a8',
  sand: '#f2ddae',
  grass: '#7ec850',
  grassDark: '#63b23e',
  road: '#4a4a52',
  roadEdge: '#3a3a41',
  lane: '#f7e9a0',
  sidewalk: '#cfc8bb',
  plaza: '#e8dfc9',
};

export const BUILDING_COLORS = [
  '#f6b8a0', '#f9d976', '#a8e063', '#7fd8f7', '#f78fb3',
  '#c3aed6', '#ffd3b6', '#a0e7e5', '#fbe7c6', '#e2b0ff',
];

export const CAR_COLORS = [
  '#e63946', '#f1fa8c', '#2a9d8f', '#e9c46a', '#f4a261',
  '#9b5de5', '#00bbf9', '#fee440', '#ffffff', '#8d99ae',
];

export const PLAYER = {
  walkSpeed: 165,
  sprintSpeed: 265,
  radius: 13,
};

export const MISSIONS = [
  {
    id: 'first-wheels',
    title: 'Mission 1 — First Wheels',
    intro: 'Marco is back in Coral Bay with empty pockets. Rosa at the motel needs a driver — first, get yourself a car and reach the docks.',
    objective: 'Steal any car, then drive to the docks marker',
    reward: 250,
  },
  {
    id: 'the-package',
    title: 'Mission 2 — The Package',
    intro: 'A courier dropped a package at the marina and the police are already curious. Pick it up and bring it to Rosa at the Coral Motel.',
    objective: 'Pick up the package at the marina, deliver it to the Coral Motel',
    reward: 600,
  },
  {
    id: 'lose-the-heat',
    title: 'Mission 3 — Lose the Heat',
    intro: 'The drop went loud. Every badge in Coral Bay is looking for you. Shake the police and slip into the spray shop by the park.',
    objective: 'Reach the spray shop with the heat on, then lose the cops',
    reward: 900,
  },
  {
    id: 'sunset-run',
    title: 'Mission 4 — Sunset Run',
    intro: 'One last job: Rosa\u2019s boat leaves from the lighthouse point at sunset. Drive the bay road and get there before the light goes.',
    objective: 'Reach the lighthouse point before the timer runs out',
    reward: 1500,
  },
];

export const STORY_END = 'Marco Reyes — King of Coral Bay. The bay is yours: keep driving, keep shining.';
