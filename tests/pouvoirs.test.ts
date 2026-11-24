import { POUVOIRS } from "../data/pouvoirs";

describe("bankai et extensions du territoire", () => {
  const all = Object.values(POUVOIRS);
  it("chaque membre a un bankai et un territoire complets", () => {
    expect(all.length).toBeGreaterThanOrEqual(49);
    for (const p of all) for (const x of [p.bankai, p.domaine]) {
      expect(x.nom.trim()).not.toBe(""); expect(x.sens.trim()).not.toBe(""); expect(x.effet.length).toBeGreaterThan(20);
    }
  });
  it("noms en rōmaji uniquement, tous différents", () => {
    const noms = all.flatMap((p) => [p.bankai.nom, p.domaine.nom]);
    for (const n of noms) expect(n).not.toMatch(/[぀-ヿ一-鿿]/);
    expect(new Set(noms).size).toBe(noms.length);
  });
});
