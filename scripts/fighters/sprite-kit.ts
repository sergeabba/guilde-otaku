// Outils de dessin pixel art pour les planches de sprites de Guilde Fighters.
// Exécuté par Node (node --experimental-strip-types), sans dépendance : tampon de
// pixels indexé, polygones sans anticrénelage, contour automatique, ombrage,
// encodeur PNG. Tout est dessiné par ce code : aucune image externe.
import { deflateSync } from "node:zlib";

export type RGBA = [number, number, number, number];
export type Vec = [number, number];

export function hex(h: string): RGBA {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/** Toile indexée : chaque pixel porte une couleur (index de palette) ou 0 (transparent). */
export class Canvas {
  w: number; h: number; px: Uint8Array; pal: RGBA[];
  constructor(w: number, h: number, pal: RGBA[]) {
    this.w = w; this.h = h; this.px = new Uint8Array(w * h); this.pal = [[0, 0, 0, 0], ...pal];
  }
  get(x: number, y: number) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.px[y * this.w + x]; }
  set(x: number, y: number, c: number) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
}

/** Masque binaire, pour dessiner une pièce puis son contour et son ombrage. */
export class Mask {
  w: number; h: number; m: Uint8Array;
  constructor(w: number, h: number) { this.w = w; this.h = h; this.m = new Uint8Array(w * h); }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1; }
  add(x: number, y: number) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = 1; }
  /** Remplit un polygone (règle pair-impair, centres de pixels). */
  poly(pts: Vec[]) {
    if (pts.length < 3) return this;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const cy = y + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy)) xs.push(a[0] + ((cy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.add(x, y);
    }
    return this;
  }
  /** Segment épais à bouts arrondis, largeur w0 au départ et w1 à l'arrivée. */
  limb(a: Vec, b: Vec, w0: number, w1 = w0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    this.poly([[a[0] + nx * w0 / 2, a[1] + ny * w0 / 2], [b[0] + nx * w1 / 2, b[1] + ny * w1 / 2], [b[0] - nx * w1 / 2, b[1] - ny * w1 / 2], [a[0] - nx * w0 / 2, a[1] - ny * w0 / 2]]);
    this.disc(a, w0 / 2); this.disc(b, w1 / 2);
    return this;
  }
  disc(c: Vec, r: number) {
    for (let y = Math.floor(c[1] - r); y <= Math.ceil(c[1] + r); y++) for (let x = Math.floor(c[0] - r); x <= Math.ceil(c[0] + r); x++) {
      if ((x + 0.5 - c[0]) ** 2 + (y + 0.5 - c[1]) ** 2 <= r * r + 0.25) this.add(x, y);
    }
    return this;
  }
  ellipse(c: Vec, rx: number, ry: number) {
    for (let y = Math.floor(c[1] - ry); y <= Math.ceil(c[1] + ry); y++) for (let x = Math.floor(c[0] - rx); x <= Math.ceil(c[0] + rx); x++) {
      if (((x + 0.5 - c[0]) / rx) ** 2 + ((y + 0.5 - c[1]) / ry) ** 2 <= 1) this.add(x, y);
    }
    return this;
  }
}

export interface Paint { base: number; shadow?: number; light?: number; outline?: number }

/**
 * Peint un masque sur la toile : contour d'un pixel autour (couleur d'encre), puis
 * remplissage, ombre sur le côté arrière et le bas, reflet sur le haut avant.
 * `fwd` = +1 si le personnage regarde vers la droite.
 */
export function paint(cv: Canvas, mask: Mask, p: Paint, ink: number, fwd = 1) {
  const o = p.outline ?? ink;
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) {
    if (mask.has(x, y)) continue;
    if (mask.has(x + 1, y) || mask.has(x - 1, y) || mask.has(x, y + 1) || mask.has(x, y - 1)) cv.set(x, y, o);
  }
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) {
    if (!mask.has(x, y)) continue;
    let c = p.base;
    if (p.shadow && (!mask.has(x - 2 * fwd, y) || !mask.has(x, y + 2))) c = p.shadow;
    if (p.light && !mask.has(x + fwd, y) && !mask.has(x, y - 1)) c = p.light;
    cv.set(x, y, c);
  }
}

/** Remplit sans contour (détails internes : broderies, plis, boutons). */
export function fill(cv: Canvas, mask: Mask, c: number) {
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.has(x, y)) cv.set(x, y, c);
}

/** Tampon pixel art : grille de caractères, chaque caractère renvoie un index (ou rien). */
export function stamp(cv: Canvas, grid: string[], key: Record<string, number>, x0: number, y0: number, mirror = false) {
  const w = Math.max(...grid.map((r) => r.length));
  grid.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = key[row[i]];
      if (c === undefined) continue;
      cv.set(mirror ? x0 + (w - 1 - i) : x0 + i, y0 + j, c);
    }
  });
}

/** Contour global : tout pixel transparent voisin du personnage devient encre (silhouette nette). */
export function outlineAll(cv: Canvas, ink: number) {
  const add: number[] = [];
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    if (cv.get(x, y)) continue;
    if (cv.get(x + 1, y) || cv.get(x - 1, y) || cv.get(x, y + 1) || cv.get(x, y - 1)) add.push(y * cv.w + x);
  }
  for (const i of add) cv.px[i] = ink;
}

/** Copie une cellule dans une planche (RGBA). */
export function blit(sheet: Uint8Array, sw: number, cv: Canvas, ox: number, oy: number) {
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    const c = cv.px[y * cv.w + x];
    if (!c) continue;
    const [r, g, b, a] = cv.pal[c];
    const i = ((oy + y) * sw + ox + x) * 4;
    sheet[i] = r; sheet[i + 1] = g; sheet[i + 2] = b; sheet[i + 3] = a;
  }
}

// ─── PNG (RGBA 8 bits, sans filtre) ─────────────────────────────────────────
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b: Uint8Array) { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
export function encodePNG(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 6;
  const raw = new Uint8Array((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0), png = new Uint8Array(total);
  let o = 0; for (const p of parts) { png.set(p, o); o += p.length; }
  return png;
}

// ─── Squelette ──────────────────────────────────────────────────────────────
// Angles en degrés : 0 = vers le bas, 90 = vers l'avant, 180 = vers le haut.
export const dir = (a: number): Vec => { const r = (a * Math.PI) / 180; return [Math.sin(r), Math.cos(r)]; };
export const add = (p: Vec, v: Vec, l = 1): Vec => [p[0] + v[0] * l, p[1] + v[1] * l];
export const lerp = (a: Vec, b: Vec, t: number): Vec => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export type HandShape = "fist" | "open" | "pocket" | "point" | "grab" | "chop";

/** Pose d'un personnage (une image). */
export interface Pose {
  /** Penché du buste (+ vers l'avant). */
  lean: number;
  /** Inclinaison de la tête par rapport au buste. */
  head?: number;
  /** [angle du bras, flexion du coude] avant / arrière. */
  armF: Vec; armB: Vec;
  /** [angle de la cuisse, flexion du genou] avant / arrière. */
  legF: Vec; legB: Vec;
  handF?: HandShape; handB?: HandShape;
  /** Décalage horizontal du bassin et hauteur imposée (en l'air). */
  dx?: number; air?: number;
  /** Rotation de tout le corps (chute, au sol). */
  rot?: number;
  face?: "normal" | "hurt" | "ko" | "shout";
  /** Mouvement des pans de vêtement (flottement), en pixels. */
  flow?: number;
}

export interface Body {
  head: number; neck: number; torso: number; thigh: number; shin: number; upper: number; fore: number;
  hipW: number; chestW: number; waistW: number; armW: number; legW: number; footL: number;
}

export interface Joints {
  hip: Vec; neck: Vec; headC: Vec; shoulderF: Vec; shoulderB: Vec;
  elbowF: Vec; handF: Vec; elbowB: Vec; handB: Vec;
  kneeF: Vec; footF: Vec; kneeB: Vec; footB: Vec;
  hipF: Vec; hipB: Vec; up: Vec; fwd: Vec;
}

/**
 * Calcule les articulations d'une pose. Au sol, le bassin est placé pour que le pied
 * le plus bas touche exactement la ligne de sol (y = groundY) : pieds alignés.
 */
export function solve(b: Body, p: Pose, anchor: Vec): Joints {
  const leg = (a: Vec, hip: Vec): [Vec, Vec] => { const k = add(hip, dir(a[0]), b.thigh); return [k, add(k, dir(a[0] + a[1]), b.shin)]; };
  const probeF = leg(p.legF, [0, 0])[1], probeB = leg(p.legB, [0, 0])[1];
  const drop = Math.max(probeF[1], probeB[1]);
  const hipY = anchor[1] - (p.air ?? 0) - drop - 1; // -1 : semelle
  const hip: Vec = [anchor[0] + (p.dx ?? 0), hipY];
  const up = dir(180 - p.lean);
  const fv: Vec = [-up[1], up[0]]; // perpendiculaire au buste, vers l'avant
  const neck = add(hip, up, b.torso);
  const headC = add(add(neck, dir(180 - p.lean - (p.head ?? 0)), b.neck + b.head / 2), [0, 0]);
  const shoulderF = add(add(neck, up, -2.5), fv, 3);
  const shoulderB = add(add(neck, up, -2.5), fv, -4);
  const arm = (a: Vec, s: Vec): [Vec, Vec] => { const e = add(s, dir(a[0]), b.upper); return [e, add(e, dir(a[0] + a[1]), b.fore)]; };
  const [elbowF, handF] = arm(p.armF, shoulderF);
  const [elbowB, handB] = arm(p.armB, shoulderB);
  const hipF = add(hip, fv, 2), hipB = add(hip, fv, -2);
  const [kneeF, footF] = leg(p.legF, hipF);
  const [kneeB, footB] = leg(p.legB, hipB);
  return { hip, neck, headC, shoulderF, shoulderB, elbowF, handF, elbowB, handB, kneeF, footF, kneeB, footB, hipF, hipB, up, fwd: fv };
}

/** Rotation d'une toile autour d'un point (pour les chutes) : plus proche voisin. */
export function rotate(cv: Canvas, deg: number, c: Vec): Canvas {
  const out = new Canvas(cv.w, cv.h, []); out.pal = cv.pal;
  const r = (-deg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    const dx = x + 0.5 - c[0], dy = y + 0.5 - c[1];
    const sx = Math.floor(c[0] + dx * cs - dy * sn), sy = Math.floor(c[1] + dx * sn + dy * cs);
    out.px[y * cv.w + x] = cv.get(sx, sy);
  }
  return out;
}

/** Décale le contenu pour que le pixel opaque le plus bas soit sur la ligne de sol. */
export function groundTo(cv: Canvas, groundY: number): Canvas {
  let low = -1;
  for (let y = cv.h - 1; y >= 0 && low < 0; y--) for (let x = 0; x < cv.w; x++) if (cv.px[y * cv.w + x]) { low = y; break; }
  if (low < 0 || low === groundY) return cv;
  const d = groundY - low, out = new Canvas(cv.w, cv.h, []); out.pal = cv.pal;
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) out.set(x, y + d, cv.px[y * cv.w + x]);
  return out;
}
