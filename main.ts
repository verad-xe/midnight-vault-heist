// Midnight Vault — the hand-in program (Node 22, standard library only).
// The grader runs `node main.ts` with the repository read-only at /bot and
// a writable /output. This program copies the game and its screenshots
// into the output directory and writes dossier.json, the summary the judge
// reads, using the kit's vendored library. It must be deterministic: two
// runs over the same repository write byte-identical output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const src = join(repoRoot, name);
  if (!existsSync(src)) return;
  mkdirSync(join(outDir, name), { recursive: true });
  cpSync(src, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('game');
copyTree('screenshots');

// The scorer's own caps, as the kit documents them: at most 4 screenshots
// of 256 KiB, at most 993 game files totalling 48 MiB, paths under 1000
// bytes, and the dossier text capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
if (!dossier || dossier.length === 0) {
  throw new Error('buildDossier wrote nothing');
}
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Midnight Vault handed in: dossier.json (${dossier.length} bytes)`);
