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

  it("nettoie extras avec le validateur du profil", () => {
    const r = parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values: { extras: {
      music: [{ provider: "youtube", id: "dQw4w9WgXcQ", title: "OK" }, { provider: "youtube", id: "bad" }],
      favoriteAnime: [{ source: "manual", kind: "ANIME", titleRomaji: "進撃の巨人" }],
      photoFocus: { x: 140, y: -5 },
      hack: "x",
    } } });
    expect(r).toEqual({ table: "fighters", op: "update", id: 4, values: { extras: {
      music: [{ provider: "youtube", id: "dQw4w9WgXcQ", title: "OK" }],
      photoFocus: { x: 100, y: 0 },
    } } });
    expect(parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values: { extras: "n'importe quoi" } }))
      .toEqual({ table: "fighters", op: "update", id: 4, values: { extras: {} } });
  });

  it("contrôle les champs d'un membre", () => {
    const up = (values: Record<string, unknown>) => parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values });
    expect(up({ name: "  " })).toEqual({ error: "nom obligatoire (80 caractères max)" });
    expect(up({ rank: "Empereur" })).toEqual({ error: "grade inconnu" });
    expect(up({ color: "red" })).toEqual({ error: "couleur invalide (format #RRGGBB)" });
    expect(up({ photo: "javascript:alert(1)" })).toHaveProperty("error");
    expect(up({ photo: "http://exemple.fr/a.jpg" })).toHaveProperty("error");
    expect(up({ photo: "https://x.supabase.co/storage/v1/object/public/a.jpg", animechar: "/anime/a.jpg", rank: "Monarque", color: "#FFD700" }))
      .not.toHaveProperty("error");
  });

  it("refuse une colonne non listée (ex. id)", () => {
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

import { mergeExtras } from "../lib/admin-db";

describe("mergeExtras", () => {
  const stored = {
    ancienChamp: { libre: true },
    music: "format ancien illisible",
    favoriteAnime: [{ source: "manual", kind: "ANIME", titleRomaji: "Ancien" }],
    awards: [{ title: "A retirer" }],
  };

  it("ne touche qu'aux rubriques envoyées et conserve tout le reste", () => {
    expect(mergeExtras(stored, { favoriteAnime: [{ titleRomaji: "Nouveau" }], awards: null })).toEqual({
      ancienChamp: { libre: true },
      music: "format ancien illisible",
      favoriteAnime: [{ titleRomaji: "Nouveau" }],
    });
    expect(mergeExtras(stored, {})).toEqual(stored);
  });

  it("part d'un objet vide si la valeur stockée n'est pas un objet", () => {
    expect(mergeExtras(null, { awards: [{ title: "MVP" }], music: null })).toEqual({ awards: [{ title: "MVP" }] });
    expect(mergeExtras([1, 2], {})).toEqual({});
  });

  it("la validation garde les retraits (null) et nettoie le reste", () => {
    const r = parseAdminDbRequest({ table: "fighters", op: "update", id: 4, values: { extras: { awards: null, music: [{ provider: "youtube", id: "dQw4w9WgXcQ" }], pirate: 1 } } });
    expect(r).toEqual({ table: "fighters", op: "update", id: 4, values: { extras: { music: [{ provider: "youtube", id: "dQw4w9WgXcQ" }], awards: null } } });
  });
});
