// Coral Bay Heat — keyboard handling. Direction and sprint keys report
// held state; the verbs (use a car, throw a punch, pause, confirm) are
// edge-triggered: one key press is consumed exactly once, so holding E
// never strobes the player in and out of a car.

export function wireKeyboard() {
  const held = new Set();
  const tapped = new Set();
  const holdMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
  };
  const tapMap = { KeyE: 'use', KeyF: 'hit', Space: 'hit', Escape: 'pause', KeyP: 'pause', Enter: 'confirm' };

  window.addEventListener('keydown', (event) => {
    if (holdMap[event.code]) {
      held.add(holdMap[event.code]);
      event.preventDefault();
    }
    if (tapMap[event.code] && !event.repeat) {
      tapped.add(tapMap[event.code]);
      event.preventDefault();
    }
    if (event.code === 'Enter') tapped.add('use');
  });
  window.addEventListener('keyup', (event) => {
    if (holdMap[event.code]) held.delete(holdMap[event.code]);
  });
  window.addEventListener('blur', () => held.clear());

  function consume(name) {
    const had = tapped.has(name);
    tapped.delete(name);
    return had;
  }

  return {
    get up() { return held.has('up'); },
    get down() { return held.has('down'); },
    get left() { return held.has('left'); },
    get right() { return held.has('right'); },
    get sprint() { return held.has('sprint'); },
    get use() { return consume('use'); },
    get hit() { return consume('hit'); },
    get pause() { return consume('pause'); },
    get confirm() { return consume('confirm'); },
  };
}
