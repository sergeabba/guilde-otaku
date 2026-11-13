// Rendu pixel art de l'arène, sur un canvas de 384 × 216 pixels logiques agrandi
// sans lissage. Tous les visuels sont originaux et générés ici (aucune image externe) :
// deux silhouettes « prototypes » articulées, teintées avec la couleur du membre,
// et un décor de dojo au crépuscule.
import { FLOOR, MOVES, SPECIAL, STAGE_H, STAGE_W, type Fighter, type MatchEvent, type MatchState } from "./engine";

type Vec = [number, number];
interface Pose { lean: number; armF: Vec; armB: Vec; legF: Vec; legB: Vec; head: number; lift?: number; rot?: number }

export type Archetype = "gi" | "manteau";
export interface Look { archetype: Archetype; main: string; skin: string; hair: string }

const INK = "#120e16";
const SKINS = ["#f1c29a", "#d9a173", "#b67a4f", "#8a5634", "#5e3a22"];

/** Silhouette prototype et couleurs d'un membre (couleur de fiche, choix de peau déterministe). */
export function lookFor(id: number, color: string): Look {
  const main = /^#[0-9a-f]{6}$/i.test(color) ? color : "#c9a84c";
  return { archetype: id % 2 === 0 ? "manteau" : "gi", main, skin: SKINS[(id * 7) % SKINS.length], hair: id % 3 === 0 ? "#e9e2cf" : "#1c1622" };
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// ─── Poses (angles en degrés : 0 = vers le bas, 90 = vers l'avant, 180 = vers le haut) ───
const STANCE: Pose = { lean: 6, armF: [60, 70], armB: [30, 80], legF: [18, -10], legB: [-14, -6], head: 0 };

function poseFor(f: Fighter, frame: number): Pose {
  const t = f.t;
  switch (f.state) {
    case "ready":
    case "idle": {
      const b = Math.floor(frame / 18) % 2;
      return { ...STANCE, armF: [60 + b * 4, 70], lift: b };
    }
    case "walk": {
      const c = Math.sin(t / 5) * 26;
      return { ...STANCE, legF: [c, -12 - Math.max(0, c) * 0.5], legB: [-c, -12 - Math.max(0, -c) * 0.5], lean: 9 };
    }
    case "guard":
      return { lean: -4, armF: [120, 140], armB: [110, 150], legF: [14, -8], legB: [-18, -6], head: -6 };
    case "jump":
      return { lean: 10, armF: [100, 60], armB: [70, 80], legF: [70, -110], legB: [40, -100], head: 0 };
    case "attack": {
      if (f.move === "punch") {
        const d = MOVES.punch, ext = t > d.startup && t <= d.startup + d.active + 2;
        return ext ? { lean: 14, armF: [92, 0], armB: [20, 90], legF: [30, -6], legB: [-24, 0], head: 4 } : { ...STANCE, armF: [70, 110] };
      }
      if (f.move === "kick") {
        const d = MOVES.kick, ext = t > d.startup && t <= d.startup + d.active + 3;
        const wind = t <= d.startup;
        return ext ? { lean: -18, armF: [40, 60], armB: [-30, 40], legF: [96, 0], legB: [-6, 0], head: -8 }
          : wind ? { lean: -6, armF: [50, 80], armB: [10, 60], legF: [50, -90], legB: [-8, 0], head: -2 } : { ...STANCE };
      }
      if (f.move === "airkick") return { lean: -14, armF: [60, 50], armB: [-20, 40], legF: [110, 0], legB: [40, -90], head: -6 };
      // spéciale : armes tendues, élan
      return t < SPECIAL.startup ? { lean: -10, armF: [40, 120], armB: [30, 130], legF: [24, -10], legB: [-26, 0], head: -4 }
        : { lean: 16, armF: [90, 0], armB: [86, 0], legF: [34, -8], legB: [-30, 0], head: 4 };
    }
    case "hit":
    case "block":
      return f.state === "block" ? { lean: -8, armF: [120, 140], armB: [110, 150], legF: [10, -6], legB: [-22, -4], head: -10 }
        : { lean: -24, armF: [-20, 30], armB: [-40, 20], legF: [10, -14], legB: [-20, 0], head: -18 };
    case "ko":
      return { lean: -90, armF: [-60, 10], armB: [-80, 0], legF: [-80, 0], legB: [-96, 10], head: -10, rot: f.y < -2 ? -40 : -90 };
    case "win": {
      const up = Math.floor(frame / 24) % 2;
      return { lean: 2, armF: [180 - up * 10, 0], armB: [10, 90], legF: [14, 0], legB: [-14, 0], head: 6, lift: up };
    }
  }
  return STANCE;
}

const DIM = { gi: { thigh: 12, shin: 12, torso: 17, up: 9, fore: 9, w: 6 }, manteau: { thigh: 13, shin: 12, torso: 18, up: 9, fore: 9, w: 6 } };

function dir(a: number): Vec { const r = (a * Math.PI) / 180; return [Math.sin(r), Math.cos(r)]; }
function add(p: Vec, v: Vec, l: number): Vec { return [p[0] + v[0] * l, p[1] + v[1] * l]; }

function limb(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, w: number, color: string) {
  ctx.fillStyle = color;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len * 2));
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n, y = a[1] + ((b[1] - a[1]) * i) / n;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
  }
}

/** Dessine un combattant. Coordonnées locales : x vers l'avant, y vers le bas, origine aux pieds. */
export function drawFighter(ctx: CanvasRenderingContext2D, f: Fighter, look: Look, frame: number, flash = false) {
  const p = poseFor(f, frame);
  const D = DIM[look.archetype];
  const hipLocal = (legA: Vec): Vec => { const k = add([0, 0], dir(legA[0]), D.thigh); return add(k, dir(legA[0] + legA[1]), D.shin); };
  const footF = hipLocal(p.legF), footB = hipLocal(p.legB);
  const hipH = Math.max(footF[1], footB[1], 18) - (p.lift ?? 0) * 0;
  const hip: Vec = [0, -hipH];
  const lean = dir(180 - p.lean);
  const neck: Vec = add(hip, [lean[0], lean[1]], D.torso);
  const shoulder: Vec = add(neck, [-lean[0], -lean[1]], 2);
  const knee = (a: Vec): Vec => add(hip, dir(a[0]), D.thigh);
  const foot = (a: Vec): Vec => add(knee(a), dir(a[0] + a[1]), D.shin);
  const elbow = (a: Vec): Vec => add(shoulder, dir(a[0]), D.up);
  const hand = (a: Vec): Vec => add(elbow(a), dir(a[0] + a[1]), D.fore);
  const headC: Vec = add(neck, dir(180 - p.lean - p.head), 6);

  ctx.save();
  const baseX = Math.round(f.x), baseY = Math.round(FLOOR + f.y);
  ctx.translate(baseX, baseY);
  if (f.facing < 0) ctx.scale(-1, 1);
  if (p.rot) { ctx.translate(0, -4); ctx.rotate((p.rot * Math.PI) / 180 * 0.5); }

  const main = look.main, mainD = shade(main, 0.62), skin = look.skin, skinD = shade(skin, 0.78);
  const cloth = look.archetype === "gi" ? "#efe8d8" : main;
  const clothD = look.archetype === "gi" ? "#c8bfae" : mainD;
  const pants = look.archetype === "gi" ? "#efe8d8" : "#2a2433";
  const pantsD = look.archetype === "gi" ? "#c8bfae" : "#1c1824";

  const parts: [Vec, Vec, number, string][] = [
    [hip, knee(p.legB), D.w, pantsD], [knee(p.legB), foot(p.legB), D.w - 1, pantsD],
    [shoulder, elbow(p.armB), D.w - 1, look.archetype === "gi" ? skinD : clothD], [elbow(p.armB), hand(p.armB), D.w - 2, skinD],
    [hip, neck, D.w + 4, cloth],
    [hip, knee(p.legF), D.w, pants], [knee(p.legF), foot(p.legF), D.w - 1, pants],
    [shoulder, elbow(p.armF), D.w - 1, look.archetype === "gi" ? skin : cloth], [elbow(p.armF), hand(p.armF), D.w - 2, skin],
  ];
  // Contour sombre (2 px) puis couleurs : rendu pixel art lisible à petite taille.
  for (const [a, b, w] of parts) limb(ctx, a, b, w + 2, INK);
  ctx.fillStyle = INK; ctx.fillRect(Math.round(headC[0] - 5), Math.round(headC[1] - 6), 11, 12);
  for (const [a, b, w, c] of parts) limb(ctx, a, b, w, flash ? "#ffffff" : c);

  // Manteau : pan arrière ; gi : ceinture à la couleur du membre.
  if (look.archetype === "manteau") {
    limb(ctx, hip, add(hip, dir(-14 - p.lean * 0.3), 13), 6, flash ? "#fff" : mainD);
  } else {
    // Ceinture : fine bande à la taille et nœud qui retombe.
    const belt = add(hip, lean, 3);
    ctx.fillStyle = flash ? "#fff" : main;
    ctx.fillRect(Math.round(belt[0] - 5), Math.round(belt[1] - 1), 10, 3);
    limb(ctx, belt, add(belt, dir(-20), 6), 2, main);
  }
  // Tête, cheveux, bandeau.
  ctx.fillStyle = flash ? "#fff" : skin; ctx.fillRect(Math.round(headC[0] - 4), Math.round(headC[1] - 5), 9, 10);
  ctx.fillStyle = look.hair;
  if (look.archetype === "manteau") {
    ctx.fillRect(Math.round(headC[0] - 5), Math.round(headC[1] - 7), 10, 4);
    for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(headC[0] - 6 + i * 3), Math.round(headC[1] - 9 - (i % 2)), 2, 3);
  } else {
    ctx.fillRect(Math.round(headC[0] - 5), Math.round(headC[1] - 6), 10, 3);
    ctx.fillStyle = main; ctx.fillRect(Math.round(headC[0] - 5), Math.round(headC[1] - 3), 10, 2);
    const tail = Math.floor(frame / 6) % 2;
    ctx.fillRect(Math.round(headC[0] - 9), Math.round(headC[1] - 3 + tail), 4, 1);
    ctx.fillRect(Math.round(headC[0] - 11), Math.round(headC[1] - 2 + tail), 3, 1);
  }
  ctx.fillStyle = INK; ctx.fillRect(Math.round(headC[0] + 2), Math.round(headC[1] - 1), 1, 2); // œil
  // Poings et pieds.
  ctx.fillStyle = flash ? "#fff" : skin;
  for (const h of [hand(p.armB), hand(p.armF)]) ctx.fillRect(Math.round(h[0] - 2), Math.round(h[1] - 2), 4, 4);
  ctx.fillStyle = INK;
  for (const ft of [foot(p.legB), foot(p.legF)]) ctx.fillRect(Math.round(ft[0] - 2), Math.round(ft[1] - 1), 6, 3);
  ctx.restore();

  // Ombre au sol.
  ctx.fillStyle = "rgba(10,6,14,0.35)";
  const sw = Math.max(10, 24 + f.y * 0.2);
  ctx.fillRect(Math.round(f.x - sw / 2), FLOOR + 1, Math.round(sw), 3);
}

// ─── Décor original : dojo de la Guilde au crépuscule ────────────────────────
export function paintStage(ctx: CanvasRenderingContext2D) {
  const sky = ["#2a1442", "#3d1a52", "#5b2259", "#83305b", "#b4475a", "#e2685a", "#f39a5c", "#fbc276"];
  const band = 112 / sky.length;
  sky.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, Math.round(i * band), STAGE_W, Math.ceil(band) + 1); });
  // Tramage entre les bandes (pixel art).
  for (let i = 1; i < sky.length; i++) {
    ctx.fillStyle = sky[i];
    const y = Math.round(i * band) - 1;
    for (let x = (i % 2); x < STAGE_W; x += 2) ctx.fillRect(x, y, 1, 1);
  }
  // Soleil.
  ctx.fillStyle = "#ffe3a0";
  for (let r = 18; r > 0; r--) { const w = Math.round(Math.sqrt(18 * 18 - r * r) * 2); ctx.fillRect(292 - w / 2, 92 - r, w, 1); }
  // Montagnes lointaines.
  ctx.fillStyle = "#4a1f55";
  for (let x = 0; x < STAGE_W; x++) { const h = 22 + Math.round(Math.sin(x / 23) * 8 + Math.sin(x / 9) * 3); ctx.fillRect(x, 112 - h, 1, h); }
  ctx.fillStyle = "#32173f";
  for (let x = 0; x < STAGE_W; x++) { const h = 12 + Math.round(Math.sin(x / 17 + 2) * 6); ctx.fillRect(x, 120 - h, 1, h); }
  // Mur du dojo : poutres et panneaux.
  ctx.fillStyle = "#3b2230"; ctx.fillRect(0, 112, STAGE_W, 50);
  ctx.fillStyle = "#4d2d3c";
  for (let x = 0; x < STAGE_W; x += 32) ctx.fillRect(x + 2, 116, 28, 40);
  ctx.fillStyle = "#24131d";
  for (let x = 0; x < STAGE_W; x += 32) ctx.fillRect(x, 112, 3, 50);
  ctx.fillRect(0, 112, STAGE_W, 4); ctx.fillRect(0, 158, STAGE_W, 4);
  // Lanternes.
  for (const lx of [48, 176, 304]) {
    ctx.fillStyle = "#24131d"; ctx.fillRect(lx + 4, 116, 1, 6);
    ctx.fillStyle = "#e85b3a"; ctx.fillRect(lx, 122, 9, 11);
    ctx.fillStyle = "#ffb15c"; ctx.fillRect(lx + 2, 124, 5, 7);
    ctx.fillStyle = "#24131d"; ctx.fillRect(lx, 122, 9, 1); ctx.fillRect(lx, 132, 9, 1);
  }
  // Bannière de la Guilde.
  ctx.fillStyle = "#c9a84c"; ctx.fillRect(150, 136, 84, 16);
  ctx.fillStyle = "#24131d"; ctx.fillRect(150, 136, 84, 1); ctx.fillRect(150, 151, 84, 1);
  ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#24131d";
  ctx.fillText("GUILDE OTAKU", 192, 147);
  // Public en silhouettes.
  ctx.fillStyle = "#1d1018";
  for (let x = 0; x < STAGE_W; x += 7) { const h = 4 + ((x * 13) % 5); ctx.fillRect(x, 162 - h, 6, h + 4); ctx.fillRect(x + 1, 158 - h - 4, 4, 4); }
  // Sol : parquet en perspective.
  const floor = ["#7a4a2c", "#6c4127", "#5f3922", "#53311d"];
  for (let y = 166; y < STAGE_H; y++) { ctx.fillStyle = floor[Math.floor((y - 166) / 6) % floor.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#43271a";
  for (let i = -12; i <= 12; i++) { for (let y = 166; y < STAGE_H; y += 2) { const x = STAGE_W / 2 + i * 16 * (1 + (y - 166) / 40); ctx.fillRect(Math.round(x), y, 1, 2); } }
  ctx.fillStyle = "#9a6a42"; ctx.fillRect(0, 166, STAGE_W, 1);
  // Cercle du tatami central.
  ctx.fillStyle = "rgba(201,168,76,0.35)";
  for (let x = 120; x < 264; x += 2) ctx.fillRect(x, FLOOR + 6, 1, 1);
}

// ─── Effets ──────────────────────────────────────────────────────────────────
interface Spark { x: number; y: number; t: number; heavy: boolean; blocked: boolean; color: string }

export class ArenaRenderer {
  private stage: HTMLCanvasElement;
  private sparks: Spark[] = [];
  private shake = 0;
  private flashUntil: [number, number] = [0, 0];
  constructor(private ctx: CanvasRenderingContext2D, private looks: () => [Look, Look], private reducedMotion: boolean) {
    this.stage = document.createElement("canvas");
    this.stage.width = STAGE_W; this.stage.height = STAGE_H;
    paintStage(this.stage.getContext("2d")!);
  }

  onEvents(events: MatchEvent[], s: MatchState) {
    for (const e of events) {
      if (e.type === "hit") {
        const attacker = s.fighters[e.side === 0 ? 1 : 0];
        this.sparks.push({ x: e.x, y: FLOOR + e.y, t: 0, heavy: e.heavy, blocked: e.blocked, color: this.looks()[attacker.side].main });
        if (!e.blocked) this.flashUntil[e.side] = s.frame + 3;
        if (e.heavy && !this.reducedMotion) this.shake = 6;
      }
      if (e.type === "ko" && !this.reducedMotion) this.shake = 10;
    }
  }

  private camX = 0;

  /**
   * Dessine l'arène. `viewW` (en pixels logiques) permet un cadrage plus serré sur
   * téléphone : une caméra suit alors le milieu des deux combattants.
   */
  draw(s: MatchState, viewW = STAGE_W) {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    const sx = this.shake > 0 ? ((this.shake % 2) * 2 - 1) * Math.ceil(this.shake / 4) : 0;
    if (this.shake > 0) this.shake -= 1;
    const mid = (s.fighters[0].x + s.fighters[1].x) / 2;
    const target = Math.min(STAGE_W - viewW, Math.max(0, mid - viewW / 2));
    this.camX = viewW >= STAGE_W ? 0 : this.camX + (target - this.camX) * (this.reducedMotion ? 1 : 0.18);
    c.save();
    c.translate(Math.round(sx - this.camX), 0);
    c.drawImage(this.stage, 0, 0);
    const looks = this.looks();
    // Le combattant qui attaque est dessiné devant.
    const order = [...s.fighters].sort((a, b) => (a.state === "attack" ? 1 : 0) - (b.state === "attack" ? 1 : 0));
    for (const f of order) drawFighter(c, f, looks[f.side], s.frame, s.frame <= this.flashUntil[f.side]);
    // Projectiles : orbe en pixels.
    for (const p of s.projectiles) {
      const col = looks[p.owner].main;
      const px = Math.round(p.x), py = Math.round(FLOOR + p.y);
      c.fillStyle = INK; c.fillRect(px - 6, py - 5, 12, 10);
      c.fillStyle = col; c.fillRect(px - 5, py - 4, 10, 8);
      c.fillStyle = "#fff6d8"; c.fillRect(px - 2, py - 2, 5, 4);
      c.fillStyle = col;
      const tr = Math.floor(s.frame / 3) % 2;
      c.fillRect(px - Math.sign(p.vx) * (9 + tr * 2), py - 1, 3, 2);
      c.fillRect(px - Math.sign(p.vx) * (14 + tr), py, 2, 1);
    }
    // Étincelles d'impact.
    this.sparks = this.sparks.filter((sp) => sp.t < (sp.heavy ? 14 : 10));
    for (const sp of this.sparks) {
      sp.t += 1;
      const r = sp.blocked ? 4 + sp.t / 2 : (sp.heavy ? 6 : 4) + sp.t;
      c.fillStyle = sp.blocked ? "#9fd3ff" : sp.t < 3 ? "#ffffff" : sp.color;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + (sp.heavy ? 0.4 : 0);
        c.fillRect(Math.round(sp.x + Math.cos(a) * r), Math.round(sp.y + Math.sin(a) * r), 2, 2);
      }
      if (sp.t < 4) { c.fillStyle = "#ffffff"; c.fillRect(Math.round(sp.x) - 2, Math.round(sp.y) - 2, 4, 4); }
    }
    c.restore();
  }
}
