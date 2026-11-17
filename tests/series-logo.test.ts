import { parseMemberExtras } from "../lib/member-extras";
import { portraitSeries, seriesLogoSrc } from "../lib/series-logo";
import defaults from "../data/portrait-series.json";

describe("logo de la série du portrait anime", () => {
  it("valide la série saisie dans l'admin", () => {
    expect(parseMemberExtras({ animeSeries: { title: "Bleach", tmdb: "tv:30984" } })?.animeSeries).toEqual({ title: "Bleach", tmdb: "tv:30984" });
    expect(parseMemberExtras({ animeSeries: { title: "Bleach", tmdb: "30984" } })).toBeUndefined();
    expect(parseMemberExtras({ animeSeries: { title: "ブリーチ", tmdb: "tv:30984" } })).toBeUndefined();
  });
  it("la série choisie dans l'admin passe avant la liste par défaut", () => {
    expect(portraitSeries({ id: 1 })?.title).toBe("Gintama");
    expect(portraitSeries({ id: 1, extras: { animeSeries: { title: "Bleach", tmdb: "tv:30984" } } })?.tmdb).toBe("tv:30984");
    expect(seriesLogoSrc({ id: 999_999 })).toBeNull();
    expect(seriesLogoSrc({ id: 63 })).toBe("/api/series-logo?tmdb=tv:1429");
  });
  it("liste par défaut : identifiants TMDB valides, aucun titre en japonais", () => {
    for (const s of Object.values(defaults as Record<string, { title: string; tmdb: string }>)) {
      expect(s.tmdb).toMatch(/^(tv|movie):\d+$/);
      expect(s.title).not.toMatch(/[぀-ヿ一-鿿]/);
    }
  });
});
