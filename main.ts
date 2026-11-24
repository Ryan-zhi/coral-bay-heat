// Coral Bay Heat — entry point for the gta6-01 bounty submission.
//
// The playable thing is the static site in game/: open game/index.html
// through any static file server and the whole city runs offline in the
// browser, no build step and no network calls. This program simply
// delivers that site to the grader: it mirrors game/ and screenshots/
// into the output directory and asks the vendored make.fun library to
// write the dossier summary the judges score from.
//
//   node main.ts            (Node 22)
//   MAKEFUN_OUTPUT_DIR=out node main.ts     — outside the grader

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(target, { recursive: true });
cpSync(join(here, 'game'), join(target, 'game'), { recursive: true });
mkdirSync(join(target, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(target, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(target, 'dossier.json'),
  buildDossier(target, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log('Coral Bay Heat delivered to', target);
