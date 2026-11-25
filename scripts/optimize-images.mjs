#!/usr/bin/env node
// Versions AVIF des images du dossier public, à plusieurs largeurs, sans toucher aux
// originaux (servis en secours aux rares navigateurs sans AVIF). Remplace l'optimiseur
// d'images de Vercel (quota mensuel limité). La miniature de 32 px existe aussi en WebP
// (fonds CSS, sans secours possible).
//   node scripts/optimize-images.mjs          génère ce qui manque
//   node scripts/optimize-images.mjs --check  échoue si une image n'a pas ses versions
// Sorties : public/_opt/img/<chemin>/<largeur>-<empreinte>.avif (+ 32-<empreinte>.webp), lib/image-variants.json.
// Exclus : le pixel art de Fighters (une compression avec perte abîmerait les pixels),
// les drapeaux et logos de rang (petits), le dossier _opt lui-même.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const PUBLIC = join(ROOT, "public");
const OUT = join(PUBLIC, "_opt", "img");
const MANIFEST = join(ROOT, "lib", "image-variants.json");
const MIN_BYTES = 30 * 1024;
const WIDTHS = [32, 320, 480, 640, 828, 1080, 1280, 1920];
const MAX_W = 2400;
const SKIP = [/^_opt\//, /^fighters\//, /^flags\//, /^ranks\//, /^sounds\//];
const CHECK = process.argv.includes("--check");

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

const manifest = {};
let made = 0, missing = 0, bytesIn = 0, bytesOut = 0;
for await (const file of walk(PUBLIC)) {
  const rel = relative(PUBLIC, file).split("\\").join("/");
  if (!/\.(png|jpe?g)$/i.test(rel) || SKIP.some((r) => r.test(rel))) continue;
  const size = (await stat(file)).size;
  if (size < MIN_BYTES) continue;
  const buf = await readFile(file);
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 10);
  const meta = await sharp(buf).metadata();
  const ow = meta.width ?? 0, oh = meta.height ?? 0;
  const cap = Math.min(ow, MAX_W);
  const widths = [...new Set([...WIDTHS.filter((w) => w < cap), cap])];
  const base = rel.slice(0, -extname(rel).length).replace(/[^a-zA-Z0-9/_-]+/g, "-");
  const out = [];
  for (const w of widths) {
    const avif = join(OUT, base, `${w}-${hash}.avif`);
    const webp = w === 32 ? join(OUT, base, `${w}-${hash}.webp`) : null;
    // Marqueur : la version AVIF n'était pas nettement plus légère que l'original (JPEG
    // déjà bien compressé) ; à cette largeur, c'est l'original qui est servi.
    const keep = join(OUT, base, `${w}-${hash}.original`);
    const url = "/" + relative(PUBLIC, avif).split("\\").join("/");
    if (await stat(keep).then(() => true, () => false)) continue;
    const have = await Promise.all([avif, webp].map((f) => (f ? stat(f).then(() => true, () => false) : true)));
    if (have[0] && have[1]) { out.push(w); continue; }
    if (CHECK) { missing++; console.error(`manquant : ${url}`); continue; }
    await mkdir(dirname(avif), { recursive: true });
    const img = () => sharp(buf).resize({ width: w, withoutEnlargement: true });
    // Qualités choisies à la mesure (SSIM au moins 0,98 sur les illustrations).
    const a = await img().avif({ quality: w === cap ? 62 : 55, effort: 4 }).toBuffer();
    if (a.length >= size * 0.92) { await writeFile(keep, ""); continue; }
    await writeFile(avif, a);
    if (webp) await writeFile(webp, await img().webp({ quality: 80 }).toBuffer());
    out.push(w); made++; bytesOut += a.length;
  }
  bytesIn += size;
  // full : largeur au-delà de laquelle l'original est servi tel quel.
  if (out.length) manifest["/" + rel] = { w: out, h: hash, ow, oh, dir: "/_opt/img/" + base, ...(out[out.length - 1] < cap ? { full: true } : {}) };
}

if (CHECK) {
  const current = JSON.parse(await readFile(MANIFEST, "utf8").catch(() => "{}"));
  const stale = Object.keys(manifest).filter((k) => JSON.stringify(current[k]) !== JSON.stringify(manifest[k]));
  if (missing || stale.length) { console.error(`${missing} versions manquantes, ${stale.length} entrées périmées : lance node scripts/optimize-images.mjs`); process.exit(1); }
  console.log(`${Object.keys(manifest).length} images : versions à jour.`);
} else {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`${Object.keys(manifest).length} images, ${made} versions créées (${(bytesOut / 1048576).toFixed(1)} Mo) ; originaux concernés : ${(bytesIn / 1048576).toFixed(1)} Mo.`);
}
