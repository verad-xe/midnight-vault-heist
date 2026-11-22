// Midnight Vault — keyboard and mouse input. WASD or arrows move, Shift
// sneaks, E grabs loot and picks the vault lock, 1 throws a smoke pellet,
// 2 tosses a noisemaker coin, Enter starts, R restarts. Clicking the floor
// sets a walk waypoint so the game plays with the mouse too.

export function createInput() {
  return {
    left: false, right: false, up: false, down: false,
    sneak: false, interact: false,
    interactPressed: false, smokePressed: false, coinPressed: false,
    waypoint: null,
  };
}

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
};

export function attachInput(input, canvas, hooks) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && hooks.onEnter) hooks.onEnter();
    if (e.code === 'KeyR' && hooks.onRestart) hooks.onRestart();
    const field = KEYMAP[e.code];
    if (field) {
      if (field === 'interact' && !input.interact) input.interactPressed = true;
      input[field] = true;
      e.preventDefault();
    }
    if (e.code === 'Digit1' && !e.repeat) input.smokePressed = true;
    if (e.code === 'Digit2' && !e.repeat) input.coinPressed = true;
  });
  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.waypoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });
}

export function clearEdgeTriggers(input) {
  input.interactPressed = false;
  input.smokePressed = false;
  input.coinPressed = false;
}
