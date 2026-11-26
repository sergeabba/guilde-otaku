// Équilibre entre styles : chaque style affronte chaque autre (IA « normal » des deux côtés,
// côtés alternés, plusieurs graines). Aucun style ne doit écraser l'ensemble du plateau.
// Ce test ne remplace pas des parties jouées : il détecte seulement un déséquilibre grossier.
import { createMatch, step } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory } from "../lib/fighters/ai";
import { ARCHETYPES, archetypeOf, type Archetype } from "../lib/fighters/archetypes";

const STATS: Record<Archetype, { force: number; vitesse: number; technique: number }> = {
  rushdown: { force: 90, vitesse: 88, technique: 70 }, zoner: { force: 60, vitesse: 70, technique: 95 },
  grappler: { force: 95, vitesse: 60, technique: 70 }, shoto: { force: 78, vitesse: 80, technique: 76 },
  speedster: { force: 60, vitesse: 95, technique: 70 }, contre: { force: 70, vitesse: 90, technique: 92 },
  technique: { force: 74, vitesse: 76, technique: 84 }, polyvalent: { force: 0, vitesse: 0, technique: 0 },
};

function duel(a: Archetype, b: Archetype, seed: number) {
  const P = (id: number, st: (typeof STATS)[Archetype]) => ({ id, name: `m${id}`, stats: st, specialName: "Onde de la Guilde" });
  let s = createMatch("duel", [P(4, STATS[a])], [P(5, STATS[b])]);
  const m0 = newAiMemory(), m1 = newAiMemory(), r0 = makeRng(seed), r1 = makeRng(seed * 13 + 3);
  for (let i = 0; i < 60 * 300 && s.phase !== "matchEnd"; i++) s = step(s, aiInput(s, 0, m0, r0, "normal"), aiInput(s, 1, m1, r1, "normal"));
  return s.winner;
}

describe("équilibre entre styles", () => {
  it("les statistiques de référence donnent bien chaque style", () => {
    for (const a of Object.keys(STATS) as Archetype[]) expect(archetypeOf(STATS[a])).toBe(a);
  });
  it("aucun style ne gagne plus de 75 % ni moins de 25 % de ses duels", () => {
    const styles = Object.keys(ARCHETYPES) as Archetype[];
    const wins: Record<string, number> = {}, games: Record<string, number> = {};
    for (const a of styles) for (const b of styles) if (a < b) for (let k = 1; k <= 6; k++) {
      const [x, y] = k % 2 ? [a, b] : [b, a];
      const w = duel(x, y, k * 17);
      games[a] = (games[a] ?? 0) + 1; games[b] = (games[b] ?? 0) + 1;
      if (w === 0) wins[x] = (wins[x] ?? 0) + 1; else if (w === 1) wins[y] = (wins[y] ?? 0) + 1;
    }
    const rates = Object.fromEntries(styles.map((s) => [s, Math.round(((wins[s] ?? 0) / games[s]) * 100)]));
    console.log("taux de victoire par style (%)", rates);
    for (const s of styles) { expect(rates[s]).toBeLessThanOrEqual(75); expect(rates[s]).toBeGreaterThanOrEqual(25); }
  }, 120000);
});
