// Moteur de combat Guilde Fighters.
// Logique pure, à pas fixe (60 pas par seconde), sans DOM ni hasard : le rendu,
// l'IA et les contrôles sont séparés. Les mêmes entrées donnent toujours le même combat.

export const STAGE_W = 384;
export const STAGE_H = 216;
export const FLOOR = 188; // ligne du sol en pixels logiques
export const FPS = 60;
export const ROUND_FRAMES = 60 * FPS;
export const MAX_HP = 1000;

const WALL = 18;
const BODY_W = 22;
const BODY_H = 52;
const GRAVITY = 0.42;
const JUMP_V = -7.6;

export interface Input { left: boolean; right: boolean; up: boolean; down: boolean; punch: boolean; kick: boolean; special: boolean }
export const NO_INPUT: Input = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false };

export interface FighterStats { force: number; vitesse: number; technique: number }

export interface FighterProfile {
  id: number;
  name: string;
  /** Statistiques réelles du membre (0 à 100). Bornées : elles nuancent le combat sans le déséquilibrer. */
  stats: FighterStats;
  specialName: string;
}

export type MoveId = "punch" | "kick" | "airkick" | "special";
export type FighterState = "idle" | "walk" | "jump" | "attack" | "guard" | "hit" | "block" | "ko" | "win" | "ready";

interface MoveData { startup: number; active: number; recovery: number; dmg: number; reach: number; height: number; hitstun: number; blockstun: number; push: number }

export const MOVES: Record<Exclude<MoveId, "special">, MoveData> = {
  punch: { startup: 4, active: 3, recovery: 9, dmg: 45, reach: 30, height: -38, hitstun: 15, blockstun: 9, push: 2.4 },
  kick: { startup: 8, active: 4, recovery: 15, dmg: 75, reach: 38, height: -20, hitstun: 21, blockstun: 12, push: 4.2 },
  airkick: { startup: 3, active: 9, recovery: 3, dmg: 60, reach: 30, height: -14, hitstun: 17, blockstun: 10, push: 3 },
};
export const SPECIAL = { startup: 12, recovery: 18, dmg: 90, speed: 4.2, hitstun: 22, blockstun: 14, push: 4 };

export interface Fighter {
  profile: FighterProfile;
  side: 0 | 1;
  x: number;
  /** Hauteur des pieds : 0 au sol, négatif en l'air. */
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  state: FighterState;
  move: MoveId | null;
  t: number;
  hitDone: boolean;
  stun: number;
  specialCd: number;
  combo: number;
  prev: Input;
}

export interface Projectile { owner: 0 | 1; x: number; y: number; vx: number; dmg: number; ttl: number }

export type MatchEvent =
  | { type: "roundStart"; round: number }
  | { type: "fight" }
  | { type: "hit"; side: 0 | 1; x: number; y: number; blocked: boolean; heavy: boolean; dmg: number }
  | { type: "special"; side: 0 | 1; name: string }
  | { type: "ko"; side: 0 | 1 }
  | { type: "timeOver" }
  | { type: "next"; side: 0 | 1; name: string }
  | { type: "matchEnd"; winner: 0 | 1 | null };

export type Phase = "intro" | "fight" | "roundEnd" | "matchEnd";

export interface MatchState {
  mode: "duel" | "team";
  teams: [FighterProfile[], FighterProfile[]];
  /** Combattant actif de chaque équipe (index dans `teams`). */
  active: [number, number];
  /** Manches gagnées (duel). */
  wins: [number, number];
  round: number;
  phase: Phase;
  phaseT: number;
  timer: number;
  fighters: [Fighter, Fighter];
  projectiles: Projectile[];
  winner: 0 | 1 | null;
  frame: number;
  /** Événements produits pendant le dernier pas (effets, sons, textes). */
  events: MatchEvent[];
  /** Qui a perdu la dernière manche (pour enchaîner). */
  lastLoser: (0 | 1)[];
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const statOf = (p: FighterProfile, k: keyof FighterStats) => clamp(Number(p.stats?.[k]) || 50, 0, 100);

/** Influence des statistiques réelles, volontairement bornée. */
export function tuning(p: FighterProfile) {
  return {
    damage: 0.85 + statOf(p, "force") / 333, // 0,85 à 1,15
    walk: 1.35 + statOf(p, "vitesse") / 110, // 1,35 à 2,26 px par pas
    specialCooldown: Math.round(200 - statOf(p, "technique") * 0.9), // 110 à 200 pas
  };
}

function spawnFighter(profile: FighterProfile, side: 0 | 1, hp = MAX_HP): Fighter {
  return {
    profile, side, x: side === 0 ? 120 : STAGE_W - 120, y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
    hp, state: "ready", move: null, t: 0, hitDone: false, stun: 0, specialCd: 60, combo: 0, prev: NO_INPUT,
  };
}

export function createMatch(mode: "duel" | "team", team1: FighterProfile[], team2: FighterProfile[]): MatchState {
  if (!team1.length || !team2.length) throw new Error("Chaque camp doit avoir au moins un combattant");
  const t1 = mode === "duel" ? team1.slice(0, 1) : team1.slice(0, 3);
  const t2 = mode === "duel" ? team2.slice(0, 1) : team2.slice(0, 3);
  return {
    mode, teams: [t1, t2], active: [0, 0], wins: [0, 0], round: 1, phase: "intro", phaseT: 0, timer: ROUND_FRAMES,
    fighters: [spawnFighter(t1[0], 0), spawnFighter(t2[0], 1)], projectiles: [], winner: null, frame: 0,
    events: [{ type: "roundStart", round: 1 }], lastLoser: [],
  };
}

const INTRO_FRAMES = 100;
const ROUND_END_FRAMES = 130;

function canAct(f: Fighter) {
  return f.state === "idle" || f.state === "walk" || f.state === "guard";
}

function setState(f: Fighter, s: FighterState, move: MoveId | null = null) {
  f.state = s; f.move = move; f.t = 0; f.hitDone = false;
}

function moveFrames(m: MoveId) {
  if (m === "special") return { startup: SPECIAL.startup, active: 1, total: SPECIAL.startup + 1 + SPECIAL.recovery };
  const d = MOVES[m];
  return { startup: d.startup, active: d.active, total: d.startup + d.active + d.recovery };
}

/** Le défenseur se protège s'il recule (direction opposée à l'attaquant) au sol et libre d'agir. */
function isGuarding(def: Fighter, attackerX: number) {
  if (def.y < 0 || !(def.state === "guard" || def.state === "walk" || def.state === "idle" || def.state === "block")) return false;
  const away = attackerX > def.x ? def.prev.left : def.prev.right;
  return away;
}

function applyHit(s: MatchState, att: Fighter | null, def: Fighter, baseDmg: number, hitstun: number, blockstun: number, push: number, fromX: number, hx: number, hy: number) {
  const blocked = isGuarding(def, fromX);
  const dmgMul = att ? tuning(att.profile).damage : 1;
  const dir = fromX < def.x ? 1 : -1;
  if (blocked) {
    const chip = Math.round(baseDmg * dmgMul * 0.1);
    def.hp = Math.max(1, def.hp - chip); // la garde ne met jamais K.-O.
    setState(def, "block"); def.stun = blockstun; def.vx = dir * push * 0.6;
    s.events.push({ type: "hit", side: def.side, x: hx, y: hy, blocked: true, heavy: false, dmg: chip });
    if (att) att.combo = 0;
    return;
  }
  const scaled = att && att.combo > 0 ? Math.max(0.5, 1 - att.combo * 0.15) : 1; // combos dégressifs
  const dmg = Math.round(baseDmg * dmgMul * scaled);
  def.hp = Math.max(0, def.hp - dmg);
  if (att) att.combo += 1;
  def.combo = 0;
  s.events.push({ type: "hit", side: def.side, x: hx, y: hy, blocked: false, heavy: baseDmg >= 70, dmg });
  if (def.hp <= 0) {
    setState(def, "ko"); def.vx = dir * 2.6; def.vy = def.y < 0 ? def.vy : -3.2;
    return;
  }
  setState(def, "hit"); def.stun = hitstun; def.vx = dir * push;
  if (def.y < 0) def.vy = Math.min(def.vy, -2.2);
}

function updateFighter(s: MatchState, f: Fighter, other: Fighter, input: Input) {
  const tune = tuning(f.profile);
  const pressed = (k: keyof Input) => input[k] && !f.prev[k];
  f.t += 1;
  if (f.specialCd > 0) f.specialCd -= 1;

  // Orientation automatique vers l'adversaire quand le combattant est libre.
  if (canAct(f) && f.y === 0) f.facing = other.x >= f.x ? 1 : -1;

  if (s.phase === "fight") {
    if (f.state === "hit" || f.state === "block") {
      f.stun -= 1;
      if (f.stun <= 0 && f.y === 0) setState(f, "idle");
    } else if (f.state === "attack" && f.move) {
      const fr = moveFrames(f.move);
      if (f.move === "special" && f.t === fr.startup) {
        s.projectiles.push({ owner: f.side, x: f.x + f.facing * 18, y: -34, vx: f.facing * SPECIAL.speed, dmg: SPECIAL.dmg, ttl: 120 });
        s.events.push({ type: "special", side: f.side, name: f.profile.specialName });
      }
      if (f.move !== "special" && !f.hitDone && f.t > fr.startup && f.t <= fr.startup + fr.active) {
        const d = MOVES[f.move];
        const front = f.x + f.facing * 8, tip = f.x + f.facing * (8 + d.reach);
        const [ax0, ax1] = f.facing > 0 ? [front, tip] : [tip, front];
        const ay = f.y + d.height;
        const hurtL = other.x - BODY_W / 2, hurtR = other.x + BODY_W / 2;
        const hurtT = other.y - BODY_H, hurtB = other.y;
        if (other.state !== "ko" && ax1 >= hurtL && ax0 <= hurtR && ay + 9 >= hurtT && ay - 9 <= hurtB) {
          f.hitDone = true;
          applyHit(s, f, other, d.dmg, d.hitstun, d.blockstun, d.push, f.x, (Math.max(ax0, hurtL) + Math.min(ax1, hurtR)) / 2, ay);
        }
      }
      if (f.t >= fr.total) setState(f, f.y < 0 ? "jump" : "idle");
    } else if (f.state === "ko" || f.state === "win") {
      // rien : animation seulement
    } else if (f.state === "jump") {
      if (pressed("kick") || pressed("punch")) setState(f, "attack", "airkick");
    } else if (canAct(f)) {
      if (pressed("special") && f.specialCd === 0 && f.y === 0) {
        setState(f, "attack", "special"); f.vx = 0; f.specialCd = tune.specialCooldown;
      } else if (pressed("kick")) { setState(f, "attack", "kick"); f.vx = 0; }
      else if (pressed("punch")) { setState(f, "attack", "punch"); f.vx = 0; }
      else if (input.up && f.y === 0) {
        setState(f, "jump"); f.vy = JUMP_V;
        f.vx = input.left ? -tune.walk * 1.1 : input.right ? tune.walk * 1.1 : 0;
      } else if (input.left !== input.right) {
        const dir = input.left ? -1 : 1;
        const backwards = dir !== f.facing;
        f.vx = dir * tune.walk * (backwards ? 0.75 : 1);
        if (f.state !== "walk" && !backwards) setState(f, "walk");
        if (backwards && f.state !== "guard") setState(f, "guard");
      } else {
        f.vx = 0;
        if (f.state !== "idle") setState(f, "idle");
      }
    }
  }

  // Physique.
  if (f.y < 0 || f.vy !== 0) {
    f.vy += GRAVITY; f.y += f.vy;
    if (f.y >= 0) {
      f.y = 0; f.vy = 0;
      if (f.state === "jump" || (f.state === "attack" && f.move === "airkick")) setState(f, "idle");
      if (f.state === "hit" && f.stun <= 0) setState(f, "idle");
    }
  }
  f.x = clamp(f.x + f.vx, WALL, STAGE_W - WALL);
  if (f.y === 0 && (f.state === "hit" || f.state === "block" || f.state === "ko")) f.vx *= 0.82;
  f.prev = input;
}

function separate(a: Fighter, b: Fighter) {
  const dx = b.x - a.x;
  const overlap = BODY_W - Math.abs(dx);
  if (overlap > 0 && Math.abs(a.y - b.y) < BODY_H * 0.7) {
    const push = overlap / 2 * (dx >= 0 ? 1 : -1);
    a.x = clamp(a.x - push, WALL, STAGE_W - WALL);
    b.x = clamp(b.x + push, WALL, STAGE_W - WALL);
  }
}

function updateProjectiles(s: MatchState) {
  const keep: Projectile[] = [];
  for (const p of s.projectiles) {
    p.x += p.vx; p.ttl -= 1;
    const target = s.fighters[p.owner === 0 ? 1 : 0];
    const hit = target.state !== "ko" && Math.abs(p.x - target.x) < BODY_W / 2 + 6 && p.y >= target.y - BODY_H && p.y <= target.y;
    if (hit) {
      const owner = s.fighters[p.owner];
      applyHit(s, owner, target, p.dmg, SPECIAL.hitstun, SPECIAL.blockstun, SPECIAL.push, p.x - p.vx * 4, p.x, p.y);
      continue;
    }
    if (p.ttl > 0 && p.x > 0 && p.x < STAGE_W) keep.push(p);
  }
  // Deux projectiles qui se croisent s'annulent.
  for (let i = 0; i < keep.length; i++) for (let j = i + 1; j < keep.length; j++) {
    if (keep[i].owner !== keep[j].owner && Math.abs(keep[i].x - keep[j].x) < 10) { keep[i].ttl = 0; keep[j].ttl = 0; }
  }
  s.projectiles = keep.filter((p) => p.ttl > 0);
}

function endRound(s: MatchState, losers: (0 | 1)[]) {
  s.phase = "roundEnd"; s.phaseT = 0; s.lastLoser = losers;
  s.projectiles = [];
  for (const f of s.fighters) {
    if (!losers.includes(f.side) && f.state !== "ko") { setState(f, "win"); f.vx = 0; }
  }
}

function nextRound(s: MatchState) {
  const losers = s.lastLoser;
  if (s.mode === "duel") {
    for (const side of [0, 1] as const) if (!losers.includes(side)) s.wins[side] += 1;
    if (losers.length === 2) { s.wins[0] += 1; s.wins[1] += 1; }
    const w0 = s.wins[0] >= 2, w1 = s.wins[1] >= 2;
    if (w0 || w1) return finish(s, w0 && w1 ? null : w0 ? 0 : 1);
    s.round += 1;
    s.fighters = [spawnFighter(s.teams[0][0], 0), spawnFighter(s.teams[1][0], 1)];
  } else {
    // Élimination : le perdant laisse place au suivant, le vainqueur garde sa vie (avec un peu de récupération).
    const keepHp = s.fighters.map((f) => Math.min(MAX_HP, Math.round(f.hp + (MAX_HP - f.hp) * 0.25)));
    for (const side of losers) s.active[side] += 1;
    const out0 = s.active[0] >= s.teams[0].length, out1 = s.active[1] >= s.teams[1].length;
    if (out0 || out1) return finish(s, out0 && out1 ? null : out0 ? 1 : 0);
    s.round += 1;
    s.fighters = [0, 1].map((side) => {
      const p = s.teams[side][s.active[side]];
      const fresh = losers.includes(side as 0 | 1);
      return spawnFighter(p, side as 0 | 1, fresh ? MAX_HP : keepHp[side]);
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

/** Avance le combat d'un pas (1/60 s). */
export function step(s: MatchState, in0: Input, in1: Input): MatchState {
  s.events = [];
  s.frame += 1;
  s.phaseT += 1;
  const [a, b] = s.fighters;

  if (s.phase === "intro") {
    if (s.phaseT === 1) for (const f of s.fighters) setState(f, "ready");
    if (s.phaseT >= INTRO_FRAMES) {
      s.phase = "fight"; s.phaseT = 0;
      for (const f of s.fighters) setState(f, "idle");
      s.events.push({ type: "fight" });
    }
    updateFighter(s, a, b, NO_INPUT); updateFighter(s, b, a, NO_INPUT);
    return s;
  }

  if (s.phase === "fight") {
    updateFighter(s, a, b, in0);
    updateFighter(s, b, a, in1);
    separate(a, b);
    updateProjectiles(s);
    s.timer -= 1;
    const ko = s.fighters.filter((f) => f.hp <= 0).map((f) => f.side);
    if (ko.length) {
      for (const side of ko) s.events.push({ type: "ko", side });
      endRound(s, ko);
    } else if (s.timer <= 0) {
      s.events.push({ type: "timeOver" });
      const [h0, h1] = [a.hp, b.hp];
      endRound(s, h0 === h1 ? [0, 1] : h0 < h1 ? [0] : [1]);
    }
    return s;
  }

  if (s.phase === "roundEnd") {
    updateFighter(s, a, b, NO_INPUT); updateFighter(s, b, a, NO_INPUT);
    if (s.phaseT >= ROUND_END_FRAMES) nextRound(s);
    return s;
  }

  // matchEnd : animations de fin seulement.
  updateFighter(s, a, b, NO_INPUT); updateFighter(s, b, a, NO_INPUT);
  return s;
}
