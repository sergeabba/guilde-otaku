// Moteur de combat Guilde Fighters (v3).
// Logique pure, à pas fixe (60 pas par seconde), déterministe, sans DOM.
// Inspiré des principes de MUGEN : données par personnage (coups, zones d'attaque,
// commandes), états, tampon de commandes directionnelles. Aucun fichier MUGEN repris.
import { characterFor, type CharacterDef, type MoveDef, type NormalId, type SpecialDef, type ProjectileDef, type Motion } from "./characters";

export const STAGE_W = 384;
export const STAGE_H = 216;
export const FLOOR = 188;
export const FPS = 60;
export const ROUND_FRAMES = 60 * FPS;
export const MAX_HP = 1000;
export const MAX_METER = 100;

const WALL = 18;
const GRAVITY = 0.5;
const BUFFER = 18; // images pendant lesquelles une direction reste dans le tampon

export interface Input {
  left: boolean; right: boolean; up: boolean; down: boolean;
  lp: boolean; hp: boolean; lk: boolean; hk: boolean;
  /** Raccourcis (tactile, accessibilité) : spéciale, super, esquive. */
  special: boolean; super: boolean; dodge: boolean;
}
export const NO_INPUT: Input = { left: false, right: false, up: false, down: false, lp: false, hp: false, lk: false, hk: false, special: false, super: false, dodge: false };

export interface FighterStats { force: number; vitesse: number; technique: number }
export interface FighterProfile { id: number; name: string; stats: FighterStats; specialName: string }

export type FighterState =
  | "ready" | "idle" | "walk" | "crouch" | "jump" | "attack" | "guard" | "cguard"
  | "hit" | "block" | "down" | "getup" | "dizzy" | "dodge" | "thrown" | "ko" | "win";

export interface Fighter {
  profile: FighterProfile;
  char: CharacterDef;
  side: 0 | 1;
  x: number; y: number; vx: number; vy: number;
  facing: 1 | -1;
  hp: number;
  meter: number;
  state: FighterState;
  move: MoveDef | null;
  moveName: string | null;
  t: number;
  hitDone: boolean;
  /** Le coup en cours a touché (autorise les annulations). */
  connected: boolean;
  stun: number;
  /** Coups reçus pendant l'enchaînement en cours. */
  comboTaken: number;
  /** Plus grand combo réalisé. */
  bestCombo: number;
  reviveUsed: boolean;
  invuln: number;
  /** Chute au sol prévue à l'atterrissage. */
  kd: boolean;
  /** Projection subie : camp qui projette et sens (arrière ou avant). */
  thrownBy: 0 | 1 | null;
  backThrow: boolean;
  dirs: { d: number; f: number }[];
  /** Tampon d'appuis : image du dernier appui de chaque bouton (MUGEN : « buffer »). */
  press: Partial<Record<Btn, number>>;
  prev: Input;
}

type Btn = "lp" | "hp" | "lk" | "hk" | "special" | "super" | "dodge";
const BTNS: Btn[] = ["lp", "hp", "lk", "hk", "special", "super", "dodge"];
const PRESS_WINDOW = 8;

export interface Projectile { owner: 0 | 1; x: number; y: number; vx: number; def: ProjectileDef; ttl: number }

export type MatchEvent =
  | { type: "roundStart"; round: number }
  | { type: "fight" }
  | { type: "hit"; side: 0 | 1; x: number; y: number; blocked: boolean; heavy: boolean; dmg: number; combo: number }
  | { type: "special"; side: 0 | 1; name: string; super: boolean }
  | { type: "throw"; side: 0 | 1 }
  | { type: "dodge"; side: 0 | 1 }
  | { type: "dizzy"; side: 0 | 1 }
  | { type: "revive"; side: 0 | 1; name: string }
  | { type: "ko"; side: 0 | 1 }
  | { type: "timeOver" }
  | { type: "next"; side: 0 | 1; name: string }
  | { type: "matchEnd"; winner: 0 | 1 | null };

export type Phase = "intro" | "fight" | "roundEnd" | "matchEnd";

export interface MatchState {
  mode: "duel" | "team";
  teams: [FighterProfile[], FighterProfile[]];
  active: [number, number];
  wins: [number, number];
  round: number;
  phase: Phase;
  phaseT: number;
  timer: number;
  fighters: [Fighter, Fighter];
  projectiles: Projectile[];
  winner: 0 | 1 | null;
  frame: number;
  events: MatchEvent[];
  lastLoser: (0 | 1)[];
  /** Arrêt sur image après un impact (ressenti des coups). */
  hitstop: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const statOf = (p: FighterProfile, k: keyof FighterStats) => clamp(Number(p.stats?.[k]) || 50, 0, 100);

/** Influence bornée des statistiques réelles. */
export function tuning(p: FighterProfile) {
  return {
    damage: 0.85 + statOf(p, "force") / 333,
    walk: 0.85 + statOf(p, "vitesse") / 330, // multiplicateur 0,85 à 1,15
    meterGain: 0.9 + statOf(p, "technique") / 500,
  };
}

function spawn(profile: FighterProfile, side: 0 | 1, hp = MAX_HP, meter = 0, reviveUsed = false): Fighter {
  return {
    profile, char: characterFor(profile.id, profile.specialName), side,
    x: side === 0 ? 120 : STAGE_W - 120, y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
    hp, meter, state: "ready", move: null, moveName: null, t: 0, hitDone: false, connected: false,
    stun: 0, comboTaken: 0, bestCombo: 0, reviveUsed, invuln: 0, kd: false, thrownBy: null, backThrow: false, dirs: [], press: {}, prev: NO_INPUT,
  };
}

export function createMatch(mode: "duel" | "team", team1: FighterProfile[], team2: FighterProfile[]): MatchState {
  if (!team1.length || !team2.length) throw new Error("Chaque camp doit avoir au moins un combattant");
  const t1 = mode === "duel" ? team1.slice(0, 1) : team1.slice(0, 3);
  const t2 = mode === "duel" ? team2.slice(0, 1) : team2.slice(0, 3);
  return {
    mode, teams: [t1, t2], active: [0, 0], wins: [0, 0], round: 1, phase: "intro", phaseT: 0, timer: ROUND_FRAMES,
    fighters: [spawn(t1[0], 0), spawn(t2[0], 1)], projectiles: [], winner: null, frame: 0,
    events: [{ type: "roundStart", round: 1 }], lastLoser: [], hitstop: 0,
  };
}

const INTRO_FRAMES = 100;
const ROUND_END_FRAMES = 130;

function setState(f: Fighter, s: FighterState, move: MoveDef | null = null, name: string | null = null) {
  f.state = s; f.move = move; f.moveName = name; f.t = 0; f.hitDone = false; f.connected = false;
}

const free = (f: Fighter) => ["idle", "walk", "crouch", "guard", "cguard"].includes(f.state);
const grounded = (f: Fighter) => f.y === 0;
const total = (m: MoveDef) => m.startup + m.active + m.recovery;
export const hurtHeight = (f: Fighter) =>
  f.state === "crouch" || f.state === "cguard" || (f.move?.id.startsWith("c_") ?? false) ? f.char.size.crouchH
    : f.state === "down" ? 12 : f.state === "dodge" ? 30 : f.char.size.h;

/** Direction en notation pavé numérique, relative à l'orientation (6 = avant). */
function relDir(f: Fighter, i: Input) {
  const fwd = f.facing > 0 ? i.right : i.left;
  const back = f.facing > 0 ? i.left : i.right;
  const h = fwd && !back ? 1 : back && !fwd ? -1 : 0;
  const v = i.up ? 1 : i.down ? -1 : 0;
  return 5 + h + v * 3;
}

const MOTIONS: Record<Motion, number[]> = { qcf: [2, 3, 6], qcb: [2, 1, 4], dp: [6, 2, 3], qcf2: [2, 3, 6, 2, 3, 6] };

/** Vrai si la séquence de directions apparaît, dans l'ordre, dans le tampon récent. */
function motionDone(f: Fighter, frame: number, m: Motion) {
  const seq = MOTIONS[m];
  const window = m === "qcf2" ? BUFFER * 2 : BUFFER;
  const recent = f.dirs.filter((d) => frame - d.f <= window).map((d) => d.d);
  let i = 0;
  for (const d of recent) if (d === seq[i]) i += 1;
  return i >= seq.length;
}

function startMove(s: MatchState, f: Fighter, m: MoveDef, name: string) {
  f.press = {}; // les appuis en attente sont consommés
  setState(f, "attack", m, name);
  if (grounded(f)) f.vx = (m.lunge ?? 0) * f.facing;
  if (m.invuln) f.invuln = m.invuln[1];
}

function trySpecial(s: MatchState, f: Fighter, pressed: (k: keyof Input) => boolean, pressedP: boolean, pressedK: boolean): boolean {
  if (!grounded(f)) return false;
  const sup = f.char.superMove;
  if (f.meter >= MAX_METER && (pressed("super") || (pressedP && motionDone(f, s.frame, sup.motion)))) {
    f.meter = 0;
    startMove(s, f, sup.move, sup.name);
    s.events.push({ type: "special", side: f.side, name: sup.name, super: true });
    s.hitstop = 12;
    return true;
  }
  for (const sp of f.char.specials) {
    const btn = sp.button === "p" ? pressedP : pressedK;
    if (pressed("special") || (btn && motionDone(f, s.frame, sp.motion))) {
      if (runSpecial(s, f, sp)) return true;
    }
  }
  return false;
}

function runSpecial(s: MatchState, f: Fighter, sp: SpecialDef) {
  if (sp.move.projectile && s.projectiles.some((p) => p.owner === f.side)) return false;
  startMove(s, f, sp.move, sp.name);
  s.events.push({ type: "special", side: f.side, name: sp.name, super: false });
  return true;
}

function normalFor(f: Fighter, i: Input, pressed: (k: keyof Input) => boolean): NormalId | null {
  const pre = !grounded(f) ? "j_" : i.down ? "c_" : "s_";
  const order: (keyof Input)[] = ["hk", "hp", "lk", "lp"];
  for (const b of order) if (pressed(b)) return `${pre}${b}` as NormalId;
  return null;
}

/** Garde : reculer protège en haut, reculer accroupi protège en bas. Les coups sautés se gardent debout. */
function guardResult(def: Fighter, m: { guard: string }, fromX: number): "block" | "hit" {
  if (m.guard === "throw" || !grounded(def)) return "hit";
  if (!(free(def) || def.state === "block")) return "hit";
  const back = fromX > def.x ? def.prev.left : def.prev.right;
  if (!back) return "hit";
  const crouching = def.prev.down;
  if (m.guard === "low" && !crouching) return "hit";
  if (m.guard === "high" && crouching) return "hit";
  return "block";
}

function damage(s: MatchState, att: Fighter | null, def: Fighter, m: { damage: number; hitstun: number; blockstun: number; push: number; knockdown?: boolean; launch?: number; guard: string; effect?: string },
  fromX: number, hx: number, hy: number) {
  if (def.invuln > 0 || def.state === "down" || def.state === "ko" || def.state === "dodge" && def.t < 16) return false;
  const dir = fromX < def.x ? 1 : -1;
  const mult = att ? tuning(att.profile).damage : 1;
  const res = guardResult(def, m, fromX);
  if (res === "block") {
    const chip = Math.round(m.damage * mult * 0.12);
    def.hp = Math.max(1, def.hp - chip);
    setState(def, "block"); def.stun = m.blockstun; def.vx = dir * m.push * 0.7;
    if (att) att.meter = Math.min(MAX_METER, att.meter + m.damage * 0.03 * tuning(att.profile).meterGain);
    def.meter = Math.min(MAX_METER, def.meter + m.damage * 0.03);
    s.events.push({ type: "hit", side: def.side, x: hx, y: hy, blocked: true, heavy: false, dmg: chip, combo: 0 });
    s.hitstop = 3;
    return true;
  }
  const inCombo = def.state === "hit" || def.state === "thrown" || (def.state === "jump" && def.stun > 0);
  def.comboTaken = inCombo ? def.comboTaken + 1 : 1;
  const scale = Math.max(0.4, 1 - (def.comboTaken - 1) * 0.12); // combos dégressifs
  const dmg = Math.round(m.damage * mult * scale);
  def.hp = Math.max(0, def.hp - dmg);
  if (att) {
    att.connected = true;
    att.meter = Math.min(MAX_METER, att.meter + m.damage * 0.06 * tuning(att.profile).meterGain);
    att.bestCombo = Math.max(att.bestCombo, def.comboTaken);
  }
  def.meter = Math.min(MAX_METER, def.meter + m.damage * 0.04);
  s.events.push({ type: "hit", side: def.side, x: hx, y: hy, blocked: false, heavy: m.damage >= 65, dmg, combo: def.comboTaken });
  s.hitstop = m.damage >= 65 ? 6 : 4;

  if (def.hp <= 0) { setState(def, "ko"); def.vx = dir * 2.6; def.vy = -3.4; def.y = Math.min(def.y, -1); return true; }
  if (m.effect === "dizzy") { setState(def, "dizzy"); def.stun = 75; def.vx = 0; s.events.push({ type: "dizzy", side: def.side }); return true; }
  if (m.knockdown || !grounded(def) || m.launch) {
    setState(def, "hit"); def.stun = m.hitstun; def.vx = dir * m.push;
    def.vy = m.launch ? -m.launch : grounded(def) ? -3.2 : Math.min(def.vy, -2.6);
    def.y = Math.min(def.y, -1);
    def.kd = true;
    return true;
  }
  setState(def, "hit"); def.stun = m.hitstun; def.vx = dir * m.push;
  return true;
}

function tryThrow(s: MatchState, f: Fighter, other: Fighter, i: Input, pressed: (k: keyof Input) => boolean) {
  const towardOrBack = i.left || i.right;
  if (!pressed("hp") || !towardOrBack || !grounded(f) || !grounded(other)) return false;
  if (Math.abs(other.x - f.x) > 38 || !free(other) || other.invuln > 0) return false;
  const backThrow = (other.x > f.x ? i.left : i.right);
  startMove(s, f, f.char.normals.throw, "throw");
  setState(other, "thrown"); other.stun = 30;
  other.facing = f.facing === 1 ? -1 : 1;
  s.events.push({ type: "throw", side: f.side });
  other.thrownBy = f.side;
  other.backThrow = backThrow;
  return true;
}

/** Enregistre les nouveaux appuis (aussi pendant l'arrêt sur image). */
function latch(s: MatchState, f: Fighter, i: Input) {
  for (const k of BTNS) if (i[k] && !f.prev[k]) f.press[k] = s.frame;
  f.prev = i;
}

function update(s: MatchState, f: Fighter, other: Fighter, i: Input) {
  latch(s, f, i);
  const pressed = (k: keyof Input) => { const at = f.press[k as Btn]; return at !== undefined && s.frame - at <= PRESS_WINDOW; };
  const tune = tuning(f.profile);
  f.t += 1;
  if (f.invuln > 0) f.invuln -= 1;

  // Tampon de directions (relatives), comme un fichier de commandes.
  const d = relDir(f, i);
  if (!f.dirs.length || f.dirs[f.dirs.length - 1].d !== d) f.dirs.push({ d, f: s.frame });
  if (f.dirs.length > 24) f.dirs.shift();

  if (free(f) && grounded(f)) f.facing = other.x >= f.x ? 1 : -1;

  if (s.phase === "fight") {
    const pressedP = pressed("lp") || pressed("hp");
    const pressedK = pressed("lk") || pressed("hk");
    switch (f.state) {
      case "hit": case "block":
        f.stun -= 1;
        if (f.stun <= 0 && grounded(f)) { setState(f, "idle"); f.comboTaken = 0; }
        break;
      case "dizzy":
        f.stun -= 1; f.vx = 0;
        if (f.stun <= 0) { setState(f, "idle"); f.comboTaken = 0; }
        break;
      case "thrown": {
        f.stun -= 1;
        if (f.stun === 18) {
          const thrower = s.fighters[f.thrownBy ?? (f.side === 0 ? 1 : 0)];
          const dir = f.backThrow ? -thrower.facing : thrower.facing;
          f.x = clamp(thrower.x + dir * 18, WALL, STAGE_W - WALL);
          damage(s, thrower, f, { ...thrower.char.normals.throw, guard: "throw" }, thrower.x, f.x, -30);
          f.vx = dir * 3.2;
        }
        if (f.stun <= 0 && f.state === "thrown") setState(f, "idle");
        break;
      }
      case "down":
        f.vx *= 0.8;
        if (f.t >= (f.stun || 40)) { setState(f, "getup"); f.invuln = 14; }
        break;
      case "getup":
        if (f.t >= 14) { setState(f, "idle"); f.comboTaken = 0; }
        break;
      case "dodge":
        f.vx = f.t < 20 ? f.facing * 2.3 : 0;
        if (f.t >= 26) setState(f, "idle");
        break;
      case "attack": {
        const m = f.move!;
        // Annulations : coup léger vers coup suivant, ou vers spéciale, quand le coup a touché.
        if (f.connected && f.t > m.startup) {
          if (m.cancel?.includes("special") && trySpecial(s, f, pressed, pressedP, pressedK)) break;
          if (m.cancel?.includes("chain")) {
            const nid = normalFor(f, i, pressed);
            if (nid) { startMove(s, f, f.char.normals[nid], nid); break; }
          }
        }
        if (m.projectile && f.t === m.startup) {
          s.projectiles.push({ owner: f.side, x: f.x + f.facing * 26, y: -m.projectile.h, vx: f.facing * m.projectile.speed, def: m.projectile, ttl: m.projectile.ttl });
        }
        if (!m.projectile && m.id !== "throw" && !f.hitDone && f.t > m.startup && f.t <= m.startup + m.active) {
          const x0 = f.x + f.facing * m.hit.x, x1 = f.x + f.facing * (m.hit.x + m.hit.w);
          const [ax0, ax1] = f.facing > 0 ? [x0, x1] : [x1, x0];
          const ay0 = f.y - m.hit.y - m.hit.h, ay1 = f.y - m.hit.y;
          const hw = other.char.size.w / 2;
          const hy0 = other.y - hurtHeight(other), hy1 = other.y;
          if (ax1 >= other.x - hw && ax0 <= other.x + hw && ay1 >= hy0 && ay0 <= hy1) {
            const ok = damage(s, f, other, m, f.x, (Math.max(ax0, other.x - hw) + Math.min(ax1, other.x + hw)) / 2, (Math.max(ay0, hy0) + Math.min(ay1, hy1)) / 2);
            if (ok) f.hitDone = true;
          }
        }
        if (f.t >= total(m)) setState(f, grounded(f) ? (i.down ? "crouch" : "idle") : "jump");
        break;
      }
      case "jump": {
        const nid = normalFor(f, i, pressed);
        if (nid) startMove(s, f, f.char.normals[nid], nid);
        break;
      }
      default: {
        if (!free(f)) break;
        if (trySpecial(s, f, pressed, pressedP, pressedK)) break;
        if (tryThrow(s, f, other, i, pressed)) break;
        if ((pressed("dodge") || (pressed("lp") && i.lk) || (pressed("lk") && i.lp)) && grounded(f)) {
          f.press = {}; setState(f, "dodge"); f.invuln = 16; s.events.push({ type: "dodge", side: f.side }); break;
        }
        const nid = normalFor(f, i, pressed);
        if (nid) { startMove(s, f, f.char.normals[nid], nid); break; }
        const fwd = f.facing > 0 ? i.right : i.left;
        const back = f.facing > 0 ? i.left : i.right;
        if (i.up && grounded(f)) {
          setState(f, "jump"); f.vy = f.char.jumpV;
          f.vx = fwd ? 2.9 * tune.walk * f.facing : back ? -2.5 * tune.walk * f.facing : 0;
        } else if (i.down) {
          f.vx = 0;
          const st = back ? "cguard" : "crouch";
          if (f.state !== st) setState(f, st);
        } else if (fwd) {
          f.vx = f.char.walk * tune.walk * f.facing; if (f.state !== "walk") setState(f, "walk");
        } else if (back) {
          f.vx = -f.char.backWalk * tune.walk * f.facing; if (f.state !== "guard") setState(f, "guard");
        } else {
          f.vx = 0; if (f.state !== "idle") setState(f, "idle");
        }
      }
    }
  }

  // Physique.
  if (f.y < 0 || f.vy !== 0) {
    f.vy += GRAVITY; f.y += f.vy;
    if (f.y >= 0) {
      f.y = 0; f.vy = 0;
      if (f.state === "ko") f.vx *= 0.5;
      else if (f.kd && f.state === "hit") { f.kd = false; setState(f, "down"); f.stun = 38; f.invuln = 52; }
      else if (f.state === "jump" || (f.state === "attack" && f.move?.id.startsWith("j_"))) setState(f, "idle");
    }
  }
  f.x = clamp(f.x + f.vx, WALL, STAGE_W - WALL);
  if (grounded(f) && ["hit", "block", "ko", "down", "thrown"].includes(f.state)) f.vx *= 0.82;
  if (f.state === "attack" && grounded(f) && f.t > (f.move?.startup ?? 0) + 2) f.vx *= 0.8;
}

function separate(a: Fighter, b: Fighter) {
  if (a.state === "dodge" || b.state === "dodge" || a.state === "thrown" || b.state === "thrown") return;
  const dx = b.x - a.x;
  const minDist = (a.char.size.w + b.char.size.w) / 2;
  const overlap = minDist - Math.abs(dx);
  if (overlap > 0 && Math.abs(a.y - b.y) < 52) {
    const push = (overlap / 2) * (dx >= 0 ? 1 : -1);
    a.x = clamp(a.x - push, WALL, STAGE_W - WALL);
    b.x = clamp(b.x + push, WALL, STAGE_W - WALL);
  }
}

function updateProjectiles(s: MatchState) {
  const keep: Projectile[] = [];
  for (const p of s.projectiles) {
    p.x += p.vx; p.ttl -= 1;
    const target = s.fighters[p.owner === 0 ? 1 : 0];
    const hw = target.char.size.w / 2 + 6;
    const hit = Math.abs(p.x - target.x) < hw && p.y >= target.y - hurtHeight(target) && p.y <= target.y;
    if (hit && target.invuln <= 0 && !(target.state === "dodge" && target.t < 16) && target.state !== "down" && target.state !== "ko") {
      const owner = s.fighters[p.owner];
      damage(s, owner, target, { damage: p.def.damage, hitstun: p.def.hitstun, blockstun: p.def.blockstun, push: 3, guard: "mid", effect: p.def.effect }, p.x - p.vx * 4, p.x, p.y);
      continue;
    }
    if (p.ttl > 0 && p.x > -10 && p.x < STAGE_W + 10) keep.push(p);
  }
  for (let a = 0; a < keep.length; a++) for (let b = a + 1; b < keep.length; b++) {
    if (keep[a].owner !== keep[b].owner && Math.abs(keep[a].x - keep[b].x) < 10) { keep[a].ttl = 0; keep[b].ttl = 0; }
  }
  s.projectiles = keep.filter((p) => p.ttl > 0);
}

function endRound(s: MatchState, losers: (0 | 1)[]) {
  s.phase = "roundEnd"; s.phaseT = 0; s.lastLoser = losers; s.projectiles = [];
  for (const f of s.fighters) if (!losers.includes(f.side) && f.state !== "ko") { setState(f, "win"); f.vx = 0; }
}

function nextRound(s: MatchState) {
  const losers = s.lastLoser;
  if (s.mode === "duel") {
    for (const side of [0, 1] as const) if (!losers.includes(side)) s.wins[side] += 1;
    if (losers.length === 2) { s.wins[0] += 1; s.wins[1] += 1; }
    const w0 = s.wins[0] >= 2, w1 = s.wins[1] >= 2;
    if (w0 || w1) return finish(s, w0 && w1 ? null : w0 ? 0 : 1);
    s.round += 1;
    s.fighters = [spawn(s.teams[0][0], 0, MAX_HP, s.fighters[0].meter), spawn(s.teams[1][0], 1, MAX_HP, s.fighters[1].meter)];
  } else {
    const keep = s.fighters.map((f) => ({ hp: Math.min(MAX_HP, Math.round(f.hp + (MAX_HP - f.hp) * 0.25)), meter: f.meter, revive: f.reviveUsed }));
    for (const side of losers) s.active[side] += 1;
    const out0 = s.active[0] >= s.teams[0].length, out1 = s.active[1] >= s.teams[1].length;
    if (out0 || out1) return finish(s, out0 && out1 ? null : out0 ? 1 : 0);
    s.round += 1;
    s.fighters = [0, 1].map((side) => {
      const fresh = losers.includes(side as 0 | 1);
      const k = keep[side];
      // La jauge d'énergie passe au coéquipier suivant (principe des équipes).
      return spawn(s.teams[side][s.active[side]], side as 0 | 1, fresh ? MAX_HP : k.hp, k.meter, fresh ? false : k.revive);
    }) as [Fighter, Fighter];
    for (const side of losers) s.events.push({ type: "next", side, name: s.teams[side][s.active[side]].name });
  }
  s.phase = "intro"; s.phaseT = 0; s.timer = ROUND_FRAMES; s.projectiles = [];
  s.events.push({ type: "roundStart", round: s.round });
}

function finish(s: MatchState, winner: 0 | 1 | null) {
  s.phase = "matchEnd"; s.phaseT = 0; s.winner = winner;
  if (winner !== null && s.fighters[winner].state !== "ko") setState(s.fighters[winner], "win");
  s.events.push({ type: "matchEnd", winner });
}

/** Talent passif « retour du K.-O. » : une fois par match. */
function handleRevive(s: MatchState, f: Fighter) {
  const p = f.char.passive;
  if (f.hp > 0 || !p || p.kind !== "revive" || f.reviveUsed) return false;
  f.reviveUsed = true;
  setState(f, "down"); f.stun = 70; f.invuln = 90; f.vx = 0;
  f.hp = Math.round(MAX_HP * p.hpPct);
  s.events.push({ type: "revive", side: f.side, name: p.name });
  return true;
}

export function step(s: MatchState, in0: Input, in1: Input): MatchState {
  s.events = [];
  s.frame += 1;
  if (s.hitstop > 0) {
    s.hitstop -= 1;
    if (s.phase === "fight") { latch(s, s.fighters[0], in0); latch(s, s.fighters[1], in1); }
    return s;
  }
  s.phaseT += 1;
  const [a, b] = s.fighters;

  if (s.phase === "intro") {
    if (s.phaseT >= INTRO_FRAMES) {
      s.phase = "fight"; s.phaseT = 0;
      for (const f of s.fighters) setState(f, "idle");
      s.events.push({ type: "fight" });
    }
    update(s, a, b, NO_INPUT); update(s, b, a, NO_INPUT);
    return s;
  }

  if (s.phase === "fight") {
    update(s, a, b, in0);
    update(s, b, a, in1);
    separate(a, b);
    updateProjectiles(s);
    s.timer -= 1;
    for (const f of s.fighters) if (f.hp <= 0 && f.state !== "down") handleRevive(s, f);
    const ko = s.fighters.filter((f) => f.hp <= 0).map((f) => f.side);
    if (ko.length) {
      for (const side of ko) s.events.push({ type: "ko", side });
      endRound(s, ko);
    } else if (s.timer <= 0) {
      s.events.push({ type: "timeOver" });
      endRound(s, a.hp === b.hp ? [0, 1] : a.hp < b.hp ? [0] : [1]);
    }
    return s;
  }

  update(s, a, b, NO_INPUT); update(s, b, a, NO_INPUT);
  if (s.phase === "roundEnd" && s.phaseT >= ROUND_END_FRAMES) nextRound(s);
  return s;
}
