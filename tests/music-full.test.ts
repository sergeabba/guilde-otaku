import { youtubeMatches } from "../lib/music";
import { parseMemberExtras } from "../lib/member-extras";

describe("version complète sur YouTube", () => {
  const track = { title: "Blue Bird", artist: "Ikimonogakari" };
  it("accepte la même chanson (casse, accents, mentions officielles)", () => {
    expect(youtubeMatches(track, { title: "Ikimonogakari - Blue Bird (Official Video)", artist: "Ikimonogakari" })).toBe(true);
    expect(youtubeMatches({ title: "Gurenge", artist: "LiSA" }, { title: "Gurenge", artist: "LiSA Official YouTube" })).toBe(true);
  });
  it("refuse un autre morceau ou un autre artiste", () => {
    expect(youtubeMatches(track, { title: "Blue Bird cover piano", artist: "Animenz" })).toBe(false);
    expect(youtubeMatches(track, { title: "Silhouette", artist: "KANA-BOON" })).toBe(false);
    expect(youtubeMatches({ title: "", artist: "X" }, { title: "X" })).toBe(false);
  });
  it("garde la vidéo vérifiée seulement pour un morceau Spotify", () => {
    const x = parseMemberExtras({ music: [
      { provider: "spotify", id: "track/1234567890123456789012", title: "Blue Bird", fullVideo: "abcdefghijk", fullVideoTitle: "Blue Bird" },
      { provider: "youtube", id: "abcdefghijk", fullVideo: "zzzzzzzzzzz" },
      { provider: "spotify", id: "track/1234567890123456789013", fullVideo: "pas-valide" },
    ] });
    expect(x?.music?.[0].fullVideo).toBe("abcdefghijk");
    expect(x?.music?.[1].fullVideo).toBeUndefined();
    expect(x?.music?.[2].fullVideo).toBeUndefined();
  });
});
