// Coral Bay Heat — keyboard input. Movement keys are held-state; action
// keys (enter car, punch, pause, confirm) are edge-triggered so one press
// fires once.

export function makeInput() {
  const held = new Set();
  const pressed = new Set();
  const map = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
  };
  const edge = { KeyE: 'interact', KeyF: 'attack', Space: 'attack', Escape: 'pause', Enter: 'confirm', KeyP: 'pause' };

  window.addEventListener('keydown', (e) => {
    if (map[e.code]) { held.add(map[e.code]); e.preventDefault(); }
    if (edge[e.code] && !e.repeat) { pressed.add(edge[e.code]); e.preventDefault(); }
    if (e.code === 'Enter') pressed.add('interact');
  });
  window.addEventListener('keyup', (e) => {
    if (map[e.code]) held.delete(map[e.code]);
  });
  window.addEventListener('blur', () => held.clear());

  return {
    get up() { return held.has('up'); },
    get down() { return held.has('down'); },
    get left() { return held.has('left'); },
    get right() { return held.has('right'); },
    get sprint() { return held.has('sprint'); },
    get interact() { const v = pressed.has('interact'); pressed.delete('interact'); return v; },
    get attack() { const v = pressed.has('attack'); pressed.delete('attack'); return v; },
    get pause() { const v = pressed.has('pause'); pressed.delete('pause'); return v; },
    get confirm() { const v = pressed.has('confirm'); pressed.delete('confirm'); return v; },
    poke(name) { pressed.add(name); },
  };
}
