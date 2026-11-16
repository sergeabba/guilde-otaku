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

describe("lien du dossier Drive", () => {
  it("accepte le lien de partage complet ou l'identifiant seul", () => {
    const { parseFolderId } = jest.requireActual("../lib/drive") as typeof import("../lib/drive");
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
    expect(parseFolderId(`https://drive.google.com/drive/folders/${id}?usp=sharing`)).toBe(id);
    expect(parseFolderId(`https://drive.google.com/drive/u/0/folders/${id}`)).toBe(id);
    expect(parseFolderId(`https://drive.google.com/open?id=${id}`)).toBe(id);
    expect(parseFolderId(`  ${id} `)).toBe(id);
    expect(parseFolderId("https://exemple.com/pas-un-dossier")).toBeNull();
    expect(parseFolderId("")).toBeNull();
  });
});
