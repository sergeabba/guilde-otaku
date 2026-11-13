// Adversaire contrôlé par l'ordinateur (présenté comme « IA » dans l'interface).
// Il ne fait qu'appuyer sur les mêmes touches qu'un joueur : aucune triche sur le moteur.
// Il exécute de vraies commandes (quart de cercle, enchaînements) image par image.
import { MAX_METER, NO_INPUT, type Input, type MatchState } from "./engine";

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
  facile: { think: 18, aggression: 0.35, guard: 0.2, antiProjectile: 0.3, combo: 0.2 },
  normal: { think: 11, aggression: 0.55, guard: 0.45, antiProjectile: 0.6, combo: 0.5 },
  difficile: { think: 6, aggression: 0.7, guard: 0.7, antiProjectile: 0.85, combo: 0.85 },
};

/** Une étape du plan : directions relatives (f avant, b arrière) et boutons, tenue n images. */
type Step = { f?: boolean; b?: boolean; u?: boolean; d?: boolean; btn?: ("lp" | "hp" | "lk" | "hk" | "dodge")[]; n: number };

export interface AiMemory { plan: Step[]; until: number }
export const newAiMemory = (): AiMemory => ({ plan: [], until: 0 });

const QCF = (btn: "lp" | "hp"): Step[] => [{ d: true, n: 2 }, { d: true, f: true, n: 2 }, { f: true, n: 1 }, { f: true, btn: [btn], n: 1 }];
const QCF2 = (): Step[] => [...QCF("lp").slice(0, 3), ...QCF("hp")];
const hold = (s: Omit<Step, "n">, n: number): Step => ({ ...s, n });

export function aiInput(s: MatchState, side: 0 | 1, mem: AiMemory, rng: Rng, level: AiLevel = "normal"): Input {
  if (s.phase !== "fight") { mem.plan = []; return NO_INPUT; }
  const me = s.fighters[side], foe = s.fighters[side === 0 ? 1 : 0];
  const L = LEVEL[level];
  const dist = Math.abs(foe.x - me.x);
  const fwdKey = foe.x >= me.x ? "right" : "left";
  const backKey = fwdKey === "right" ? "left" : "right";

  const emit = (st: Step): Input => {
    const i: Input = { ...NO_INPUT };
    if (st.f) i[fwdKey] = true;
    if (st.b) i[backKey] = true;
    if (st.u) i.up = true;
    if (st.d) i.down = true;
    for (const b of st.btn ?? []) i[b] = true;
    return i;
  };
  const run = (): Input => {
    const st = mem.plan[0];
    st.n -= 1;
    if (st.n <= 0) mem.plan.shift();
    return emit(st);
  };

  // Réactions défensives (prioritaires sur un plan de déplacement, pas sur un coup lancé).
  const busy = mem.plan.some((p) => p.btn?.length);
  const incoming = s.projectiles.find((p) => p.owner !== side && Math.sign(me.x - p.x) === Math.sign(p.vx) && Math.abs(me.x - p.x) < 80);
  if (incoming && me.y === 0 && !busy && s.frame >= mem.until) {
    mem.until = s.frame + 24;
    const r = rng();
    mem.plan = r < L.antiProjectile * 0.4 ? [hold({ u: true, f: true }, 3), hold({}, 20)]
      : r < L.antiProjectile * 0.7 ? [hold({ btn: ["dodge"] }, 1), hold({}, 22)]
        : [hold({ b: true }, 24)];
  }
  const threat = foe.state === "attack" && foe.move && !foe.move.projectile && dist < 70;
  if (threat && me.y === 0 && !busy && rng() < L.guard / 5) {
    const low = foe.move?.guard === "low";
    mem.plan = [hold({ b: true, d: low }, 16)];
  }

  if (mem.plan.length) return run();
  if (s.frame < mem.until) return NO_INPUT;
  mem.until = s.frame + L.think;

  const r = rng();
  const canWave = !s.projectiles.some((p) => p.owner === side);
  if (me.meter >= MAX_METER && dist < 90 && r < L.aggression * 0.6) { mem.plan = QCF2(); return run(); }
  if (dist > 150) {
    mem.plan = canWave && r < L.aggression * 0.4 ? QCF("lp") : [hold({ f: true }, L.think)];
  } else if (dist > 60) {
    if (r < 0.14) mem.plan = [hold({ u: true, f: true }, 2), hold({}, 14), hold({ btn: ["hk"] }, 1), hold({}, 20)];
    else if (canWave && r < 0.14 + L.aggression * 0.18) mem.plan = QCF("hp");
    else mem.plan = [hold({ f: true }, L.think)];
  } else if (dist > 34) {
    mem.plan = r < L.aggression * 0.5 ? [hold({ btn: ["hk"] }, 1)]
      : r < L.aggression ? [hold({ d: true, btn: ["hk"] }, 1), hold({ d: true }, 12)]
        : r < L.aggression + 0.2 ? [hold({ b: true }, 12)] : [hold({ f: true }, 8)];
  } else {
    // Au contact : enchaînement court, projection ou coup bas.
    if (r < L.aggression * L.combo) {
      mem.plan = [hold({ btn: ["lp"] }, 1), hold({}, 6), hold({ btn: ["lp"] }, 1), hold({}, 6), ...(rng() < 0.5 ? QCF("lp") : [hold({ btn: ["hp"] }, 1)])];
    } else if (r < L.aggression) {
      mem.plan = rng() < 0.4 ? [hold({ f: true, btn: ["hp"] }, 1)] : [hold({ d: true, btn: ["lk"] }, 1), hold({ d: true }, 6), hold({ d: true, btn: ["hk"] }, 1), hold({ d: true }, 8)];
    } else {
      mem.plan = [hold({ b: true }, 10)];
    }
  }
  return run();
}
