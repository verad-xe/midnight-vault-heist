// Midnight Vault — all drawing: the museum floor, vision cones, guards,
// cameras, loot, the thief and the HUD. Cones are raycast against the
// walls so sight stops at a wall, the way the game logic sees it.

import {
  EXIT, HUD_H, PALETTE, PLAYER, VAULT_DOOR, VENTS, VIEW_H, VIEW_W,
} from './config.js';
import { pointInRect } from './world.js';

function conePolygon(x, y, angle, halfAngle, range, walls) {
  const rays = 26;
  const pts = [[x, y]];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    let d = range;
    // March out in small steps; stop at the first wall.
    for (let s = 6; s <= range; s += 6) {
      const px = x + Math.cos(a) * s;
      const py = y + Math.sin(a) * s;
      if (walls.some((w) => pointInRect(px, py, w))) {
        d = s;
        break;
      }
    }
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

function drawCone(ctx, x, y, angle, halfAngle, range, walls, fill) {
  const pts = conePolygon(x, y, angle, halfAngle, range, walls);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWalls(ctx, world) {
  for (const w of world.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
  // Vault door: shut bars, or an open gap.
  if (!world.vaultOpen) {
    ctx.fillStyle = PALETTE.door;
    ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);
    ctx.fillStyle = '#5a4a28';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(VAULT_DOOR.x + 2, VAULT_DOOR.y + 6 + i * 16, VAULT_DOOR.w - 4, 3);
    }
  }
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = PALETTE.floorAlt;
  for (let x = 14; x < VIEW_W - 14; x += 48) {
    for (let y = HUD_H + 14; y < VIEW_H - 14; y += 48) {
      if (((x + y) / 48) % 2 === 0) ctx.fillRect(x, y, 48, 48);
    }
  }
  // Carpet runner down the gallery.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(60, HUD_H + 14, 900, 8);
  ctx.fillRect(60, 300, 900, 8);
  // Vent shafts.
  for (const v of VENTS) {
    ctx.fillStyle = PALETTE.vent;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#46586e';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(v.x + 6, v.y + (v.h * i) / 4);
      ctx.lineTo(v.x + v.w - 6, v.y + (v.h * i) / 4);
      ctx.stroke();
    }
  }
  // Exit door, bottom-right.
  ctx.fillStyle = worldExitOpen ? PALETTE.ok : '#3a6b4f';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);
}

// Set by render() before drawFloor runs.
let worldExitOpen = false;

function drawLoot(ctx, world) {
  for (const l of world.loot) {
    if (l.taken) continue;
    const pulse = 0.75 + 0.25 * Math.sin(world.time * 3 + l.x);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#101018';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l.id === 'sapphire' ? '◆' : '●', l.x, l.y + 4);
    ctx.restore();
    // Vault loot sits behind its plinth glow.
    if (l.vault) {
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, world) {
  const walls = world.walls.concat(world.vaultOpen ? [] : [VAULT_DOOR]);
  for (const g of world.guards) {
    const alerted = g.mode === 'chase';
    drawCone(ctx, g.x, g.y, g.dir, g.halfAngle, g.range, walls,
      alerted ? PALETTE.coneSeen : PALETTE.cone);
    // Body.
    ctx.fillStyle = alerted ? PALETTE.guardAlert : PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101018';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.dir) * 5, g.y + Math.sin(g.dir) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Direction tick.
    ctx.strokeStyle = '#101018';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16);
    ctx.stroke();
    // Alert mark.
    if (alerted) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 18);
    }
  }
}

function drawCameras(ctx, world) {
  const walls = world.walls.concat(world.vaultOpen ? [] : [VAULT_DOOR]);
  for (const c of world.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, c.halfAngle, c.range, walls, PALETTE.camCone);
    ctx.fillStyle = '#c9d2e4';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 4, c.y + Math.sin(c.angle) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, world) {
  const t = world.thief;
  // Smoke cloud around the thief while a pellet burns.
  if (world.time < world.smokeUntil && world.smokeAt) {
    ctx.fillStyle = 'rgba(200, 200, 210, 0.35)';
    ctx.beginPath();
    ctx.arc(world.smokeAt.x, world.smokeAt.y, 70, 0, Math.PI * 2);
    ctx.fill();
  }
  // Waypoint marker.
  // (input holds it; main.js passes it through world.waypointMark)
  if (world.waypointMark) {
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(world.waypointMark.x, world.waypointMark.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.thiefCoat;
  ctx.beginPath();
  ctx.arc(t.x, t.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, PLAYER.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = PALETTE.thiefCoat;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.dir) * 14, t.y + Math.sin(t.dir) * 14);
  ctx.stroke();
  // Lockpick progress ring.
  if (world.lockpick > 0 && !world.vaultOpen) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 20, -Math.PI / 2, -Math.PI / 2 + world.lockpick * Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#121826';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2a3350';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Row 1: alarm meter on the left, clock on the right.
  const ax = 16;
  const ay = 10;
  const aw = 220;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, ay + 10);
  ctx.fillStyle = '#0c0f18';
  roundRect(ctx, ax + 62, ay, aw, 18, 4);
  ctx.fill();
  const frac = world.alarm / 100;
  ctx.fillStyle = frac < 0.5 ? PALETTE.ok : frac < 0.8 ? PALETTE.gold : PALETTE.alarm;
  if (frac > 0) {
    roundRect(ctx, ax + 64, ay + 2, (aw - 4) * frac, 14, 3);
    ctx.fill();
  }
  ctx.strokeStyle = '#55648a';
  ctx.lineWidth = 1;
  roundRect(ctx, ax + 62, ay, aw, 18, 4);
  ctx.stroke();

  const mm = String(Math.floor(world.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(world.time % 60)).padStart(2, '0');
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`smoke ${world.tools.smoke} [1]   coin ${world.tools.coin} [2]`, 880, 24);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${mm}:${ss}`, 944, 24);

  // Row 2: objective centred, loot and tools on the right.
  const sapphire = world.loot.find((l) => l.id === 'sapphire');
  const objective = sapphire.taken ? 'Sapphire secured — reach the EXIT!' : 'Steal the Star Sapphire, then reach the EXIT';
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(objective, 480, 41);

  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${world.lootValue}  ·  ${world.lootTaken}/5`, 944, 41);
}

function overlay(ctx, rgba, lines, accent) {
  ctx.fillStyle = rgba;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  let start = 0;
  let y = 170;
  if (accent) {
    ctx.fillStyle = accent;
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText(lines[0].text, VIEW_W / 2, 150);
    start = 1;
    y = 210;
  }
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    ctx.fillStyle = line.color || PALETTE.text;
    ctx.font = line.font || '16px system-ui, sans-serif';
    ctx.fillText(line.text, VIEW_W / 2, y);
    y += line.gap || 34;
  }
}

export function render(ctx, world) {
  const sapphire = world.loot.find((l) => l.id === 'sapphire');
  worldExitOpen = !!sapphire.taken;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawLoot(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawThief(ctx, world);
  drawWalls(ctx, world);
  drawHud(ctx, world);

  if (world.state === 'title') {
    overlay(ctx, 'rgba(8, 10, 18, 0.78)', [
      { text: 'MIDNIGHT VAULT', font: 'bold 54px system-ui, sans-serif', color: PALETTE.gold, gap: 70 },
      { text: 'A one-screen stealth heist — cross the gallery, crack the vault, vanish.', gap: 30 },
      { text: 'Move: WASD / arrows (or click)  ·  Sneak: Shift  ·  Grab / pick lock: E', gap: 26 },
      { text: 'Smoke pellet [1]  ·  Noisemaker coin [2]  ·  Guards and cameras raise the ALARM', gap: 26 },
      { text: 'Grab the Star Sapphire, then reach the EXIT. If the alarm hits 100, you are caught.', gap: 40 },
      { text: 'Press ENTER to begin', font: 'bold 20px system-ui, sans-serif', color: PALETTE.gold },
    ]);
  } else if (world.state === 'caught') {
    overlay(ctx, 'rgba(60, 8, 8, 0.82)', [
      { text: 'CAUGHT!', font: 'bold 54px system-ui, sans-serif', color: '#ff6b4a', gap: 70 },
      { text: world.caughtReason, gap: 30 },
      { text: `Loot held: $${world.lootValue}  ·  Time: ${Math.floor(world.time)}s`, gap: 40 },
      { text: 'Press R to try again', font: 'bold 20px system-ui, sans-serif', color: PALETTE.text },
    ]);
  } else if (world.state === 'escaped') {
    const e = world.escape || { loot: 0, timeBonus: 0, alarmPenalty: 0, total: 0, seconds: 0 };
    overlay(ctx, 'rgba(8, 24, 14, 0.82)', [
      { text: 'CLEAN GETAWAY!', font: 'bold 50px system-ui, sans-serif', color: PALETTE.gold, gap: 66 },
      { text: `Loot  $${e.loot}      Time bonus  $${e.timeBonus}      Alarm penalty  -$${e.alarmPenalty}`, gap: 30 },
      { text: `Final score: $${e.total}   in ${e.seconds}s`, font: 'bold 22px system-ui, sans-serif', gap: 44 },
      { text: 'Press R to run it again', font: 'bold 18px system-ui, sans-serif', color: PALETTE.text },
    ]);
  }
}
