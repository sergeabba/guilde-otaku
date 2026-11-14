// Lecture des planches de sprites (générées par scripts/fighters/bake-sprites.ts) :
// choix de l'image selon l'état du combattant, à la manière des « actions » MUGEN.
import { sheetFor, type SheetMeta } from "./characters";
import type { Fighter } from "./engine";

export interface LoadedSheet { meta: SheetMeta; img: HTMLImageElement; flash: HTMLCanvasElement | null; ready: boolean; failed: boolean }

const cache = new Map<string, LoadedSheet>();

/** Charge (une fois) la planche d'un personnage et sa version blanche pour l'éclat d'impact. */
export function loadSheet(meta: SheetMeta): LoadedSheet {
  const hit = cache.get(meta.key);
  if (hit) return hit;
  const img = new Image();
  const entry: LoadedSheet = { meta, img, flash: null, ready: false, failed: false };
  img.onload = () => {
    entry.ready = true;
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    if (x) { x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); entry.flash = c; }
  };
  img.onerror = () => { entry.failed = true; };
  img.src = meta.image;
  cache.set(meta.key, entry);
  return entry;
}

export function sheetOf(f: Fighter): LoadedSheet | null {
  const meta = sheetFor(f.char);
  return meta ? loadSheet(meta) : null;
}

type A = SheetMeta["anims"][string];

/** Image d'une animation minutée (durées), en boucle ou bloquée sur la dernière. */
export function animationFrame(a: A, t: number) {
  const dur = a.dur ?? a.frames.map(() => 8);
  const total = dur.reduce((n, d) => n + d, 0);
  let k = a.loop ? t % total : Math.min(t, total - 1);
  for (let i = 0; i < dur.length; i++) { if (k < dur[i]) return a.frames[i]; k -= dur[i]; }
  return a.frames[a.frames.length - 1];
}

/** Image d'un coup selon sa phase (démarrage, actif, récupération) et les données du coup. */
function phased(a: A, t: number, startup: number, active: number, recovery: number) {
  const ph = a.phases ?? a.frames.map(() => "a");
  const cur = t <= startup ? "s" : t <= startup + active ? "a" : "r";
  const idx = ph.map((p, i) => (p === cur ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return a.frames[cur === "s" ? 0 : a.frames.length - 1];
  const [from, len] = cur === "s" ? [0, startup] : cur === "a" ? [startup, active] : [startup + active, recovery];
  const k = Math.min(idx.length - 1, Math.floor(((t - from) / Math.max(1, len)) * idx.length));
  return a.frames[idx[k]];
}

/** Numéro d'image de la planche pour l'état courant du combattant. */
export function frameFor(f: Fighter, meta: SheetMeta, clock: number): number {
  const an = meta.anims;
  const air = f.y < -1;
  switch (f.state) {
    case "ready": return animationFrame(an.intro, f.t);
    case "idle": return animationFrame(an.idle, clock);
    case "walk": return animationFrame(an.walk, clock);
    case "guard": return Math.abs(f.vx) > 0.1 ? animationFrame(an.walkback, clock) : animationFrame(an.guard, 0);
    case "crouch": return animationFrame(an.crouch, f.t);
    case "cguard": return animationFrame(an.cguard, 0);
    case "jump": {
      const a = f.vx * f.facing > 0.5 ? an.jumpfwd : an.jump;
      return a.frames[f.vy < -3 ? 1 : f.vy < 2.5 ? 2 : 3];
    }
    case "attack": {
      const m = f.move!;
      const name = m.anim === "special" || m.projectile ? "special" : m.id === "super" ? "super" : m.anim;
      const a = an[name] ?? an.s_lp;
      return phased(a, f.t, m.startup, m.active, m.recovery);
    }
    case "hit": return air ? animationFrame(an.fall, f.t) : f.prev.down ? animationFrame(an.chit, f.t) : animationFrame(an.hit, f.t);
    case "thrown": return animationFrame(an.hit, f.t);
    case "block": return f.prev.down ? animationFrame(an.cblock, 0) : animationFrame(an.block, 0);
    case "down": return animationFrame(an.down, 0);
    case "getup": return animationFrame(an.getup, f.t);
    case "dizzy": return animationFrame(an.dizzy, clock);
    case "dodge": return animationFrame(an.dodge, f.t);
    case "ko": return air ? an.ko.frames[0] : an.ko.frames[an.ko.frames.length - 1];
    case "win": return animationFrame(an.win, clock);
  }
  return an.idle.frames[0];
}

/** Dessine l'image d'un combattant : pieds sur (x, y), miroir selon l'orientation. */
export function drawSprite(ctx: CanvasRenderingContext2D, s: LoadedSheet, frame: number, x: number, y: number, facing: 1 | -1, flash: boolean) {
  const { cell: [w, h], anchor: [ax, ay], cols } = s.meta;
  const sx = (frame % cols) * w, sy = Math.floor(frame / cols) * h;
  const src = flash && s.flash ? s.flash : s.img;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(src, sx, sy, w, h, -ax, -ay - 1, w, h);
  ctx.restore();
}
