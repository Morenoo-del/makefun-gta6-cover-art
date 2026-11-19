// Sunset Cover Studio — entry program (gta6-cover-art-01).
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-app.ts. Node 22, standard library only, no network.
// Deterministic: two runs write identical bytes.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The directory this file lives in: the repository root. */
const repoRoot = dirname(fileURLToPath(import.meta.url));

/** Where the entry goes: MAKEFUN_OUTPUT_DIR, or /output outside the grader. */
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

/** Copy a directory tree, replacing any previous copy. */
function copyTree(from: string, to: string): void {
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

function main(): void {
  for (const name of ['app', 'screenshots']) {
    if (!existsSync(join(repoRoot, name))) {
      throw new Error(`main.ts: ${name}/ is missing from the repository`);
    }
  }
  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`wrote entry to ${outDir}`);
}

main();
