// Familles visuelles des pouvoirs : déduites du texte réel, chaque pouvoir en a au moins une.
import { familiesOf } from "../lib/power-scene";
import { POUVOIRS } from "../data/pouvoirs";

describe("scènes de pouvoir", () => {
  it("la forêt du paresseux est végétale et ralentie", () => {
    const f = familiesOf("Namakemono no Mori La forêt du paresseux Une forêt où tout ralentit. Du haut de son mètre quatre-vingt-quinze, il gagne sans bouger du hamac.");
    expect(f).toContain("vegetation");
    expect(f).toContain("temps");
  });
  it("feu, glace et foudre ne se confondent pas", () => {
    expect(familiesOf("Un poing de feu, une flamme")[0]).toBe("feu");
    expect(familiesOf("Des lames de glace, un labyrinthe gelé")[0]).toBe("glace");
    expect(familiesOf("Un orage, la foudre qui disparaît")).toContain("foudre");
  });
  it("chaque pouvoir de la Guilde a une famille", () => {
    const counts: Record<string, number> = {};
    for (const p of Object.values(POUVOIRS)) for (const k of ["bankai", "domaine"] as const) {
      const f = familiesOf(`${p[k].nom} ${p[k].sens} ${p[k].effet}`);
      expect(f.length).toBeGreaterThan(0);
      counts[f[0]] = (counts[f[0]] ?? 0) + 1;
    }
    // Diversité : au moins dix familles différentes en tête.
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(10);
  });
});
