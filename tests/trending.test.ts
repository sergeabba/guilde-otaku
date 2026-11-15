jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
jest.mock("../lib/airing", () => ({ frenchInfo: jest.fn() }));
jest.mock("../lib/works/fr-synopsis", () => ({ frenchMangaSynopsis: jest.fn(), trimSynopsis: (s: string) => s }));

import { startLabel, toItem } from "../lib/trending";
import { nextSeason, seasonOf } from "../lib/season";

describe("saisons", () => {
  it("place décembre dans l'hiver suivant", () => {
    expect(seasonOf(new Date("2026-12-10T12:00:00Z"))).toEqual({ season: "WINTER", year: 2027 });
    expect(seasonOf(new Date("2026-11-15T12:00:00Z"))).toEqual({ season: "FALL", year: 2026 });
    expect(nextSeason({ season: "FALL", year: 2026 })).toEqual({ season: "WINTER", year: 2027 });
  });
});

describe("tendances", () => {
  it("n'affiche que les parties connues de la date", () => {
    expect(startLabel({ year: 2026, month: 10, day: 4 })).toBe("4 octobre 2026");
    expect(startLabel({ year: 2027, month: 1 })).toBe("janvier 2027");
    expect(startLabel({ year: null })).toBeNull();
  });

  it("écarte titres japonais, contenus adultes et bandes-annonces non YouTube", () => {
    const base = { id: 1, type: "ANIME" as const, title: { romaji: "Sousou no Frieren", english: "Frieren" }, genres: ["Adventure", "Drama", "Fantasy", "Hentai"], format: "TV", status: "RELEASING", trailer: { id: "abcdefghijk", site: "youtube" } };
    const it = toItem(base, 1)!;
    expect(it.title).toBe("Sousou no Frieren");
    expect(it.titleAlt).toBe("Frieren");
    expect(it.genres).toEqual(["Aventure", "Drame", "Fantasy"]);
    expect([it.format, it.status, it.trailer]).toEqual(["Série", "En cours", "abcdefghijk"]);
    expect(toItem({ ...base, title: { romaji: "\u846c\u9001\u306e\u30d5\u30ea\u30fc\u30ec\u30f3" } }, 1)).toBeNull();
    expect(toItem({ ...base, isAdult: true }, 1)).toBeNull();
    expect(toItem({ ...base, trailer: { id: "x9", site: "dailymotion" } }, 1)!.trailer).toBeNull();
  });
});
