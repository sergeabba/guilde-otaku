import { parseMusicLink, isValidMusicId, embedUrl, openUrl } from "../lib/music";
import { parseMemberExtras, memberAwards } from "../lib/member-extras";

describe("parseMusicLink", () => {
  it.each([
    ["https://youtu.be/dQw4w9WgXcQ", { provider: "youtube", id: "dQw4w9WgXcQ" }],
    ["https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc", { provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC" }],
    ["https://open.spotify.com/intl-fr/track/4uLU6hMCjMI75M1A2tKUQC", { provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC" }],
    ["https://music.apple.com/fr/album/gurenge/1477817375?i=1477817376", { provider: "apple", id: "fr/album/gurenge/1477817375?i=1477817376" }],
    ["https://music.apple.com/fr/song/gurenge/1477817376", { provider: "apple", id: "fr/song/gurenge/1477817376" }],
  ])("%s", (url, ref) => expect(parseMusicLink(url)).toEqual(ref));

  it.each([
    "http://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
    "https://open.spotify.com/artist/4uLU6hMCjMI75M1A2tKUQC",
    "https://evil.example/track/4uLU6hMCjMI75M1A2tKUQC",
    "https://music.apple.com/fr/album/x/123?i=abc",
    "javascript:alert(1)",
  ])("refuse %s", (url) => expect(parseMusicLink(url)).toBeNull());

  it("construit les lecteurs officiels sans lecture au chargement de la page", () => {
    expect(embedUrl({ provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC" })).toBe("https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=generator");
    expect(embedUrl({ provider: "apple", id: "fr/album/gurenge/1477817375?i=1477817376" })).toBe("https://embed.music.apple.com/fr/album/gurenge/1477817375?i=1477817376");
    expect(openUrl({ provider: "youtube", id: "dQw4w9WgXcQ" })).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(isValidMusicId("apple", "fr/album/../../x/1")).toBe(false);
  });
});

describe("extras : palmarès et musique", () => {
  it("valide les distinctions et rejette le japonais, les années impossibles", () => {
    const x = parseMemberExtras({ awards: [
      { title: "Homme de l'année", year: 2024, description: "Élu par la Guilde" },
      { title: "MVP", year: "2025" },
      { title: "最優秀" }, { title: "" }, { title: "Vétéran", year: 1800 },
    ] });
    expect(x?.awards).toEqual([
      { title: "Homme de l'année", year: 2024, description: "Élu par la Guilde" },
      { title: "MVP", year: 2025 },
      { title: "Vétéran" },
    ]);
  });

  it("garde les anciens morceaux YouTube et accepte Spotify, Apple, sans doublon", () => {
    const x = parseMemberExtras({ music: [
      { provider: "youtube", id: "dQw4w9WgXcQ", title: "Ancien" },
      { provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC", title: "Gurenge", artist: "LiSA" },
      { provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC" },
      { provider: "deezer", id: "123" },
    ] });
    expect(x?.music).toEqual([
      { provider: "youtube", id: "dQw4w9WgXcQ", title: "Ancien" },
      { provider: "spotify", id: "track/4uLU6hMCjMI75M1A2tKUQC", title: "Gurenge", artist: "LiSA" },
    ]);
  });

  it("palmarès : reprend l'ancienne distinction sans en inventer", () => {
    expect(memberAwards({ badge: "BALLON D'OR 2026" })).toEqual([{ title: "BALLON D'OR 2026" }]);
    expect(memberAwards({ badge: null })).toEqual([]);
    expect(memberAwards({ badge: "X", extras: { awards: [{ title: "MVP" }] } })).toEqual([{ title: "MVP" }]);
  });
});
