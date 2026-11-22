// Midnight Vault — entry point: the loop, the state machine and the
// screenshot hook. The game runs at a fixed 60 Hz step; the alarm beeps
// and the guard sting fire from the world as it changes.

import { VIEW_H, VIEW_W } from './config.js';
import { createWorld, endRun, resetWorld, updateWorld } from './world.js';
import { attachInput, clearEdgeTriggers, createInput } from './input.js';
import { createAudio, sfx } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot') || '';

const world = createWorld(seed);
const input = createInput();
const audio = createAudio();
// A handle for play-testing in the browser console.
window.__world = world;
let lastAlarm = 0;
let lastSpotted = false;

function startGame() {
  if (world.state !== 'title') return;
  resetWorld(world);
  world.state = 'playing';
  sfx.unlock(audio);
}

function restart() {
  resetWorld(world);
  if (shot) {
    applyShot(world, shot);
  } else {
    world.state = 'title';
  }
}

attachInput(input, canvas, {
  onEnter: startGame,
  onRestart: restart,
});

if (shot) applyShot(world, shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const wasSpotted = world.guards.some((g) => g.mode === 'chase');
  // A ?shot= scene is a staged tableau: render it as placed, without
  // simulating, so the alarm cannot trip and the guard cannot close in
  // while the screenshot is taken.
  if (world.state === 'playing' && !shot) {
    updateWorld(world, input, dt);
    world.waypointMark = input.waypoint;
    // Sound cues on change.
    if (wasSpotted && !lastSpotted) sfx.spotted(audio);
    if (world.alarm >= 60 && world.alarm - lastAlarm >= 10) {
      sfx.alarmBeep(audio);
      lastAlarm = world.alarm;
    }
    if (world.alarm < 60) lastAlarm = 0;
    if (world.state === 'caught') sfx.caught(audio);
    if (world.state === 'escaped') sfx.win(audio);
  }
  lastSpotted = wasSpotted;
  clearEdgeTriggers(input);
  render(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
