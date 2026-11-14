import { searchTmdbAnime, tmdbDetail } from "../lib/works/tmdb";
import { searchMangadex, mangadexCover } from "../lib/works/mangadex";
import { candidateToFavorite } from "../lib/works/favorite";
import { frenchLevel } from "../lib/works/types";
import { parseMemberExtras, sameWork, workTitle, type FavoriteWork } from "../lib/member-extras";

const json = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe("recherche TMDB (anime en français)", () => {
  const OLD = process.env;
  beforeEach(() => { process.env = { ...OLD, TMDB_API_KEY: "cle-v3-test" }; });
  afterEach(() => { process.env = OLD; jest.restoreAllMocks(); });

  it("garde l'animation, sépare séries et films, n'affiche jamais de titre japonais et ne remplit pas un synopsis absent", async () => {
    const calls: string[] = [];
    jest.spyOn(global, "fetch").mockImplementation((u) => {
      const url = String(u); calls.push(url);
      if (url.includes("/search/tv")) return json({ results: [
        { id: 1, name: "Frieren", original_name: "葬送のフリーレン", overview: "L'elfe Frieren…", genre_ids: [16], original_language: "ja", first_air_date: "2023-09-29", poster_path: "/a.jpg" },
        { id: 2, name: "Série live", original_name: "Live", overview: "", genre_ids: [18], original_language: "en" },
        { id: 3, name: "葬送", original_name: "葬送", overview: "", genre_ids: [16], original_language: "ja" },
      ] });
      return json({ results: [{ id: 9, title: "Frieren, le film", original_title: "Frieren Movie", overview: "", genre_ids: [16], original_language: "ja", release_date: "2026-01-01" }] });
    });
    const r = await searchTmdbAnime("Frieren");
    expect(calls.every((c) => c.includes("language=fr-FR") && c.includes("api_key=cle-v3-test"))).toBe(true);
    expect(r.map((c) => c.sourceId)).toEqual(["tv:1", "movie:9"]);
    expect(r[0]).toMatchObject({ format: "SERIE", year: 2023, synopsisFr: "L'elfe Frieren…", coverUrl: "https://image.tmdb.org/t/p/w500/a.jpg" });
    expect(r[1].format).toBe("FILM");
    expect(r[1].synopsisFr).toBeUndefined();
    expect(r.some((c) => /[ぁ-んァ-ン一-龯]/.test(c.title))).toBe(false);
  });

  it("détail : titre français seulement s'il existe une traduction française, bande-annonce française d'abord", async () => {
    jest.spyOn(global, "fetch").mockImplementation(() => json({
      id: 1, name: "Frieren", original_name: "葬送のフリーレン", overview: "Synopsis FR", genre_ids: [16], first_air_date: "2023-09-29",
      genres: [{ name: "Animation" }], number_of_seasons: 1, number_of_episodes: 38,
      videos: { results: [{ key: "AAAAAAAAAAA", site: "YouTube", type: "Trailer", iso_639_1: "en" }, { key: "BBBBBBBBBBB", site: "YouTube", type: "Trailer", iso_639_1: "fr" }] },
      translations: { translations: [{ iso_639_1: "fr", iso_3166_1: "FR", data: { name: "Frieren", overview: "Synopsis FR" } }, { iso_639_1: "en", iso_3166_1: "US", data: { overview: "English" } }] },
    }));
    const d = await tmdbDetail("tv:1");
    expect(d.titleFr).toBe("Frieren");
    expect(d.trailer).toEqual({ youtubeId: "BBBBBBBBBBB", lang: "fr", name: undefined });
    expect(d.synopsisEn).toBe("English");
    expect(d).toMatchObject({ seasons: 1, episodes: 38 });
  });

  it("refuse un identifiant TMDB invalide et signale une clé absente", async () => {
    await expect(tmdbDetail("tv:abc")).rejects.toThrow("invalide");
    delete process.env.TMDB_API_KEY;
    await expect(searchTmdbAnime("x")).rejects.toThrow("Clé TMDB absente");
  });
});

describe("recherche MangaDex (mangas)", () => {
  afterEach(() => jest.restoreAllMocks());
  it("exclut les doujinshi, envoie un User-Agent, passe les couvertures par le proxy et marque le titre français alternatif comme à vérifier", async () => {
    let init: RequestInit | undefined; let url = "";
    jest.spyOn(global, "fetch").mockImplementation((u, i) => {
      url = String(u); init = i;
      return json({ data: [{
        id: "6e5ddee5-eccb-48cc-b6bb-43488cc9791f",
        attributes: { title: { en: "Vagabond" }, altTitles: [{ fr: "Avare" }, { ja: "バガボンド" }, { "ja-ro": "Vagabond" }], description: { en: "Musashi…" }, year: 1999, originalLanguage: "ja", links: { al: "30656" } },
        relationships: [{ type: "cover_art", attributes: { fileName: "e14c.jpg" } }],
      }] });
    });
    const [c] = await searchMangadex("Vagabond");
    expect(url).toContain("excludedTags[]=b13b2a48");
    expect((init?.headers as Record<string, string>)["User-Agent"]).toMatch(/GuildeOtaku/);
    expect(c.title).toBe("Vagabond");
    expect(c).toMatchObject({ titleFr: "Avare", titleFrUnverified: true, synopsisFr: undefined, synopsisEn: "Musashi…", anilistId: 30656, format: "MANGA" });
    expect(c.coverUrl).toBe("/api/works/cover?md=6e5ddee5-eccb-48cc-b6bb-43488cc9791f/e14c.jpg");
    expect(frenchLevel(c)).toBe("aucun");
  });
  it("refuse un nom de fichier de couverture suspect", () => {
    expect(mangadexCover("6e5ddee5-eccb-48cc-b6bb-43488cc9791f", "../../x.jpg")).toBeUndefined();
  });
});

describe("favoris : conversion et conservation", () => {
  const md = { source: "mangadex" as const, sourceId: "6e5ddee5-eccb-48cc-b6bb-43488cc9791f", kind: "MANGA" as const, format: "MANGA" as const, title: "Vagabond",
    titleFr: "Avare", titleFrUnverified: true, synopsisEn: "English", sourceUrl: "https://mangadex.org/title/x", anilistId: 30656, coverUrl: "/api/works/cover?md=6e5ddee5-eccb-48cc-b6bb-43488cc9791f/e14c.jpg" };

  it("n'applique pas un titre français non vérifié et n'enregistre jamais le résumé anglais", () => {
    const f = candidateToFavorite(md);
    expect(f.titleLocalized).toBe("Vagabond");
    expect(f.synopsis).toBeUndefined();
    expect(candidateToFavorite(md, { useUnverifiedFrTitle: true }).titleLocalized).toBe("Avare");
  });

  it("la validation garde les nouveaux champs et les anciens favoris AniList", () => {
    const fav = { ...candidateToFavorite({ ...md, titleFrUnverified: false, titleFr: "Vagabond", synopsisFr: "Musashi en français." }), trailer: { youtubeId: "BBBBBBBBBBB", lang: "fr" } };
    const old: FavoriteWork = { source: "anilist", sourceId: 30656, kind: "MANGA", titleRomaji: "Vagabond", synopsis: "Écrit à la main", synopsisSource: "manual" };
    const ex = parseMemberExtras({ favoriteManga: [old, fav, { source: "tmdb", sourceId: "tv:abc", kind: "MANGA", titleLocalized: "Mauvais id" }] });
    const [a, b, c] = ex!.favoriteManga!;
    expect(a).toMatchObject({ source: "anilist", sourceId: 30656, synopsis: "Écrit à la main", synopsisSource: "manual" });
    expect(b).toMatchObject({ source: "mangadex", coverUrl: md.coverUrl, synopsisSource: "source", anilistId: 30656, trailer: { youtubeId: "BBBBBBBBBBB", lang: "fr" } });
    expect(c.source).toBe("manual"); // identifiant invalide : gardé comme saisie manuelle
    expect(sameWork(a, b)).toBe(true); // même œuvre via l'identifiant AniList
    expect(workTitle(b)).toBe("Vagabond");
    // Ancienne saisie manuelle du même titre : doublon détecté.
    expect(sameWork({ source: "manual", kind: "MANGA", titleRomaji: "Vagabond" }, b)).toBe(true);
    expect(sameWork({ source: "manual", kind: "ANIME", titleRomaji: "Vagabond" }, b)).toBe(false);
  });
});

import { synopsisSection, trimSynopsis } from "../lib/works/fr-synopsis";
describe("synopsis français des mangas (Wikipédia)", () => {
  it("extrait la section Synopsis et s'arrête à la section suivante", () => {
    const ex = "Intro sur le manga.\n\n== Synopsis ==\n" + "Une histoire de sabre et de rivalité au Japon médiéval. ".repeat(3) + "\n\n=== Détail ===\nSuite.\n\n== Personnages ==\nNe doit pas apparaître.";
    const s = synopsisSection(ex)!;
    expect(s).toContain("Une histoire de sabre");
    expect(s).toContain("Suite.");
    expect(s).not.toContain("Ne doit pas");
  });
  it("ignore un article sans section synopsis", () => {
    expect(synopsisSection("Intro.\n\n== Historique ==\nPublication.")).toBeNull();
  });
  it("coupe à la fin d'une phrase", () => {
    const t = trimSynopsis("Première phrase assez longue pour compter. ".repeat(30), 120);
    expect(t.length).toBeLessThanOrEqual(120);
    expect(t.endsWith(".")).toBe(true);
  });
});

import { sameTitle } from "../lib/works/fr-synopsis";
describe("adaptation animée : titre exact exigé", () => {
  it("compare sans accents ni ponctuation", () => {
    expect(sameTitle("Vinland Saga", "VINLAND SAGA")).toBe(true);
    expect(sameTitle("Fullmetal Alchemist", "Fullmetal Alchemist: Brotherhood")).toBe(false);
    expect(sameTitle("Vagabond", "Rurouni Kenshin")).toBe(false);
  });
});
