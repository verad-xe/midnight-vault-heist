// Midnight Vault — screenshot scenes. A URL like
//   game/index.html?shot=play&seed=1
// drops the game into a fixed, readable moment so the maker's screenshots
// are real renders of the game's own code: the title over the floor, a
// mid-heist crossing, a high-alarm chase, and the getaway. Normal play
// ignores all of this and starts on the title screen.

export function applyShot(world, shot) {
  const t = world.thief;
  if (shot === 'start') {
    world.state = 'title';
    world.time = 0;
    return;
  }
  if (shot === 'play') {
    world.state = 'playing';
    world.time = 64;
    t.x = 470;
    t.y = 250;
    t.dir = 0.4;
    // One case already pocketed, one guard mid-patrol with its cone near.
    world.loot[2].taken = true;
    world.lootTaken = 1;
    world.lootValue = 200;
    world.score = 200;
    world.alarm = 32;
    world.guards[0].x = 420;
    world.guards[0].y = 170;
    world.guards[0].dir = 0.9;
    world.guards[1].x = 520;
    world.guards[1].y = 430;
    world.guards[1].dir = -1.4;
    world.guards[2].x = 830;
    world.guards[2].y = 300;
    world.guards[2].dir = 2.6;
    world.cameras[0].angle = 0.5;
    world.cameras[1].angle = 1.9;
    world.cameras[2].angle = 2.8;
    return;
  }
  if (shot === 'alarm') {
    world.state = 'playing';
    world.time = 142;
    t.x = 600;
    t.y = 240;
    t.dir = 0;
    world.vaultOpen = true;
    world.loot[0].taken = true;
    world.loot[1].taken = true;
    world.loot[3].taken = true;
    world.lootTaken = 3;
    world.lootValue = 700;
    world.score = 700;
    world.alarm = 82;
    world.tools.smoke = 1;
    // The Warden has spotted the thief and is closing in from across the vault.
    world.guards[3].x = 780;
    world.guards[3].y = 150;
    world.guards[3].dir = 2.65;
    world.guards[3].mode = 'chase';
    world.guards[3].seenAt = 142;
    world.guards[0].x = 300;
    world.guards[0].y = 150;
    world.guards[0].dir = 0.3;
    world.cameras[0].angle = 0.9;
    world.cameras[1].angle = 1.2;
    world.cameras[2].angle = 3.1;
    return;
  }
  if (shot === 'escape') {
    world.state = 'escaped';
    world.time = 98;
    t.x = 906;
    t.y = 546;
    t.dir = Math.PI / 2;
    world.vaultOpen = true;
    for (const l of world.loot) l.taken = true;
    world.lootTaken = 5;
    world.lootValue = 1700;
    world.alarm = 24;
    world.escape = { loot: 1700, timeBonus: 110, alarmPenalty: 48, total: 1762, seconds: 98 };
    world.score = 1762;
    return;
  }
}
