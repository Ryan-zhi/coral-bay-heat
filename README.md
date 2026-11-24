# Coral Bay Heat

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Ryan-zhi/coral-bay-heat/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/Ryan-zhi/coral-bay-heat/reward.svg)](https://make.fun/bounty/gta6-01)

A complete, original open-world crime game that runs in the browser,
built for the [make.fun](https://make.fun) **gta6-01** bounty. The city,
the people and the story are Coral Bay's own — nothing here comes from
any commercial game.

Marco Reyes rolls back into Coral Bay broke. Rosa, who runs the Coral
Motel, has work for a driver with no questions and quick hands: a car to
lift, a package to move, heat to shake, and one last sunset run to the
lighthouse before her boat leaves.

## What is in the bay

- **A living, seeded city** — the same sun-soaked coastline on every
  load: a road grid with lane-following traffic that brakes for the car
  ahead and turns at intersections, parked cars waiting to be borrowed,
  pedestrians who stroll the blocks and scatter from fast traffic,
  pastel tower blocks, Palm Park with its fountain, a beach, a marina,
  working docks and a lighthouse.
- **On foot and behind the wheel** — walk or sprint anywhere, punch
  troublemakers, step up to any car and take it. Driving is pure arcade:
  throttle, brake, reverse, speed-sensitive steering, building scrapes
  and car-to-car shunts.
- **The Coral Bay PD** — every crime feeds a heat meter worth one to
  five wanted stars. Patrol cars spawn as the stars climb, hunt Marco
  down and ram him; pin him slow or on foot and the bust meter fills.
  Busted or wasted, the motel patches him up for $150 and the bay
  forgets — until the next job.
- **Four story chapters** — First Wheels, The Package, Lose the Heat
  and the timed Sunset Run, each introduced with a banner and brief,
  tracked by an on-screen objective, a pulsing world marker and an
  off-screen arrow, and paid in cash. Finish the story and the bay is
  yours in free roam.
- **Full HUD** — mission and cash card, health, speedometer and car
  condition while driving, wanted stars, bust meter, toast notes, and a
  minimap with the mission marker and flashing police blips.
- **Screens and saving** — title screen with story and controls, pause,
  busted/wasted overlays, and progress (chapter, cash, story finished)
  kept in localStorage so a saved game can be continued.

## How to play

Serve the `game/` folder with any static file server and open
`index.html`. No build step, no network requests.

| Keys | Action |
| --- | --- |
| WASD / arrows | Walk, drive, steer |
| Shift | Sprint on foot |
| E | Enter / exit a car |
| F or Space | Punch |
| Esc or P | Pause |
| Enter | Confirm / respawn |

## How the code is laid out

- `main.ts` — the submission program: copies the game into `/output`
  and writes the judges' dossier via `vendor/makefun-game.ts`.
- `game/src/world.js` — the simulation: city generation, traffic,
  pedestrians, police, wanted, collisions, the chapter chain.
- `game/src/render.js` — every pixel: city, cars, people, HUD, minimap,
  menus.
- `game/src/main.js` — screens, the frame loop, saving, sound stingers.
- `game/src/config.js` — geometry, palette and the chapter script.
- `game/src/shots.js` — the staged scenes behind `screenshots/`.

MIT licensed.
