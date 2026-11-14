// Fabrique les planches de sprites (PNG + JSON) des personnages personnalisés et
// les vérifie image par image.
//
//   node --experimental-strip-types scripts/fighters/bake-sprites.ts
//
// Sorties : public/fighters/sheets/<clé>.png et lib/fighters/sheets/<clé>.json.
// Le script échoue (code 1) si une vérification ne passe pas.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Canvas, blit, encodePNG, groundTo, hex, rotate, solve } from "./sprite-kit.ts";
import { ANCHOR, CELL_H, CELL_W, REQUIRED_ANIMS, type Colors, type SpriteChar } from "./rig.ts";
import { CRAIG_SPRITES } from "./chars/craig.ts";
import { MELRICK_SPRITES } from "./chars/melrick.ts";
import { ROSTER_SPRITES } from "./chars/roster.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHARS: SpriteChar[] = [CRAIG_SPRITES, MELRICK_SPRITES, ...ROSTER_SPRITES];
const COLS = 8;

interface FrameInfo { bbox: [number, number, number, number] }

function renderFrame(ch: SpriteChar, pose: SpriteChar["anims"][string]["poses"][number]) {
  const names = Object.keys(ch.palette);
  const cv = new Canvas(CELL_W, CELL_H, names.map((n) => hex(ch.palette[n])));
  const C: Colors = Object.fromEntries(names.map((n, i) => [n, i + 1]));
  const j = solve(ch.body, pose, ANCHOR);
  ch.draw(cv, j, pose, C);
  let out = cv;
  if (pose.rot) {
    // Rotation autour du bassin, puis on repose le point le plus bas au sol.
    out = rotate(cv, pose.rot, [j.hip[0], j.hip[1]]);
  }
  return groundTo(out, ANCHOR[1]);
}

function bbox(cv: Canvas): [number, number, number, number] {
  let x0 = cv.w, y0 = cv.h, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.px[y * cv.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}

function bake(ch: SpriteChar) {
  const errors: string[] = [];
  const frames: Canvas[] = [], info: FrameInfo[] = [], seen = new Map<string, number>();
  const anims: Record<string, { frames: number[]; dur?: number[]; phases?: string[]; loop?: boolean }> = {};

  for (const req of REQUIRED_ANIMS) if (!ch.anims[req]) errors.push(`animation manquante : ${req}`);

  for (const [name, a] of Object.entries(ch.anims)) {
    const idx: number[] = [];
    a.poses.forEach((pose) => {
      const cv = renderFrame(ch, pose);
      const key = Buffer.from(cv.px).toString("base64");
      let i = seen.get(key);
      if (i === undefined) { i = frames.length; frames.push(cv); info.push({ bbox: bbox(cv) }); seen.set(key, i); }
      idx.push(i);
    });
    if (a.dur && a.dur.length !== a.poses.length) errors.push(`${name} : durées (${a.dur.length}) ≠ images (${a.poses.length})`);
    if (a.phases && a.phases.length !== a.poses.length) errors.push(`${name} : phases (${a.phases.length}) ≠ images (${a.poses.length})`);
    anims[name] = { frames: idx, ...(a.dur ? { dur: a.dur } : {}), ...(a.phases ? { phases: a.phases } : {}), ...(a.loop ? { loop: true } : {}) };
  }

  // ─── Vérifications image par image ───
  const report: string[] = [];
  frames.forEach((cv, i) => {
    const [x0, y0, x1, y1] = info[i].bbox;
    if (x1 < 0) { errors.push(`image ${i} vide`); return; }
    // Pieds alignés : le pixel le plus bas est sur la ligne de sol de l'ancrage.
    if (y1 !== ANCHOR[1]) errors.push(`image ${i} : pieds à y=${y1}, attendu ${ANCHOR[1]}`);
    // Aucun pixel ne touche le bord de la cellule (pas de découpe).
    if (x0 < 1 || y0 < 1 || x1 > CELL_W - 2) errors.push(`image ${i} : touche le bord de la cellule (${x0},${y0},${x1})`);
    // Transparence franche (pixel art) : palette opaque uniquement.
    for (let k = 1; k < cv.pal.length; k++) if (cv.pal[k][3] !== 255) errors.push(`couleur ${k} semi-transparente`);
  });
  // Identité : couleurs signature présentes dans chaque image debout.
  const sig = Object.keys(ch.palette).filter((n) => ["skin", "hair"].includes(n));
  for (const [name, a] of Object.entries(anims)) {
    if (["down", "ko", "dodge", "fall", "getup"].includes(name)) continue;
    for (const fi of a.frames) {
      const cv = frames[fi];
      for (const n of sig) {
        const c = Object.keys(ch.palette).indexOf(n) + 1;
        if (!cv.px.includes(c)) errors.push(`${name} image ${fi} : couleur ${n} absente (tête manquante ?)`);
      }
    }
    // Continuité : pas de saut de position ou de taille entre deux images d'une boucle.
    if (a.loop && a.frames.length > 1) {
      for (let k = 0; k < a.frames.length; k++) {
        const A = info[a.frames[k]].bbox, B = info[a.frames[(k + 1) % a.frames.length]].bbox;
        const dh = Math.abs((A[3] - A[1]) - (B[3] - B[1])), dc = Math.abs((A[0] + A[2]) / 2 - (B[0] + B[2]) / 2);
        if (dh > 6 || dc > 8) errors.push(`${name} : saut entre images ${k} et ${k + 1} (hauteur ${dh}, centre ${dc})`);
      }
    }
  }
  // Portée réelle de chaque coup (pixel le plus en avant de l'image active), pour
  // caler les zones d'attaque du moteur sur le dessin.
  const reach: Record<string, number> = {};
  for (const [name, a] of Object.entries(anims)) {
    if (!a.phases) continue;
    const act = a.frames.filter((_, k) => a.phases![k] === "a");
    if (act.length) reach[name] = Math.max(...act.map((fi) => info[fi].bbox[2])) - ANCHOR[0];
  }
  const stand = info[anims.idle.frames[0]].bbox, crouch = info[anims.crouch.frames[anims.crouch.frames.length - 1]].bbox;
  const size = { h: stand[3] - stand[1] + 1, crouchH: crouch[3] - crouch[1] + 1, w: stand[2] - stand[0] + 1 };
  report.push(`${ch.key} : ${frames.length} images uniques, ${Object.keys(anims).length} animations, debout ${size.h} px, accroupi ${size.crouchH} px`);

  // ─── Planche ───
  const rows = Math.ceil(frames.length / COLS);
  const sw = COLS * CELL_W, sh = rows * CELL_H;
  const rgba = new Uint8Array(sw * sh * 4);
  frames.forEach((cv, i) => blit(rgba, sw, cv, (i % COLS) * CELL_W, Math.floor(i / COLS) * CELL_H));
  const png = encodePNG(sw, sh, rgba);
  const pngPath = join(ROOT, "public/fighters/sheets", `${ch.key}.png`);
  const jsonPath = join(ROOT, "lib/fighters/sheets", `${ch.key}.json`);
  mkdirSync(dirname(pngPath), { recursive: true }); mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(pngPath, png);
  writeFileSync(jsonPath, JSON.stringify({
    key: ch.key, name: ch.name, reference: ch.reference, image: `/fighters/sheets/${ch.key}.png`,
    cell: [CELL_W, CELL_H], anchor: ANCHOR, cols: COLS, count: frames.length, size, reach,
    bbox: info.map((f) => f.bbox), anims,
  }) + "\n");
  return { errors, report };
}

const rosterSheets: Record<string, unknown> = {};
let failed = false;
for (const ch of CHARS) {
  const { errors, report } = bake(ch);
  if (ch.key.startsWith("m") && ch.key !== "melrick") {
    rosterSheets[ch.key] = JSON.parse(readFileSync(join(ROOT, "lib/fighters/sheets", `${ch.key}.json`), "utf8"));
  }
  for (const r of report) console.log(r);
  if (errors.length) { failed = true; for (const e of errors) console.error(`  ✗ ${ch.key} : ${e}`); }
  else console.log(`  ✓ ${ch.key} : toutes les vérifications passent`);
}
writeFileSync(join(ROOT, "lib/fighters/sheets/roster.json"), JSON.stringify(rosterSheets) + "\n");
process.exit(failed ? 1 : 0);
