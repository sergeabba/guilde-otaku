import { FORMATIONS, slotsOf, teamPower, teamSlug, validateTeam } from "../lib/teams-logic";

const known = new Set([1, 2, 3, 4, 5, 6]);

describe("formations", () => {
  it("cinq postes au basket, onze au foot, identifiants uniques", () => {
    for (const [sport, list] of Object.entries(FORMATIONS)) for (const [name, defs] of Object.entries(list)) {
      expect(defs.length).toBe(sport === "basket" ? 5 : 11);
      expect(new Set(defs.map((d) => d.id)).size).toBe(defs.length);
      for (const d of defs) { expect(d.x).toBeGreaterThanOrEqual(0); expect(d.y).toBeLessThanOrEqual(100); }
      expect(name).toBeTruthy();
    }
  });
  it("formation inconnue : formation par défaut", () => {
    expect(slotsOf("foot", "9-0-1").length).toBe(11);
  });
});

describe("validateTeam", () => {
  const base = { name: "Les Monarques", sport: "basket", formation: "5 majeur" };
  it("garde les postes valides et ignore les postes vides", () => {
    const r = validateTeam({ ...base, slots: [{ slot: "PG", memberId: 1, number: 9, captain: true }, { slot: "C", memberId: "" }, { slot: "XX", memberId: 2 }], published: true }, known);
    expect("row" in r && r.row.slots).toEqual([{ slot: "PG", memberId: 1, number: 9, captain: true }]);
    expect("row" in r && r.row.published).toBe(true);
  });
  it("refuse un membre sur deux postes, deux capitaines, un numéro en double, un membre inconnu", () => {
    expect(validateTeam({ ...base, slots: [{ slot: "PG", memberId: 1 }, { slot: "SG", memberId: 1 }] }, known)).toHaveProperty("error");
    expect(validateTeam({ ...base, slots: [{ slot: "PG", memberId: 1, captain: true }, { slot: "SG", memberId: 2, captain: true }] }, known)).toHaveProperty("error");
    expect(validateTeam({ ...base, slots: [{ slot: "PG", memberId: 1, number: 7 }, { slot: "SG", memberId: 2, number: 7 }] }, known)).toHaveProperty("error");
    expect(validateTeam({ ...base, slots: [{ slot: "PG", memberId: 99 }] }, known)).toHaveProperty("error");
  });
  it("refuse un nom vide, en écriture japonaise, ou un sport inconnu", () => {
    expect(validateTeam({ ...base, name: " " }, known)).toHaveProperty("error");
    expect(validateTeam({ ...base, name: "帝光" }, known)).toHaveProperty("error");
    expect(validateTeam({ ...base, sport: "rugby" }, known)).toHaveProperty("error");
  });
});

describe("outils", () => {
  it("adresse lisible", () => { expect(teamSlug("L'Équipe des Rois !")).toBe("l-equipe-des-rois"); });
  it("puissance = moyenne des stats renseignées", () => {
    expect(teamPower([{ force: 80, vitesse: 60, technique: 100 }, null])).toBe(80);
    expect(teamPower([null])).toBeNull();
  });
});
