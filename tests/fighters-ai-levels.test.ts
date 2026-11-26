// Les niveaux d'IA doivent être réellement distincts : à personnages identiques, le niveau
// « difficile » bat nettement le niveau « facile » (sans dégâts ni avantages cachés).
import { createMatch, step } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory, type AiLevel } from "../lib/fighters/ai";

function duel(a: AiLevel, b: AiLevel, seed: number) {
  const P = (id: number) => ({ id, name: `m${id}`, stats: { force: 75, vitesse: 75, technique: 75 }, specialName: "Onde de la Guilde" });
  let s = createMatch("duel", [P(4)], [P(5)], { seed } as never);
  const m0 = newAiMemory(), m1 = newAiMemory(), r0 = makeRng(seed), r1 = makeRng(seed * 7 + 1);
  for (let i = 0; i < 60 * 300 && s.phase !== "matchEnd"; i++) s = step(s, aiInput(s, 0, m0, r0, a), aiInput(s, 1, m1, r1, b));
  return s.winner;
}

describe("niveaux de l'IA", () => {
  it("difficile gagne la majorité des duels contre facile", () => {
    let wins = 0; const N = 12;
    for (let k = 1; k <= N; k++) {
      // Alternance des côtés pour neutraliser l'avantage de position.
      if (k % 2) { if (duel("difficile", "facile", k) === 0) wins++; }
      else if (duel("facile", "difficile", k) === 1) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(9);
  });
});
