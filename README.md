# Coral Bay Heat

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Ryan-zhi/coral-bay-heat/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/Ryan-zhi/coral-bay-heat/reward.svg)](https://make.fun/bounty/gta6-01)

An original open-world crime game for the
[make.fun](https://make.fun) **gta6-01** bounty — no assets, names or
material from any commercial game: the city, the people and the story are
all Coral Bay's own.

Marco Reyes is back in Coral Bay with empty pockets. Steal a car, run
Rosa's jobs from the Coral Motel to the docks, the marina and the
lighthouse, and dodge the Coral Bay PD while the wanted stars climb.

## What's in the game

- **A living city** — a seeded, sun-soaked coastal city: road grid with
  lane-following traffic, parked cars to steal, pedestrians who stroll
  and flee, pastel towers, Palm Park, a beach, marina, docks and a
  lighthouse.
- **Driving & stealing** — walk up to any car and press E; arcade driving
  with traffic that brakes, turns and honks its way around you.
- **Wanted system & police** — crimes raise your stars; police cars spawn,
  chase, ram and bust you if they pin you down. Lose them to cool off.
- **Four story missions** — First Wheels, The Package, Lose the Heat and
  the timed Sunset Run, with banners, objectives, markers, a minimap and
  cash rewards; then free roam.
- **HUD & menus** — minimap with police blips and the mission marker,
  wanted stars, health and car condition, speedometer, bust meter, title
  screen, pause, busted/wasted screens — and progress saved in the
  browser.

## Play

Serve `game/` with any static file server (or open it through one) and
visit `index.html`. WASD/arrows move and drive, E enters and exits cars,
F or Space punches, Shift sprints, Esc pauses.

## Layout

- `main.ts` — the handover program (copies the game into `/output` and
  writes the dossier with `vendor/makefun-game.ts`).
- `game/src/world.js` — city generation, traffic, police, wanted,
  missions, collisions: the simulation.
- `game/src/render.js` — canvas drawing, HUD and minimap.
- `game/src/main.js` — screens, loop, saving, sound.
- `game/src/shots.js` — the posed scenes behind `screenshots/`.

MIT licensed.
