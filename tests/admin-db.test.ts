import { parseAdminDbRequest, MAX_INSERT_ROWS } from "../lib/admin-db";

describe("parseAdminDbRequest", () => {
  it("accepte une mise à jour sur une colonne autorisée", () => {
    expect(parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values: { hidden: true } }))
      .toEqual({ table: "fighters", op: "update", id: 4, values: { hidden: true } });
  });

  it("refuse une table hors liste", () => {
    expect(parseAdminDbRequest({ table: "auth.users", op: "delete", id: 1 })).toEqual({ error: "table non autorisée" });
    expect(parseAdminDbRequest({ table: "__proto__", op: "delete", id: 1 })).toEqual({ error: "table non autorisée" });
  });

  it("refuse une colonne non listée (ex. extras avant la migration, id)", () => {
    expect(parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values: { extras: {} } }))
      .toEqual({ error: "colonne non autorisée : extras" });
    expect(parseAdminDbRequest({ table: "bons_plans", op: "insert", rows: [{ id: 9, title: "x" }] }))
      .toEqual({ error: "colonne non autorisée : id" });
  });

  it("refuse un identifiant invalide ou absent", () => {
    for (const id of [0, -1, 1.5, "1; drop table", "", null, undefined, {}]) {
      expect(parseAdminDbRequest({ table: "fighters", op: "delete", id })).toEqual({ error: "identifiant invalide" });
    }
  });

  it("refuse une opération inconnue et un corps vide", () => {
    expect(parseAdminDbRequest({ table: "fighters", op: "upsert", id: 1 })).toEqual({ error: "opération non autorisée" });
    expect(parseAdminDbRequest(null)).toEqual({ error: "requête invalide" });
    expect(parseAdminDbRequest({ table: "fighters", op: "update", id: 1, values: {} })).toEqual({ error: "aucune valeur à enregistrer" });
  });

  it("borne le nombre de lignes insérées", () => {
    expect(parseAdminDbRequest({ table: "bons_plans", op: "insert", rows: [] })).toHaveProperty("error");
    const many = Array.from({ length: MAX_INSERT_ROWS + 1 }, () => ({ title: "x" }));
    expect(parseAdminDbRequest({ table: "bons_plans", op: "insert", rows: many })).toHaveProperty("error");
  });

  it("retire les valeurs undefined sans toucher aux null", () => {
    expect(parseAdminDbRequest({ table: "bibliotheque", op: "insert", rows: [{ title: "A", avis_guilde: null, year: undefined }] }))
      .toEqual({ table: "bibliotheque", op: "insert", rows: [{ title: "A", avis_guilde: null }] });
  });
});
