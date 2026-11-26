// Archétypes : déduits des vraies statistiques, et sans casser l'équilibrage des coups.
import { ARCHETYPES, applyArchetype, archetypeOf } from "../lib/fighters/archetypes";
import { characterFor, type MoveDef } from "../lib/fighters/characters";
import { createMatch, step, NO_INPUT } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory } from "../lib/fighters/ai";

const onBlock = (m: MoveDef) => m.blockstun - (m.active - 1 + m.recovery);

describe("archétypes de combat", () => {
  it("se déduisent des statistiques de la fiche", () => {
    expect(archetypeOf(null)).toBe("polyvalent");
    expect(archetypeOf({ force: 60, vitesse: 95, technique: 70 })).toBe("speedster");
    expect(archetypeOf({ force: 95, vitesse: 60, technique: 70 })).toBe("grappler");
    expect(archetypeOf({ force: 90, vitesse: 88, technique: 70 })).toBe("rushdown");
    expect(archetypeOf({ force: 60, vitesse: 70, technique: 95 })).toBe("zoner");
    expect(archetypeOf({ force: 70, vitesse: 90, technique: 92 })).toBe("contre");
    expect(archetypeOf({ force: 78, vitesse: 80, technique: 76 })).toBe("shoto");
  });
  it("ne change jamais l'avantage en garde ni la durée des coups", () => {
    const base = characterFor(4);
    for (const a of Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[]) {
      const c = applyArchetype(base, a);
      for (const k of Object.keys(base.normals) as (keyof typeof base.normals)[]) {
        expect(onBlock(c.normals[k])).toBe(onBlock(base.normals[k]));
        expect(c.normals[k].startup).toBe(base.normals[k].startup);
        expect(c.normals[k].damage).toBeLessThanOrEqual(Math.ceil(base.normals[k].damage * 1.25));
      }
    }
  });
  it("chaque niveau d'IA finit un combat contre chaque style, sans tricher", () => {
    const P = (id: number, st: { force: number; vitesse: number; technique: number }) => ({ id, name: `m${id}`, stats: st, specialName: "Onde de la Guilde" });
    for (const level of ["facile", "normal", "difficile"] as const) {
      let s = createMatch("duel", [P(4, { force: 95, vitesse: 60, technique: 70 })], [P(5, { force: 60, vitesse: 70, technique: 95 })]);
      const m0 = newAiMemory(), m1 = newAiMemory(), rng = makeRng(7);
      for (let i = 0; i < 60 * 240 && s.phase !== "matchEnd"; i++) s = step(s, aiInput(s, 0, m0, rng, level), aiInput(s, 1, m1, rng, level));
      expect(s.phase).toBe("matchEnd");
    }
    expect(NO_INPUT).toBeDefined();
  });
});

import { SIGNATURES } from "../lib/fighters/archetypes";
describe("techniques signature", () => {
  it("chaque style (sauf polyvalent) en a une, punissable en garde quand elle n'est pas une prise", () => {
    for (const [a, sp] of Object.entries(SIGNATURES)) {
      expect(sp).toBeDefined();
      if (sp!.move.guard !== "throw" && !sp!.move.projectile) expect(onBlock(sp!.move)).toBeLessThan(-6);
      expect(applyArchetype(characterFor(4), a as keyof typeof ARCHETYPES).specials.some((s) => s.id === "sig")).toBe(true);
    }
    expect(applyArchetype(characterFor(4), "polyvalent").specials.some((s) => s.id === "sig")).toBe(false);
  });
});
