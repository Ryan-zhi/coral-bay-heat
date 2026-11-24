// Coral Bay Heat — shared tuning: world geometry, palette, the player
// capsule and the four-chapter story script Rosa hands to Marco.

export const CITY = {
  w: 3360,
  h: 2520,
  blockW: 420,
  blockH: 315,
  road: 84,
};

export const PALETTE = {
  sea: '#2ea8c7',
  seaDeep: '#1d84a6',
  beach: '#f2ddae',
  lawn: '#7ec850',
  lawnDark: '#5fb23c',
  asphalt: '#494951',
  lanePaint: '#f7e9a0',
  pavement: '#cfc8bb',
};

export const PAINTS = [
  '#f6b8a0', '#f9d976', '#a8e063', '#7fd8f7', '#f78fb3',
  '#c3aed6', '#ffd3b6', '#a0e7e5', '#fbe7c6', '#e2b0ff',
];

export const CAR_PAINTS = [
  '#e63946', '#f1fa8c', '#2a9d8f', '#e9c46a', '#f4a261',
  '#9b5de5', '#00bbf9', '#fee440', '#ffffff', '#8d99ae',
];

export const WALKER = { cruise: 165, sprint: 265, radius: 13 };

export const CHAPTERS = [
  {
    key: 'wheels',
    heading: 'Chapter 1 — First Wheels',
    brief: 'Marco Reyes is back in Coral Bay with empty pockets. Rosa at the motel needs a driver — first, get yourself a car and reach the docks.',
    task: 'Steal any car, then drive to the docks marker',
    pay: 250,
  },
  {
    key: 'package',
    heading: 'Chapter 2 — The Package',
    brief: 'A courier dropped a package at the marina and the police are already curious. Pick it up and bring it to Rosa at the Coral Motel.',
    task: 'Pick up the package at the marina, deliver it to the Coral Motel',
    pay: 600,
  },
  {
    key: 'heat',
    heading: 'Chapter 3 — Lose the Heat',
    brief: 'The drop went loud. Every badge in Coral Bay is looking for you. Shake the police and slip into the spray shop by the park.',
    task: 'Reach the spray shop with the heat on, then lose the cops',
    pay: 900,
  },
  {
    key: 'sunset',
    heading: 'Chapter 4 — Sunset Run',
    brief: 'One last job: Rosa\u2019s boat leaves from the lighthouse point at sunset. Drive the bay road and get there before the light goes.',
    task: 'Reach the lighthouse point before the timer runs out',
    pay: 1500,
  },
];

export const EPILOGUE = 'Marco Reyes — King of Coral Bay. The bay is yours: keep driving, keep shining.';
