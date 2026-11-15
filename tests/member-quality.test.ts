import { auditMedia, birthdayOk, mediaRefs, validateMembers } from "../lib/services/member-quality";

const base = { bio: "Présentation.", photo: "/photos/a.jpg", animechar: "/anime/a.jpg", birthday: "21 juin" };
const codes = (r: ReturnType<typeof validateMembers>, id: number) => r.issues.filter((i) => i.memberId === id).map((i) => i.code);

describe("members:validate", () => {
  it("lit les anniversaires au format du site", () => {
    expect(birthdayOk("21 juin")).toBe(true);
    expect(birthdayOk("01 Août")).toBe(true);
    expect(birthdayOk("juin 21")).toBe(false);
    expect(birthdayOk("")).toBe(false);
  });

  it("signale portraits manquants, japonais, doublons de nom et de photo", () => {
    const r = validateMembers([
      { id: 1, name: "Craig", ...base },
      { id: 2, name: "craig ", ...base, photo: "/photos/a.jpg" },
      { id: 3, name: "Nagi", ...base, photo: "", animechar: "", bio: "ナギ", photo_extra: undefined } as never,
    ]);
    expect(codes(r, 1)).toEqual(expect.arrayContaining(["name-duplicate", "photo-duplicate"]));
    expect(codes(r, 3)).toEqual(expect.arrayContaining(["photo-missing", "animechar-missing", "japanese"]));
    expect(r.counts.error).toBe(3);
    expect(r.issues[0].level).toBe("error");
  });

  it("signale les favoris écartés et en double, sans rien modifier", () => {
    const extras = {
      favoriteAnime: [
        { source: "anilist", sourceId: 21, kind: "ANIME", titleRomaji: "One Piece", coverUrl: "https://s4.anilist.co/x.jpg" },
        { source: "anilist", sourceId: 21, kind: "ANIME", titleRomaji: "One Piece", coverUrl: "https://s4.anilist.co/x.jpg" },
        { nope: true },
      ],
    };
    const row = { id: 4, name: "Floriane", ...base, extras };
    const copy = JSON.stringify(row);
    const r = validateMembers([row]);
    expect(codes(r, 4)).toEqual(expect.arrayContaining(["favoriteAnime-dropped", "favorite-duplicate"]));
    expect(JSON.stringify(row)).toBe(copy);
  });

  it("signale un profil enrichi illisible", () => {
    const r = validateMembers([{ id: 5, name: "Don", ...base, extras: "{pas du json" }]);
    expect(codes(r, 5)).toContain("extras-json");
  });
});

describe("media:audit", () => {
  it("liste les images qui ne répondent pas, une requête par adresse", async () => {
    const rows = [{ id: 1, name: "A", ...base }, { id: 2, name: "B", ...base, photo: "https://x.test/dead.jpg" }];
    const calls: string[] = [];
    const fetchImpl = (async (u: string) => { calls.push(u); return { ok: !u.includes("dead"), status: u.includes("dead") ? 404 : 200 }; }) as unknown as typeof fetch;
    const { checked, problems } = await auditMedia(mediaRefs(rows), "https://site.test", { fetchImpl });
    expect(checked).toBe(3);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ memberId: 2, status: 404 });
    expect(calls.filter((c) => c === "https://site.test/anime/a.jpg")).toHaveLength(1);
  });
});
