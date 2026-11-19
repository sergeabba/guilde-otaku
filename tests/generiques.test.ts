import { dailyPair, GENERIQUES } from "../lib/generiques";

describe("génériques du jour (page Cinéma)", () => {
  it("le catalogue ne contient que des vidéos uniques, avec des openings et des endings", () => {
    expect(GENERIQUES.length).toBeGreaterThan(150);
    expect(new Set(GENERIQUES.map((g) => g.key)).size).toBe(GENERIQUES.length);
    expect(GENERIQUES.some((g) => g.kind === "ED")).toBe(true);
    expect(GENERIQUES.every((g) => /^[\w-]{11}$/.test(g.key))).toBe(true);
  });
  it("aucune écriture japonaise à l'écran (titres, libellés, chaînes)", () => {
    const ja = /[぀-ヿ㐀-鿿]/;
    expect(GENERIQUES.filter((g) => [g.series, g.label, g.channel].some((t) => t && ja.test(t)))).toEqual([]);
  });
  it("un opening et un ending par jour, de séries différentes, stables et changeants", () => {
    const a = dailyPair(GENERIQUES, "2026-11-19"), b = dailyPair(GENERIQUES, "2026-11-19"), c = dailyPair(GENERIQUES, "2026-11-20");
    expect(a).toEqual(b);
    expect(GENERIQUES[a.op].kind).toBe("OP");
    expect(GENERIQUES[a.ed].kind).toBe("ED");
    expect(GENERIQUES[a.op].tmdb).not.toBe(GENERIQUES[a.ed].tmdb);
    expect(c.op).not.toBe(a.op);
    const week = ["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25"].map((d) => GENERIQUES[dailyPair(GENERIQUES, d).op].key);
    expect(new Set(week).size).toBe(7);
  });
});
