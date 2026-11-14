import { bigThumb, cleanTitle, toVideo } from "../lib/drive";

describe("vidéos Google Drive", () => {
  it("nettoie le nom de fichier", () => {
    expect(cleanTitle("2024-12-24_Soirée_quiz.mp4")).toBe("Soirée quiz");
    expect(cleanTitle("Combat final.MOV")).toBe("Combat final");
    expect(cleanTitle(".mp4")).toBe(".mp4");
  });
  it("agrandit la miniature", () => {
    expect(bigThumb("https://lh3.googleusercontent.com/drive-storage/abc=s220")).toBe("https://lh3.googleusercontent.com/drive-storage/abc=w640");
    expect(bigThumb(undefined)).toBeNull();
  });
  it("convertit un fichier Drive", () => {
    const v = toVideo({ id: "abc_123", name: "Tournoi.mp4", mimeType: "video/mp4", videoMediaMetadata: { durationMillis: "65000" } }, "Fighters");
    expect(v).toMatchObject({ id: "abc_123", title: "Tournoi", durationMs: 65000, collection: "Fighters", thumb: null, description: null });
  });
});
