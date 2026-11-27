import { lineOf, lineRatings, FORMATIONS } from "../lib/teams-logic";

describe("lignes de jeu", () => {
  it("chaque poste de chaque formation a une ligne", () => {
    for (const sport of ["foot", "basket"] as const)
      for (const defs of Object.values(FORMATIONS[sport]))
        for (const d of defs) expect(lineOf(d.code)).not.toBeNull();
  });
  it("moyenne par ligne, rien sans titulaire noté", () => {
    const r = lineRatings("foot", [
      { code: "BU", stats: { force: 80, vitesse: 90, technique: 70 } },
      { code: "GB", stats: null },
    ]);
    expect(r).toEqual([{ line: "attaque", value: 80 }, { line: "milieu", value: null }, { line: "defense", value: null }]);
  });
});
