// Équilibrage des données de combat, d'après le guide du genre « jeu de combat »
// (Claude Code Game Studios, chipset fighting) : un coup léger sort vite, un lourd
// engage et laisse ouvert s'il est paré ; rien n'est trop avantageux en garde.
import { COMMON_NORMALS, CRAIG, MELRICK, characterFor, type MoveDef } from "../lib/fighters/characters";
import { padInput } from "../lib/fighters/gamepad";

/** Avantage en garde (images) : blocage subi par l'adversaire moins ce qui reste du coup. */
const onBlock = (m: MoveDef) => m.blockstun - (m.active - 1 + m.recovery);
const LIGHT = ["s_lp", "s_lk", "c_lp", "c_lk"] as const;
const HEAVY = ["s_hp", "s_hk", "c_hp", "c_hk"] as const;

describe("équilibrage des coups", () => {
  it("les légers sortent plus vite que les lourds et font moins mal", () => {
    const maxLight = Math.max(...LIGHT.map((k) => COMMON_NORMALS[k].startup));
    const minHeavy = Math.min(...HEAVY.map((k) => COMMON_NORMALS[k].startup));
    expect(maxLight).toBeLessThan(minHeavy);
    expect(Math.max(...LIGHT.map((k) => COMMON_NORMALS[k].damage))).toBeLessThan(Math.min(...HEAVY.map((k) => COMMON_NORMALS[k].damage)));
  });
  it("aucun coup au sol n'est avantageux en garde ; un lourd paré laisse ouvert", () => {
    for (const k of [...LIGHT, ...HEAVY]) expect(onBlock(COMMON_NORMALS[k])).toBeLessThanOrEqual(0);
    for (const k of HEAVY) expect(onBlock(COMMON_NORMALS[k])).toBeLessThanOrEqual(-4);
  });
  it("spéciales et super de contact punissables en garde, pour chaque personnage", () => {
    for (const c of [CRAIG, MELRICK, characterFor(4), characterFor(999)]) {
      for (const sp of [...c.specials, c.superMove]) {
        if (sp.move.projectile) continue; // projectile : jugé à distance
        expect(onBlock(sp.move)).toBeLessThan(-6);
      }
    }
  });
  it("une projection est rapide, courte et laisse vulnérable si elle rate", () => {
    const t = COMMON_NORMALS.throw;
    expect(t.startup).toBeLessThanOrEqual(3);
    expect(t.recovery).toBeGreaterThanOrEqual(20);
  });
});

describe("manette", () => {
  const pad = (pressed: number[], axes = [0, 0]) => ({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })), axes });
  it("boutons standard vers les coups", () => {
    expect(padInput(pad([2, 1, 5]))).toMatchObject({ lp: true, hk: true, special: true, hp: false });
  });
  it("stick et croix vers les directions, zone morte au centre", () => {
    expect(padInput(pad([], [-0.9, 0.8]))).toMatchObject({ left: true, down: true, right: false, up: false });
    expect(padInput(pad([], [0.3, -0.3]))).toMatchObject({ left: false, right: false, up: false, down: false });
    expect(padInput(pad([12, 15]))).toMatchObject({ up: true, right: true });
  });
});

// Test de jeu automatisé (smoke check du guide) : un combat entier joué par le moteur.
import { createMatch, step, NO_INPUT, MAX_HP, type FighterProfile, type MatchState } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory } from "../lib/fighters/ai";

const P = (id: number, name: string): FighterProfile => ({ id, name, stats: { force: 70, vitesse: 70, technique: 70 }, specialName: "Onde" });
function cpuVsCpu(seed: number, frames = 60 * 200): MatchState {
  const s = createMatch("duel", [P(1, "Craig")], [P(56, "Melrick")]);
  const rng = makeRng(seed), m0 = newAiMemory(), m1 = newAiMemory();
  for (let i = 0; i < frames && s.phase !== "matchEnd"; i++) step(s, aiInput(s, 0, m0, rng, "difficile"), aiInput(s, 1, m1, rng, "difficile"));
  return s;
}

describe("test de jeu automatisé", () => {
  it("un combat IA contre IA va jusqu'au bout, et la même graine donne le même résultat", () => {
    const a = cpuVsCpu(42), b = cpuVsCpu(42);
    expect(a.phase).toBe("matchEnd");
    expect(a.winner).toBe(b.winner);
    expect(a.frame).toBe(b.frame);
  });
  it("une manette qui avance et frappe fait perdre de la vie à l'adversaire", () => {
    const s = createMatch("duel", [P(1, "Craig")], [P(56, "Melrick")]);
    const pad = (pressed: number[], axes = [0, 0]) => ({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })), axes });
    for (let i = 0; i < 60 * 12; i++) {
      if (s.phase !== "fight") { step(s, NO_INPUT, NO_INPUT); continue; }
      // stick vers l'adversaire ; au contact, poing léger une image sur six
      const gap = Math.abs(s.fighters[1].x - s.fighters[0].x), toward = s.fighters[0].x < s.fighters[1].x ? 1 : -1;
      step(s, padInput(gap > 46 ? pad([], [toward, 0]) : pad(i % 6 === 0 ? [2] : [])), NO_INPUT);
    }
    expect(s.fighters[1].hp).toBeLessThan(MAX_HP);
  });
});
