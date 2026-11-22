// Midnight Vault — tuning and floor plan.
// One screen, one museum floor: the thief enters bottom-left, crosses the
// gallery, cracks the vault top-right and slips out the exit bottom-right.
// Everything the other modules need lives here so the layout can be read
// at a glance: walls, vents, loot, guard patrols and cameras.

export const VIEW_W = 960;
export const VIEW_H = 600;
export const HUD_H = 46;

export const PALETTE = {
  floor: '#1c2436',
  floorAlt: '#202a40',
  carpet: '#5a2e3d',
  wall: '#3d4a63',
  wallTop: '#55648a',
  door: '#8a6d3b',
  vent: '#2c3e50',
  gold: '#f2c14e',
  jade: '#4ec98a',
  sapphire: '#5aa9e6',
  thief: '#e8e4d8',
  thiefCoat: '#23232e',
  guard: '#7fa6c9',
  guardAlert: '#e4572e',
  cone: 'rgba(242, 193, 78, 0.20)',
  coneSeen: 'rgba(228, 87, 46, 0.30)',
  camCone: 'rgba(228, 87, 46, 0.16)',
  text: '#e8e4d8',
  dim: '#9aa5bd',
  alarm: '#e4572e',
  ok: '#4ec98a',
};

export const PLAYER = {
  radius: 11,
  walkSpeed: 165, // px per second
  sneakSpeed: 95,
  ventSpeed: 80,
  grabRange: 30,
  lockpickSeconds: 1.4,
};

export const ALARM = {
  guardPerSecond: 30, // while a guard sees the thief
  cameraPerSecond: 22, // while a camera sees the thief
  decayPerSecond: 7, // while unseen
  caughtAt: 100,
  smokeCost: 4, // using a smoke pellet adds this much alarm (the hiss)
  coinCost: 5, // tossing a coin adds this much alarm
};

export const TOOLS = {
  smoke: 2, // pellets that blind every cone nearby for a few seconds
  coin: 3, // noisemakers that pull the nearest guard away
  smokeSeconds: 3.2,
  coinLureSeconds: 4.5,
  coinLureRange: 280,
};

// Walls are axis-aligned rectangles {x, y, w, h}. The outer shell plus the
// partitions that make the gallery, the vault and the side corridor.
export const WALLS = [
  // outer shell
  { x: 0, y: HUD_H, w: 960, h: 14 },
  { x: 0, y: 586, w: 960, h: 14 },
  { x: 0, y: HUD_H, w: 14, h: 526 },
  { x: 946, y: HUD_H, w: 14, h: 526 },
  // gallery partition (vertical, door gap in the middle)
  { x: 330, y: HUD_H, w: 14, h: 190 },
  { x: 330, y: 330, w: 14, h: 256 },
  // vault walls (top-right room, door gap on its left wall)
  { x: 640, y: HUD_H, w: 14, h: 150 },
  { x: 640, y: 280, w: 14, h: 80 },
  { x: 640, y: HUD_H, w: 306, h: 14 },
  // vault inner plinth row (low cover, blocks sight, not movement? no: solid)
  { x: 700, y: 420, w: 120, h: 14 },
  // side corridor divider (bottom centre, gap at both ends)
  { x: 470, y: 470, w: 180, h: 14 },
  // display plinth blocks in the gallery
  { x: 150, y: 200, w: 60, h: 14 },
  { x: 430, y: 170, w: 14, h: 90 },
];

// The vault door: a gap in the vault's left wall that starts shut.
export const VAULT_DOOR = { x: 640, y: 210, w: 14, h: 70 };

// Vent shafts: while the thief stands in one, no cone can see them,
// but they move slowly and cannot grab loot from inside.
export const VENTS = [
  { x: 40, y: 120, w: 120, h: 34 },
  { x: 360, y: 520, w: 150, h: 34 },
  { x: 700, y: 500, w: 120, h: 34 },
];

// Loot: four gallery cases plus the Star Sapphire inside the vault.
export const LOOT = [
  { id: 'idol', name: 'Gold Idol', value: 300, x: 180, y: 207, color: PALETTE.gold },
  { id: 'mask', name: 'Jade Mask', value: 250, x: 437, y: 130, color: PALETTE.jade },
  { id: 'pearls', name: 'Pearl Necklace', value: 200, x: 250, y: 470, color: '#e8e4d8' },
  { id: 'coins', name: 'Ancient Coins', value: 150, x: 560, y: 300, color: PALETTE.gold },
  { id: 'sapphire', name: 'Star Sapphire', value: 800, x: 850, y: 150, color: PALETTE.sapphire, vault: true },
];

export const EXIT = { x: 880, y: 520, w: 52, h: 52 };
export const START = { x: 80, y: 520 };

// Guards patrol waypoint loops; speed in px/s, cone range and half-angle.
export const GUARDS = [
  {
    name: 'Rook', waypoints: [[200, 120], [560, 120], [560, 380], [200, 380]],
    speed: 62, range: 175, halfAngle: 0.56,
  },
  {
    name: 'Bishop', waypoints: [[420, 480], [420, 260], [600, 260], [600, 480]],
    speed: 70, range: 165, halfAngle: 0.56,
  },
  {
    name: 'Knight', waypoints: [[760, 480], [760, 200], [900, 200], [900, 480]],
    speed: 58, range: 180, halfAngle: 0.6,
  },
  {
    name: 'Warden', waypoints: [[700, 130], [900, 130], [900, 320], [700, 320]],
    speed: 55, range: 170, halfAngle: 0.6,
  },
];

// Cameras sit on walls and sweep their cones back and forth.
export const CAMERAS = [
  { x: 344, y: 120, baseAngle: 0, sweep: 0.7, speed: 0.5, range: 210, halfAngle: 0.42 },
  { x: 654, y: 360, baseAngle: Math.PI / 2, sweep: 0.6, speed: 0.65, range: 200, halfAngle: 0.42 },
  { x: 946, y: 300, baseAngle: Math.PI, sweep: 0.55, speed: 0.45, range: 205, halfAngle: 0.42 },
];

export const SCORE = {
  timeBonusStart: 600, // seconds-free bonus that ticks down 5/s
  timeBonusPerSecond: 5,
  toolCost: 50, // score lost per tool used
  alarmPenaltyPerPoint: 2, // score lost per alarm point at escape
};
