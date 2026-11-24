// Coral Bay Heat — boot, screens, the game loop, saving, and sound.
// Screens: title -> play <-> pause, with busted / wasted overlays that
// respawn Marco at the Coral Motel. Progress (mission, cash) is saved to
// localStorage whenever a mission completes.

import { buildWorld, update, beginStory, startMission, respawn, currentObjective } from './world.js';
import { drawWorld, drawHUD, makeCamera } from './render.js';
import { makeInput } from './input.js';
import { poseScene } from './shots.js';
import { MISSIONS, STORY_END } from './config.js';

const SAVE_KEY = 'coral-bay-heat-save-v1';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput();

let audio = null;
function beep(freq, dur, type = 'square', vol = 0.05, when = 0) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t); osc.stop(t + dur);
  } catch { /* sound is a garnish, never a blocker */ }
}
function jingle(kind) {
  if (kind === 'complete') { beep(660, 0.12); beep(880, 0.14, 'square', 0.05, 0.11); beep(990, 0.2, 'square', 0.05, 0.24); }
  if (kind === 'pickup') { beep(520, 0.09); beep(780, 0.12, 'square', 0.05, 0.08); }
  if (kind === 'bad') { beep(300, 0.25, 'sawtooth', 0.06); beep(190, 0.4, 'sawtooth', 0.06, 0.2); }
}

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
function writeSave(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      missionIndex: state.missionIndex, cash: state.player.cash, finishedStory: state.finishedStory,
    }));
  } catch { /* private mode etc. */ }
}

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
let state, screen = 'title';
let lastMission = -1, lastToast = null, lastOver = null;

function newGame(fromSave) {
  state = buildWorld(20261124);
  if (fromSave) {
    state.player.cash = fromSave.cash ?? state.player.cash;
    state.started = true;
    if (fromSave.finishedStory) {
      state.finishedStory = true;
      state.phase = 'done';
      state.missionIndex = MISSIONS.length - 1;
    } else {
      startMission(state, Math.min(fromSave.missionIndex ?? 0, MISSIONS.length - 1));
    }
  }
  lastMission = state.missionIndex;
  lastToast = null; lastOver = null;
}

if (shotName) {
  const posed = poseScene(shotName);
  state = posed.state;
  screen = posed.screen;
  // Let the simulation settle for a moment so wheels, stars and banners
  // sit naturally, with the driver holding the throttle in the chase.
  const settle = { up: shotName === 'chase', down: false, left: false, right: false, sprint: false, interact: false, attack: false };
  const steps = shotName === 'chase' ? 9 : 26;
  for (let i = 0; i < steps; i++) update(state, settle, 1 / 30);
  if (shotName === 'chase') state.bannerT = 0;
  requestAnimationFrame(() => {
    drawFrame(100);
    window.__shotReady = true;
  });
} else {
  newGame(null);
  requestAnimationFrame(loop);
}

let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  step(dt, now);
  drawFrame(now);
}

function step(dt, now) {
  if (screen === 'title') {
    if (input.confirm) { newGame(null); beginStory(state); screen = 'play'; writeSave(state); }
    if (loadSave() && (input.interact || input.attack)) { newGame(loadSave()); screen = 'play'; }
    return;
  }
  if (screen === 'pause') {
    if (input.pause || input.confirm) screen = 'play';
    return;
  }
  if (state.over) {
    if (input.confirm) { respawn(state); }
    return;
  }
  if (input.pause) { screen = 'pause'; return; }
  update(state, input, dt);
  if (state.missionIndex !== lastMission) { lastMission = state.missionIndex; writeSave(state); jingle('complete'); }
  if (state.toast && state.toast !== lastToast) { lastToast = state.toast; if (state.toast.includes('Package')) jingle('pickup'); }
  if (state.over && state.over !== lastOver) { lastOver = state.over; jingle('bad'); }
}

function drawFrame(now) {
  const w = canvas.width, h = canvas.height;
  const cam = makeCamera(state, w, h);
  drawWorld(ctx, state, cam, w, h, now);
  if (screen === 'title') return drawTitle(w, h, now);
  drawHUD(ctx, state, w, h, currentObjective(state), now);
  if (screen === 'pause') return drawPause(w, h);
  if (state.over) return drawOver(w, h);
  if (!state.started) return;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD drive / walk · E enter & exit car · F punch · Shift sprint · Esc pause', w / 2, h - 12);
  ctx.textAlign = 'left';
}

function drawTitle(w, h, now) {
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
  const blink = Math.floor(now / 550) % 2 === 0;
  if (blink) ctx.fillText('PRESS ENTER — NEW GAME', w / 2, h * 0.72);
  if (loadSave()) {
    ctx.fillStyle = '#a7f3c9';
    ctx.font = '700 19px system-ui, sans-serif';
    ctx.fillText('PRESS E — CONTINUE YOUR SAVED GAME', w / 2, h * 0.72 + 38);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move & drive · E — enter / exit car · F or Space — punch · Shift — sprint · Esc — pause', w / 2, h * 0.88);
  ctx.textAlign = 'left';
}

function drawPause(w, h) {
  ctx.fillStyle = 'rgba(8,16,26,0.62)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd60a';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', w / 2, h / 2 - 20);
  ctx.fillStyle = '#fff';
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText(`Cash $${state.player.cash} · ${state.finishedStory ? STORY_END : MISSIONS[state.missionIndex].title}`, w / 2, h / 2 + 22);
  ctx.fillText('Esc or Enter — back to the bay', w / 2, h / 2 + 54);
  ctx.textAlign = 'left';
}

function drawOver(w, h) {
  ctx.fillStyle = state.over === 'busted' ? 'rgba(20,30,90,0.55)' : 'rgba(90,10,10,0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText(state.over === 'busted' ? 'BUSTED' : 'WASTED', w / 2, h / 2 - 16);
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText('The Coral Motel patches you up and the bay forgets — for $150. Press Enter to get back out there.', w / 2, h / 2 + 28);
  ctx.textAlign = 'left';
}
