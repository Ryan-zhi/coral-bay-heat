// Coral Bay Heat — the handover program for the gta6-01 bounty.
//
// The game itself is the static site under game/ (open game/index.html in
// a browser and play; it needs no build and no network). This program's
// whole job is to hand that site in: copy game/ and screenshots/ into the
// output directory and write the dossier the judges read, using the
// vendored make.fun dossier builder.
//
// Run it with Node 22:  node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR points at the output directory.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('Coral Bay Heat handed in: game/, screenshots/ and dossier.json written to', outDir);
