import { featuredWorks, hasJapanese, objectPosition, parseMemberExtras, workSubtitle, workTitle } from "../lib/member-extras";
import { shareVersion } from "../lib/share";

const base = { source: "anilist", sourceId: 30642, kind: "MANGA", titleRomaji: "Vinland Saga", coverUrl: "https://s4.anilist.co/file/x.jpg" };

describe("parseMemberExtras", () => {
  test("absent ou invalide : aucun extra", () => {
    expect(parseMemberExtras(null)).toBeUndefined();
    expect(parseMemberExtras("pas du json")).toBeUndefined();
    expect(parseMemberExtras([])).toBeUndefined();
    expect(parseMemberExtras({})).toBeUndefined();
  });

  test("accepte une chaîne JSON (colonne texte)", () => {
    const e = parseMemberExtras(JSON.stringify({ favoriteManga: [base] }));
    expect(e?.favoriteManga?.[0].titleRomaji).toBe("Vinland Saga");
  });

  test("le titre natif est conservé mais les textes affichés en japonais sont rejetés", () => {
    const e = parseMemberExtras({
      favoriteAnime: [
        { ...base, kind: "ANIME", titleNative: "ヴィンランド・サガ" },
        { source: "manual", titleRomaji: "進撃の巨人" },
      ],
      displayNameRomaji: "ドン",
    });
    expect(e?.favoriteAnime).toHaveLength(1);
    expect(e?.favoriteAnime?.[0].titleNative).toBe("ヴィンランド・サガ");
    expect(e?.displayNameRomaji).toBeUndefined();
  });

  test("le type vient de la liste, pas de la donnée", () => {
    const e = parseMemberExtras({ favoriteAnime: [{ ...base, kind: "MANGA" }] });
    expect(e?.favoriteAnime?.[0].kind).toBe("ANIME");
  });

  test("dédoublonne par identifiant de source et trie par rang", () => {
    const e = parseMemberExtras({
      favoriteManga: [
        { ...base, rank: 2 },
        { ...base, rank: 1 },
        { source: "manual", titleLocalized: "Monster", rank: 1 },
      ],
    });
    expect(e?.favoriteManga?.map((w) => workTitle(w))).toEqual(["Monster", "Vinland Saga"]);
  });

  test("n'accepte que des jaquettes HTTPS sur des hôtes connus", () => {
    const e = parseMemberExtras({
      favoriteManga: [
        { ...base, coverUrl: "http://s4.anilist.co/x.jpg" },
        { ...base, sourceId: 2, coverUrl: "https://evil.example/x.jpg" },
        { ...base, sourceId: 3, coverUrl: "https://abc.supabase.co/storage/v1/object/public/x.jpg", sourceUrl: "javascript:alert(1)" },
      ],
    });
    expect(e?.favoriteManga?.map((w) => w.coverUrl)).toEqual([undefined, undefined, "https://abc.supabase.co/storage/v1/object/public/x.jpg"]);
    expect(e?.favoriteManga?.[2].sourceUrl).toBeUndefined();
  });

  test("musique : identifiants YouTube valides uniquement", () => {
    const e = parseMemberExtras({ music: [{ provider: "youtube", id: "1ac3_YdSSy0" }, { provider: "youtube", id: "<script>" }, { provider: "spotify", id: "abc" }] });
    expect(e?.music).toEqual([{ provider: "youtube", id: "1ac3_YdSSy0", title: undefined }]);
  });

  test("points focaux bornés entre 0 et 100", () => {
    const e = parseMemberExtras({ photoFocus: { x: 140, y: -5 }, animeFocus: { x: "50", y: 10 } });
    expect(e?.photoFocus).toEqual({ x: 100, y: 0 });
    expect(e?.animeFocus).toBeUndefined();
    expect(objectPosition(e?.photoFocus)).toBe("100% 0%");
    expect(objectPosition(undefined, "50% 20%")).toBe("50% 20%");
  });
});

describe("affichage des favoris", () => {
  test("coups de cœur : marqués en priorité, trois au plus", () => {
    const list = parseMemberExtras({
      favoriteAnime: [1, 2, 3, 4, 5].map((n) => ({ source: "manual", titleLocalized: `T${n}`, featured: n === 5 })),
    })!.favoriteAnime!;
    expect(featuredWorks(list).map(workTitle)).toEqual(["T5"]);
    const plain = list.map((w) => ({ ...w, featured: false }));
    expect(featuredWorks(plain).map(workTitle)).toEqual(["T1", "T2", "T3"]);
  });

  test("sous-titre seulement s'il diffère du titre principal", () => {
    expect(workSubtitle({ source: "manual", kind: "MANGA", titleRomaji: "Vinland Saga", titleLocalized: "Vinland Saga" })).toBeUndefined();
    expect(workSubtitle({ source: "manual", kind: "ANIME", titleRomaji: "Sousou no Frieren", titleLocalized: "Frieren" })).toBe("Frieren");
  });

  test("hasJapanese", () => {
    expect(hasJapanese("Kōbō")).toBe(false);
    expect(hasJapanese("HUNTER×HUNTER")).toBe(false);
    expect(hasJapanese("工房")).toBe(true);
    expect(hasJapanese("カ")).toBe(true);
  });
});

describe("shareVersion", () => {
  const m = { id: 4, name: "Don Sergio", rank: "Monarque", photo: "/a.jpg", animeChar: "/b.jpg", color: "#c9a84c" } as Parameters<typeof shareVersion>[0];
  test("stable pour les mêmes données, change quand le visuel change", () => {
    expect(shareVersion(m)).toBe(shareVersion({ ...m }));
    expect(shareVersion(m)).not.toBe(shareVersion({ ...m, photo: "/c.jpg" }));
    expect(shareVersion(m)).not.toBe(shareVersion({ ...m, extras: { photoFocus: { x: 10, y: 10 } } }));
  });
});
