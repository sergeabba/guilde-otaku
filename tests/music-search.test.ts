import { itunesToCandidates, oembedToCandidate, safeCover, searchLinks } from "../lib/music-search";
import { parseMemberExtras } from "../lib/member-extras";

describe("recherche de musique", () => {
  it("convertit les résultats iTunes en morceaux Apple Music avec pochette", () => {
    const json = { resultCount: 2, results: [
      { kind: "song", trackId: 1477817376, trackName: "Gurenge", artistName: "LiSA", collectionName: "LEO-NiNE",
        trackViewUrl: "https://music.apple.com/fr/album/gurenge/1477817375?i=1477817376&uo=4",
        artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/aa/bb/cc/source/100x100bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/x.m4a" },
      { kind: "music-video", trackViewUrl: "https://music.apple.com/fr/music-video/x/1" },
    ] };
    expect(itunesToCandidates(json)).toEqual([{
      provider: "apple", id: "fr/album/gurenge/1477817375?i=1477817376", source: "itunes",
      title: "Gurenge", artist: "LiSA", album: "LEO-NiNE",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/aa/bb/cc/source/600x600bb.jpg",
      previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/x.m4a",
    }]);
    expect(itunesToCandidates({})).toEqual([]);
  });

  it("lit oEmbed Spotify (sans artiste inventé) et YouTube (chaîne proposée)", () => {
    expect(oembedToCandidate({ provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC" }, { title: "Gurenge", thumbnail_url: "https://i.scdn.co/image/abc", provider_name: "Spotify" }))
      .toEqual({ provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC", source: "spotify-oembed", title: "Gurenge", cover: "https://i.scdn.co/image/abc" });
    expect(oembedToCandidate({ provider: "youtube", id: "dQw4w9WgXcQ" }, { title: "Clip", author_name: "LiSA - Topic", thumbnail_url: "https://i.ytimg.com/vi/x/hqdefault.jpg" }))
      .toMatchObject({ title: "Clip", artist: "LiSA", cover: "https://i.ytimg.com/vi/x/hqdefault.jpg" });
  });

  it("n'accepte que les pochettes des services", () => {
    expect(safeCover("https://evil.example/a.jpg")).toBeUndefined();
    expect(safeCover("http://i.scdn.co/image/a")).toBeUndefined();
    expect(safeCover("https://i.ytimg.com/vi/x/0.jpg")).toBe("https://i.ytimg.com/vi/x/0.jpg");
  });

  it("propose des liens de recherche, pas des liens de morceau", () => {
    expect(searchLinks("LiSA Gurenge").spotify).toBe("https://open.spotify.com/search/LiSA%20Gurenge");
  });

  it("enregistre pochette, album et synopsis validés", () => {
    const x = parseMemberExtras({
      music: [{ provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC", title: "Gurenge", cover: "https://i.scdn.co/image/abc", album: "LEO-NiNE" },
              { provider: "youtube", id: "dQw4w9WgXcQ", cover: "https://evil.example/x.jpg" }],
      favoriteAnime: [{ source: "manual", kind: "ANIME", titleRomaji: "Frieren", synopsis: "Après la défaite du roi démon, une elfe repart sur les routes." },
                      { source: "manual", kind: "ANIME", titleRomaji: "X", synopsis: "日本語の説明" }],
    });
    expect(x?.music?.[0]).toEqual({ provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC", title: "Gurenge", album: "LEO-NiNE", cover: "https://i.scdn.co/image/abc" });
    expect(x?.music?.[1]).toEqual({ provider: "youtube", id: "dQw4w9WgXcQ" });
    expect(x?.favoriteAnime?.[0].synopsis).toBe("Après la défaite du roi démon, une elfe repart sur les routes.");
    expect(x?.favoriteAnime?.[1].synopsis).toBeUndefined();
  });
});
