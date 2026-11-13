// Adversaire contrôlé par l'ordinateur (présenté comme « IA » dans l'interface).
// Il ne fait qu'appuyer sur les mêmes touches qu'un joueur : aucune triche sur le moteur.
import { MOVES, NO_INPUT, type Input, type MatchState } from "./engine";

export type Rng = () => number;

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type AiLevel = "facile" | "normal" | "difficile";

const LEVEL = {
  facile: { think: 16, aggression: 0.35, guard: 0.25, antiProjectile: 0.3 },
  normal: { think: 10, aggression: 0.55, guard: 0.5, antiProjectile: 0.6 },
  difficile: { think: 6, aggression: 0.7, guard: 0.75, antiProjectile: 0.85 },
};

export interface AiMemory { held: Input; until: number }
export const newAiMemory = (): AiMemory => ({ held: NO_INPUT, until: 0 });

export function aiInput(s: MatchState, side: 0 | 1, mem: AiMemory, rng: Rng, level: AiLevel = "normal"): Input {
  if (s.phase !== "fight") return NO_INPUT;
  const me = s.fighters[side], foe = s.fighters[side === 0 ? 1 : 0];
  const L = LEVEL[level];
  const toward = foe.x >= me.x ? "right" : "left";
  const away = toward === "right" ? "left" : "right";
  const dist = Math.abs(foe.x - me.x);

  // Réactions immédiates (elles ne dépendent pas du rythme de réflexion).
  const incoming = s.projectiles.find((p) => p.owner !== side && Math.sign(me.x - p.x) === Math.sign(p.vx) && Math.abs(me.x - p.x) < 90);
  if (incoming && me.y === 0 && s.frame >= mem.until) {
    mem.until = s.frame + 20;
    mem.held = rng() < L.antiProjectile ? { ...NO_INPUT, up: rng() < 0.5, [toward]: true, [away]: false } as Input : { ...NO_INPUT, [away]: true } as Input;
    if (!mem.held.up) mem.held = { ...NO_INPUT, [away]: true } as Input;
    return mem.held;
  }
  const foeThreat = foe.state === "attack" && foe.move !== "special" && dist < 60;
  if (foeThreat && me.y === 0 && rng() < L.guard / 6) {
    mem.held = { ...NO_INPUT, [away]: true } as Input; mem.until = s.frame + 14;
    return mem.held;
  }
  if (s.frame < mem.until) {
    // Les coups sont des appuis brefs : on les relâche après une image pour pouvoir les relancer.
    const h = mem.held;
    if (h.punch || h.kick || h.special) mem.held = { ...h, punch: false, kick: false, special: false };
    return h;
  }

  mem.until = s.frame + L.think;
  const r = rng();
  let next: Input = NO_INPUT;
  if (dist > 140) {
    next = me.specialCd === 0 && r < L.aggression * 0.45 ? { ...NO_INPUT, special: true } : { ...NO_INPUT, [toward]: true } as Input;
  } else if (dist > MOVES.kick.reach + 6) {
    if (r < 0.12) next = { ...NO_INPUT, up: true, [toward]: true } as Input; // saut d'approche
    else if (me.specialCd === 0 && r < 0.12 + L.aggression * 0.2) next = { ...NO_INPUT, special: true };
    else next = { ...NO_INPUT, [toward]: true } as Input;
  } else if (dist > MOVES.punch.reach) {
    next = r < L.aggression ? { ...NO_INPUT, kick: true } : r < L.aggression + 0.2 ? { ...NO_INPUT, [away]: true } as Input : NO_INPUT;
  } else {
    next = r < L.aggression ? { ...NO_INPUT, punch: true } : r < L.aggression + 0.15 ? { ...NO_INPUT, kick: true } : { ...NO_INPUT, [away]: true } as Input;
  }
  mem.held = next;
  return next;
}
