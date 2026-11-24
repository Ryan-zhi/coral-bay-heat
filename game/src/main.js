// Coral Bay Heat — the front door. Owns the canvas, the screen state
// (title / play / pause, plus the busted and wasted overlays), the
// localStorage save, the frame loop and a pocket WebAudio synth for the
// little stingers. The simulation itself lives in world.js; everything
// drawn comes from render.js.

import { buildWorld, stepWorld, startStory, openChapter, respawnHero, objectiveText } from './world.js';
import { paintWorld, paintHud, cameraFor } from './render.js';
import { wireKeyboard } from './input.js';
import { stageScene } from './shots.js';
import { CHAPTERS, EPILOGUE } from './config.js';

const STORAGE_KEY = 'coral-bay-heat-save-v1';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = wireKeyboard();

// --- tiny synth --------------------------------------------------------------

let synth = null;
function tone(freq, dur, type = 'square', vol = 0.05, delay = 0) {
  try {
    synth = synth || new (window.AudioContext || window.webkitAudioContext)();
    const t = synth.currentTime + delay;
    const osc = synth.createOscillator();
    const amp = synth.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(vol, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(amp).connect(synth.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch { /* silence is fine too */ }
}
function sting(kind) {
  if (kind === 'done') { tone(660, 0.12); tone(880, 0.14, 'square', 0.05, 0.11); tone(990, 0.2, 'square', 0.05, 0.24); }
  if (kind === 'pickup') { tone(520, 0.09); tone(780, 0.12, 'square', 0.05, 0.08); }
  if (kind === 'bad') { tone(300, 0.25, 'sawtooth', 0.06); tone(190, 0.4, 'sawtooth', 0.06, 0.2); }
}

// --- save / restore ------------------------------------------------------------

function readSave() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function writeSave(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      chapter: state.chapter,
      cash: state.hero.cash,
      storyDone: state.storyDone,
    }));
  } catch { /* private browsing etc. */ }
}

// --- session state ---------------------------------------------------------------

let world = null;
let screen = 'title';
let seenChapter = -1;
let seenNote = null;
let seenEnd = null;

function freshWorld(save) {
  world = buildWorld(20261124);
  if (save) {
    world.hero.cash = save.cash ?? world.hero.cash;
    world.live = true;
    if (save.storyDone) {
      world.storyDone = true;
      world.phase = 'free';
      world.chapter = CHAPTERS.length - 1;
    } else {
      openChapter(world, Math.min(save.chapter ?? 0, CHAPTERS.length - 1));
    }
  }
  seenChapter = world.chapter;
  seenNote = null;
  seenEnd = null;
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  const staged = stageScene(shot);
  world = staged.state;
  screen = staged.screen;
  // Settle the simulation briefly so wheels, stars and banners sit the
  // way they would mid-play; the chase scene holds the throttle down.
  const cruise = { up: shot === 'chase', down: false, left: false, right: false, sprint: false, use: false, hit: false };
  const steps = shot === 'chase' ? 9 : 26;
  for (let i = 0; i < steps; i++) stepWorld(world, cruise, 1 / 30);
  if (shot === 'chase') world.bannerFor = 0;
  requestAnimationFrame(() => {
    draw(100);
    window.__shotReady = true;
  });
} else {
  freshWorld(null);
  requestAnimationFrame(loop);
}

// --- loop --------------------------------------------------------------------------

let lastStamp = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastStamp) / 1000);
  lastStamp = now;
  tick(dt);
  draw(now);
}

function tick(dt) {
  if (screen === 'title') {
    if (keys.confirm) {
      freshWorld(null);
      startStory(world);
      screen = 'play';
      writeSave(world);
    } else if (readSave() && keys.use) {
      freshWorld(readSave());
      screen = 'play';
    }
    return;
  }
  if (screen === 'pause') {
    if (keys.pause || keys.confirm) screen = 'play';
    return;
  }
  if (world.ended) {
    if (keys.confirm) respawnHero(world);
    return;
  }
  if (keys.pause) { screen = 'pause'; return; }
  stepWorld(world, keys, dt);
  if (world.chapter !== seenChapter) {
    seenChapter = world.chapter;
    writeSave(world);
    sting('done');
  }
  if (world.note && world.note !== seenNote) {
    seenNote = world.note;
    if (world.note.includes('Package')) sting('pickup');
  }
  if (world.ended && world.ended !== seenEnd) {
    seenEnd = world.ended;
    sting('bad');
  }
}

// --- drawing -------------------------------------------------------------------------

function draw(now) {
  const w = canvas.width;
  const h = canvas.height;
  const cam = cameraFor(world, w, h);
  paintWorld(ctx, world, cam, w, h, now);
  if (screen === 'title') return paintTitle(w, h, now);
  paintHud(ctx, world, w, h, objectiveText(world), now);
  if (screen === 'pause') return paintPause(w, h);
  if (world.ended) return paintEnded(w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD drive / walk · E enter & exit car · F punch · Shift sprint · Esc pause', w / 2, h - 12);
  ctx.textAlign = 'left';
}

function paintTitle(w, h, now) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(8,20,38,0.25)');
  grad.addColorStop(0.55, 'rgba(8,20,38,0.45)');
  grad.addColorStop(1, 'rgba(8,20,38,0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd60a';
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.fillText('CORAL BAY', w / 2, h * 0.34);
  ctx.fillStyle = '#ff5d8f';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText('H E A T', w / 2, h * 0.34 + 74);
  ctx.fillStyle = '#eaf6f6';
  ctx.font = '500 19px system-ui, sans-serif';
  ctx.fillText('Marco Reyes is back in Coral Bay with empty pockets and a fast right foot.', w / 2, h * 0.34 + 122);
  ctx.fillText('Steal cars, run Rosa\u2019s jobs, dodge the Coral Bay PD — own the bay by sunset.', w / 2, h * 0.34 + 148);
  ctx.fillStyle = '#ffd60a';
  ctx.font = '800 23px system-ui, sans-serif';
  if (Math.floor(now / 550) % 2 === 0) ctx.fillText('PRESS ENTER — NEW GAME', w / 2, h * 0.72);
  if (readSave()) {
    ctx.fillStyle = '#a7f3c9';
    ctx.font = '700 19px system-ui, sans-serif';
    ctx.fillText('PRESS E — CONTINUE YOUR SAVED GAME', w / 2, h * 0.72 + 38);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move & drive · E — enter / exit car · F or Space — punch · Shift — sprint · Esc — pause', w / 2, h * 0.88);
  ctx.textAlign = 'left';
}

function paintPause(w, h) {
  ctx.fillStyle = 'rgba(8,16,26,0.62)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd60a';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', w / 2, h / 2 - 20);
  ctx.fillStyle = '#fff';
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText(`Cash $${world.hero.cash} · ${world.storyDone ? EPILOGUE : CHAPTERS[world.chapter].heading}`, w / 2, h / 2 + 22);
  ctx.fillText('Esc or Enter — back to the bay', w / 2, h / 2 + 54);
  ctx.textAlign = 'left';
}

function paintEnded(w, h) {
  ctx.fillStyle = world.ended === 'busted' ? 'rgba(20,30,90,0.55)' : 'rgba(90,10,10,0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText(world.ended === 'busted' ? 'BUSTED' : 'WASTED', w / 2, h / 2 - 16);
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText('The Coral Motel patches you up and the bay forgets — for $150. Press Enter to get back out there.', w / 2, h / 2 + 28);
  ctx.textAlign = 'left';
}
