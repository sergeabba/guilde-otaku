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

describe("vue publique d'un dossier Drive (sans clé)", () => {
  const { parseEmbeddedFolder, publicThumb } = jest.requireActual("../lib/drive") as typeof import("../lib/drive");
  const entry = (id: string, href: string, icon: string, title: string) =>
    `<div class="flip-entry" id="entry-${id}" tabindex="0" role="link"><div class="flip-entry-info"><a href="${href}" target="_blank"><div class="flip-entry-visual"></div><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/${icon}" alt=""/></div><div class="flip-entry-title">${title}</div></a></div><div class="flip-entry-last-modified"><div>4:16 pm</div></div></div>`;
  const html = `<div class="flip-entries">${[
    entry("1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "https://drive.google.com/file/d/1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/view?usp=drive_web", "video/mp4", "Soirée quiz &amp; karaok&#233;.mp4"),
    entry("1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "https://drive.google.com/drive/folders/1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "application/vnd.google-apps.folder", "Tournois"),
    entry("1cccccccccccccccccccccccccccccccc", "https://drive.google.com/file/d/1cccccccccccccccccccccccccccccccc/view", "image/jpeg", "affiche.jpg"),
  ].join("")}</div>`;

  it("distingue vidéos, sous-dossiers et autres fichiers", () => {
    const list = parseEmbeddedFolder(html);
    expect(list.map((e) => e.kind)).toEqual(["video", "folder", "other"]);
    expect(list[0]).toMatchObject({ id: "1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", name: "Soirée quiz & karaoké.mp4" });
    expect(list[1].name).toBe("Tournois");
  });

  it("donne une vignette stable", () => {
    expect(publicThumb("1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 640)).toBe("https://lh3.googleusercontent.com/d/1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=w640");
  });
});
