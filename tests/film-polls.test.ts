import { isOpen, pollSlug, tally, timeLeft } from "../lib/film-poll-logic";

describe("votes de films", () => {
  const films = [{ tmdb: 1 }, { tmdb: 2 }, { tmdb: 3 }];
  it("calcule des pourcentages entiers qui font 100", () => {
    const t = tally(films, [{ choice: 1 }, { choice: 2 }, { choice: 3 }]);
    expect(Object.values(t.pct).reduce((a, b) => a + b, 0)).toBe(100);
    expect(t.total).toBe(3);
    const u = tally(films, [{ choice: 1 }, { choice: 1 }, { choice: 2 }, { choice: 99 }]);
    expect(u).toMatchObject({ total: 3, counts: { 1: 2, 2: 1, 3: 0 }, pct: { 1: 67, 2: 33, 3: 0 }, leaders: [1] });
  });
  it("aucun vote : 0 % partout, pas de gagnant ; égalité : deux en tête", () => {
    expect(tally(films, [])).toMatchObject({ total: 0, leaders: [], pct: { 1: 0, 2: 0, 3: 0 } });
    expect(tally(films, [{ choice: 1 }, { choice: 2 }]).leaders).toEqual([1, 2]);
  });
  it("ouvert entre le début et la fin seulement", () => {
    const p = { starts_at: "2026-11-20T10:00:00Z", ends_at: "2026-11-22T10:00:00Z" };
    expect(isOpen(p, Date.parse("2026-11-20T09:59:00Z"))).toBe(false);
    expect(isOpen(p, Date.parse("2026-11-21T00:00:00Z"))).toBe(true);
    expect(isOpen(p, Date.parse("2026-11-22T10:00:00Z"))).toBe(false);
  });
  it("affiche le temps restant et une adresse lisible", () => {
    expect(timeLeft(26 * 3_600_000)).toBe("1 j 2 h");
    expect(timeLeft(65 * 60_000)).toBe("1 h 05 min");
    expect(timeLeft(0)).toBe("terminé");
    expect(pollSlug("Le film de la semaine !", new Date("2026-11-20T12:00:00Z"))).toBe("le-film-de-la-semaine-20-novembre");
    expect(pollSlug("Été", new Date("2026-08-01T12:00:00Z"), "ab12")).toBe("ete-1-aout-ab12");
  });
});
