// Midnight Vault — the world: walls, loot, guards, cameras, vents and the
// rules that move them. Rendering lives in render.js; this file only
// decides what is where and who can see whom.

import {
  ALARM, CAMERAS, EXIT, GUARDS, LOOT, PLAYER, START, TOOLS, VAULT_DOOR,
  VENTS, VIEW_H, VIEW_W, WALLS,
} from './config.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Does segment (x1,y1)-(x2,y2) cross rectangle r? Used for line of sight.
function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (d === 0) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createWorld(seed) {
  return {
    seed,
    time: 0,
    state: 'title', // title | playing | caught | escaped
    caughtReason: '',
    alarm: 0,
    score: 0,
    lootTaken: 0,
    lootValue: 0,
    tools: { smoke: TOOLS.smoke, coin: TOOLS.coin },
    smokeUntil: 0,
    smokeAt: null,
    coinAt: null,
    coinUntil: 0,
    vaultOpen: false,
    lockpick: 0, // 0..1 progress on the vault door
    thief: { x: START.x, y: START.y, dir: -Math.PI / 2, moving: false, sneaking: false, inVent: false },
    guards: GUARDS.map((g, i) => ({
      name: g.name,
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      wp: 1,
      speed: g.speed,
      range: g.range,
      halfAngle: g.halfAngle,
      dir: angleTo(g.waypoints[0][0], g.waypoints[0][1], g.waypoints[1][0], g.waypoints[1][1]),
      mode: 'patrol', // patrol | chase | lure | return
      seenAt: -99,
      lureX: 0,
      lureY: 0,
      index: i,
    })),
    cameras: CAMERAS.map((c) => ({ ...c, phase: 0 })),
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    walls: WALLS.slice(),
    escape: null, // score breakdown once escaped
  };
}

export function thiefInVent(world) {
  const t = world.thief;
  return VENTS.some((v) => pointInRect(t.x, t.y, v));
}

function wallsForSight(world) {
  // A shut vault door blocks sight like a wall; an open one does not.
  if (world.vaultOpen) return world.walls;
  return world.walls.concat([VAULT_DOOR]);
}

function moveCircle(world, e, dx, dy) {
  // Axis-separated so the thief slides along walls instead of sticking.
  const r = PLAYER.radius;
  const tryMove = (nx, ny) => {
    const box = { x: nx - r, y: ny - r, w: r * 2, h: r * 2 };
    for (const w of wallsForSight(world)) {
      if (rectsOverlap(box, w)) return false;
    }
    if (nx < 14 + r || nx > VIEW_W - 14 - r || ny < 60 + r || ny > VIEW_H - 14 - r) return false;
    e.x = nx;
    e.y = ny;
    return true;
  };
  if (!tryMove(e.x + dx, e.y)) tryMove(e.x, e.y + dy);
  else tryMove(e.x, e.y + dy);
}

export function updateWorld(world, input, dt) {
  if (world.state !== 'playing') return;
  world.time += dt;
  const t = world.thief;

  // --- movement (keyboard, or a mouse waypoint) ---
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && input.waypoint) {
    const dx = input.waypoint.x - t.x;
    const dy = input.waypoint.y - t.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      mx = dx / d;
      my = dy / d;
    } else {
      input.waypoint = null;
    }
  }
  const inVent = thiefInVent(world);
  t.inVent = inVent;
  t.sneaking = !!input.sneak;
  const speed = inVent ? PLAYER.ventSpeed : input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    moveCircle(world, t, (mx / len) * speed * dt, (my / len) * speed * dt);
    t.dir = Math.atan2(my / len, mx / len);
    t.moving = true;
  } else {
    t.moving = false;
  }

  // --- vault door lockpick (hold E beside the shut door) ---
  const nearDoor = !world.vaultOpen
    && Math.abs(t.x - (VAULT_DOOR.x + 7)) < 46
    && t.y > VAULT_DOOR.y - 20 && t.y < VAULT_DOOR.y + VAULT_DOOR.h + 20;
  if (nearDoor && input.interact) {
    world.lockpick += dt / PLAYER.lockpickSeconds;
    if (world.lockpick >= 1) {
      world.vaultOpen = true;
      world.lockpick = 0;
    }
  } else {
    world.lockpick = Math.max(0, world.lockpick - dt * 2);
  }

  // --- grab loot (E beside a case) ---
  if (input.interactPressed) {
    for (const l of world.loot) {
      if (!l.taken && Math.hypot(l.x - t.x, l.y - t.y) < PLAYER.grabRange + 14 && !inVent) {
        l.taken = true;
        world.lootTaken += 1;
        world.lootValue += l.value;
        world.score += l.value;
        break;
      }
    }
  }

  // --- tools ---
  if (input.smokePressed && world.tools.smoke > 0) {
    world.tools.smoke -= 1;
    world.score = Math.max(0, world.score - 50);
    world.alarm = Math.min(100, world.alarm + ALARM.smokeCost);
    world.smokeUntil = world.time + TOOLS.smokeSeconds;
    world.smokeAt = { x: t.x, y: t.y };
  }
  if (input.coinPressed && world.tools.coin > 0) {
    world.tools.coin -= 1;
    world.score = Math.max(0, world.score - 50);
    world.alarm = Math.min(100, world.alarm + ALARM.coinCost);
    world.coinAt = { x: t.x, y: t.y };
    world.coinUntil = world.time + TOOLS.coinLureSeconds;
  }
  const smoked = world.time < world.smokeUntil;

  // --- cameras sweep ---
  for (const c of world.cameras) {
    c.phase += dt * c.speed;
    c.angle = c.baseAngle + Math.sin(c.phase) * c.sweep;
  }

  // --- guards: patrol, chase what they see, follow a tossed coin ---
  const walls = wallsForSight(world);
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of world.guards) {
    if (world.coinAt && world.time < world.coinUntil
      && Math.hypot(g.x - world.coinAt.x, g.y - world.coinAt.y) < TOOLS.coinLureRange) {
      g.mode = 'lure';
      g.lureX = world.coinAt.x;
      g.lureY = world.coinAt.y;
    } else if (g.mode === 'lure' && world.time >= world.coinUntil) {
      g.mode = 'return';
    }

    const dist = Math.hypot(t.x - g.x, t.y - g.y);
    const inCone = dist < g.range
      && Math.abs(angleDiff(angleTo(g.x, g.y, t.x, t.y), g.dir)) < g.halfAngle
      && hasLineOfSight(g.x, g.y, t.x, t.y, walls);
    const visible = inCone && !inVent && !smoked;
    if (visible) {
      g.seenAt = world.time;
      if (g.mode !== 'lure') g.mode = 'chase';
      seenByGuard = true;
    } else if (g.mode === 'chase' && world.time - g.seenAt > 3) {
      g.mode = 'return';
    }

    let tx;
    let ty;
    let sp = g.speed;
    if (g.mode === 'chase') {
      tx = t.x;
      ty = t.y;
      sp = g.speed * 1.7;
    } else if (g.mode === 'lure') {
      tx = g.lureX;
      ty = g.lureY;
    } else if (g.mode === 'return') {
      const wp = GUARDS[g.index].waypoints[g.wp];
      tx = wp[0];
      ty = wp[1];
      if (Math.hypot(tx - g.x, ty - g.y) < 8) g.mode = 'patrol';
    } else {
      const wp = GUARDS[g.index].waypoints[g.wp];
      tx = wp[0];
      ty = wp[1];
      if (Math.hypot(tx - g.x, ty - g.y) < 8) {
        g.wp = (g.wp + 1) % GUARDS[g.index].waypoints.length;
      }
    }
    const dx = tx - g.x;
    const dy = ty - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      g.x += (dx / d) * sp * dt;
      g.y += (dy / d) * sp * dt;
      g.dir = Math.atan2(dy, dx);
    }

    // A guard that reaches the thief ends the run.
    if (Math.hypot(t.x - g.x, t.y - g.y) < 15) {
      endRun(world, 'caught', `Caught by ${g.name} — a guard closed in.`);
      return;
    }
  }

  // --- cameras ---
  for (const c of world.cameras) {
    const dist = Math.hypot(t.x - c.x, t.y - c.y);
    if (dist < c.range
      && Math.abs(angleDiff(angleTo(c.x, c.y, t.x, t.y), c.angle)) < c.halfAngle
      && hasLineOfSight(c.x, c.y, t.x, t.y, walls)
      && !inVent && !smoked) {
      seenByCamera = true;
    }
  }

  // --- alarm meter ---
  if (seenByGuard) world.alarm += ALARM.guardPerSecond * dt;
  if (seenByCamera) world.alarm += ALARM.cameraPerSecond * dt;
  if (!seenByGuard && !seenByCamera) world.alarm -= ALARM.decayPerSecond * dt;
  world.alarm = Math.max(0, Math.min(100, world.alarm));
  if (world.alarm >= ALARM.caughtAt) {
    endRun(world, 'caught', 'Alarm tripped — the vault locked down with you inside.');
    return;
  }

  // --- escape: the exit opens once the Star Sapphire is taken ---
  const sapphire = world.loot.find((l) => l.id === 'sapphire');
  if (sapphire.taken && pointInRect(t.x, t.y, EXIT)) {
    const timeBonus = Math.max(0, 600 - Math.floor(world.time) * 5);
    const penalty = Math.floor(world.alarm) * 2;
    world.score += timeBonus - penalty;
    world.escape = {
      loot: world.lootValue,
      timeBonus,
      alarmPenalty: penalty,
      total: world.score,
      seconds: Math.floor(world.time),
    };
    endRun(world, 'escaped', '');
  }
}

export function endRun(world, state, reason) {
  world.state = state;
  world.caughtReason = reason;
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
}
